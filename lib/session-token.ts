import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_VERSION = "v1";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type SessionClaims = { sub: string; exp: number };

const SESSION_DOMAIN = "bal-odevler:admin-session:v1";
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const SIGNATURE_LENGTH = 43;
const MAX_TOKEN_LENGTH = 2048;

function deriveKey(secret: string) {
  return createHmac("sha256", secret).update(SESSION_DOMAIN).digest();
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", deriveKey(secret))
    .update(`${SESSION_VERSION}.${payload}`)
    .digest("base64url");
}

export function createSessionToken(
  userId: string,
  secret: string,
  options?: { now?: number; maxAgeSeconds?: number },
): string {
  if (userId.length < 1 || userId.length > 128) {
    throw new Error("Geçersiz oturum kullanıcısı.");
  }
  const now = options?.now ?? Date.now();
  const maxAgeSeconds = options?.maxAgeSeconds ?? SESSION_MAX_AGE_SECONDS;
  const exp = Math.floor(now / 1000) + maxAgeSeconds;
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp }), "utf8").toString("base64url");

  return `${SESSION_VERSION}.${payload}.${signPayload(payload, secret)}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  options?: { now?: number },
): SessionClaims | null {
  try {
    if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [version, payloadPart, signaturePart] = parts;
    if (version !== SESSION_VERSION) return null;
    if (!BASE64URL_PATTERN.test(payloadPart) || !BASE64URL_PATTERN.test(signaturePart)) return null;
    if (signaturePart.length !== SIGNATURE_LENGTH) return null;

    const payloadBytes = Buffer.from(payloadPart, "base64url");
    const signatureBytes = Buffer.from(signaturePart, "base64url");
    if (signatureBytes.length !== 32) return null;
    if (payloadBytes.length === 0) return null;
    if (payloadBytes.toString("base64url") !== payloadPart) return null;
    if (signatureBytes.toString("base64url") !== signaturePart) return null;

    const expectedSignature = createHmac("sha256", deriveKey(secret))
      .update(`${version}.${payloadPart}`)
      .digest();
    if (expectedSignature.length !== signatureBytes.length) return null;
    if (!timingSafeEqual(expectedSignature, signatureBytes)) return null;

    const payload: unknown = JSON.parse(payloadBytes.toString("utf8"));
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;

    const { sub, exp } = payload as Record<string, unknown>;
    if (typeof sub !== "string" || sub.length < 1 || sub.length > 128) return null;
    if (typeof exp !== "number" || !Number.isInteger(exp)) return null;

    const nowSeconds = Math.floor((options?.now ?? Date.now()) / 1000);
    if (exp <= nowSeconds) return null;

    return { sub, exp };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(
  secure: boolean,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS,
): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
