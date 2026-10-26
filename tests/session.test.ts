import { Buffer } from "node:buffer";
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "../lib/constants";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_VERSION,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
  type SessionClaims,
} from "../lib/session-token";

const SECRET = "test-session-secret";
const NOW = Date.UTC(2026, 9, 26, 12, 0, 0);
const NOW_SECONDS = Math.floor(NOW / 1000);

function deriveKey(secret = SECRET) {
  return createHmac("sha256", secret).update("bal-odevler:admin-session:v1").digest();
}

function sign(payload: string, secret = SECRET, version = SESSION_VERSION) {
  return createHmac("sha256", deriveKey(secret)).update(`${version}.${payload}`).digest("base64url");
}

function encode(value: unknown) {
  const json = typeof value === "string" ? value : JSON.stringify(value);
  return Buffer.from(json, "utf8").toString("base64url");
}

function makeToken(
  payload: unknown,
  options?: { secret?: string; version?: string },
) {
  const version = options?.version ?? SESSION_VERSION;
  const encoded = encode(payload);
  return `${version}.${encoded}.${sign(encoded, options?.secret ?? SECRET, version)}`;
}

function verify(token: string | null | undefined, secret = SECRET): SessionClaims | null {
  return verifySessionToken(token, secret, { now: NOW });
}

describe("session token", () => {
  it("round-trips a valid token with the documented format", () => {
    const token = createSessionToken("user-123", SECRET, { now: NOW });
    const [version, payload, signature] = token.split(".");

    expect(version).toBe("v1");
    expect(signature).toHaveLength(43);
    expect(JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))).toEqual({
      sub: "user-123",
      exp: NOW_SECONDS + SESSION_MAX_AGE_SECONDS,
    });
    expect(verify(token)).toEqual({
      sub: "user-123",
      exp: NOW_SECONDS + SESSION_MAX_AGE_SECONDS,
    });
  });

  it("honors a custom max age", () => {
    const token = createSessionToken("user-123", SECRET, { now: NOW, maxAgeSeconds: 60 });
    expect(verify(token)).toEqual({ sub: "user-123", exp: NOW_SECONDS + 60 });
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken("user-123", SECRET, { now: NOW });
    expect(verify(token, "another-secret")).toBeNull();
  });

  it("rejects a tampered payload even when the signature is well formed", () => {
    const token = createSessionToken("user-123", SECRET, { now: NOW });
    const [version, payload, signature] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const tamperedPayload = encode({ ...decoded, sub: "attacker" });

    expect(verify(`${version}.${tamperedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken("user-123", SECRET, { now: NOW });
    const [version, payload, signature] = token.split(".");
    const first = signature[0] === "A" ? "B" : "A";

    expect(verify(`${version}.${payload}.${first}${signature.slice(1)}`)).toBeNull();
  });

  it("rejects empty and oversized session subjects", () => {
    expect(() => createSessionToken("", SECRET, { now: NOW })).toThrow(
      "Geçersiz oturum kullanıcısı.",
    );
    expect(() => createSessionToken("a".repeat(129), SECRET, { now: NOW })).toThrow(
      "Geçersiz oturum kullanıcısı.",
    );
  });

  it("accepts session subjects at the one and 128 character boundaries", () => {
    const shortest = createSessionToken("a", SECRET, { now: NOW });
    const longest = createSessionToken("a".repeat(128), SECRET, { now: NOW });

    expect(verify(shortest)?.sub).toBe("a");
    expect(verify(longest)?.sub).toBe("a".repeat(128));
  });

  it("rejects a token at and after its expiry boundary", () => {
    const expiring = createSessionToken("user-123", SECRET, { now: NOW, maxAgeSeconds: 0 });
    const past = makeToken({ sub: "user-123", exp: NOW_SECONDS - 1 });
    const valid = createSessionToken("user-123", SECRET, { now: NOW, maxAgeSeconds: 60 });

    expect(verify(expiring)).toBeNull();
    expect(verify(past)).toBeNull();
    expect(verifySessionToken(valid, SECRET, { now: (NOW_SECONDS + 59) * 1000 })).not.toBeNull();
    expect(verifySessionToken(valid, SECRET, { now: (NOW_SECONDS + 60) * 1000 })).toBeNull();
  });
});

describe("session token malformed input", () => {
  const validPayload = encode({ sub: "user-123", exp: NOW_SECONDS + 60 });
  const validSignature = sign(validPayload);

  const malformed: Array<[string, string | null | undefined]> = [
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
    ["only the version", SESSION_VERSION],
    ["missing signature", `${SESSION_VERSION}.${validPayload}`],
    ["extra part", `${SESSION_VERSION}.${validPayload}.${validSignature}.extra`],
    ["wrong version", makeToken({ sub: "user-123", exp: NOW_SECONDS + 60 }, { version: "v2" })],
    ["invalid base64url payload", `${SESSION_VERSION}.!!!.${validSignature}`],
    ["invalid base64url signature", `${SESSION_VERSION}.${validPayload}.${"!".repeat(43)}`],
    ["short signature", `${SESSION_VERSION}.${validPayload}.${validSignature.slice(0, 42)}`],
    ["invalid JSON", makeToken("not-json")],
    ["wrong payload shape", makeToken({ sub: 123, exp: NOW_SECONDS + 60 })],
    ["oversized token", "a".repeat(2049)],
  ];

  for (const [label, token] of malformed) {
    it(`returns null without throwing for ${label}`, () => {
      expect(() => verify(token)).not.toThrow();
      expect(verify(token)).toBeNull();
    });
  }

  it("rejects malformed claims even when they are validly signed", () => {
    expect(verify(makeToken([]))).toBeNull();
    expect(verify(makeToken({ sub: "", exp: NOW_SECONDS + 60 }))).toBeNull();
    expect(verify(makeToken({ sub: "a".repeat(129), exp: NOW_SECONDS + 60 }))).toBeNull();
    expect(verify(makeToken({ sub: "user-123", exp: NOW_SECONDS + 1.5 }))).toBeNull();
    expect(verify(makeToken({ sub: "user-123", exp: `${NOW_SECONDS + 60}` }))).toBeNull();
  });
});

describe("session cookie", () => {
  it("uses a dedicated cookie name", () => {
    expect(SESSION_COOKIE).toBe("bal_odevler_session");
  });

  it("returns hardened options for secure cookies", () => {
    expect(sessionCookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 31536000,
    });
    expect(SESSION_MAX_AGE_SECONDS).toBe(31536000);
  });

  it("omits secure outside production and accepts a custom max age", () => {
    expect(sessionCookieOptions(false)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 31536000,
    });
    expect(sessionCookieOptions(false, 120)).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 120,
    });
  });
});
