import { describe, expect, it } from "vitest";
import { authSecret } from "../lib/auth-secret";
import { SESSION_COOKIE } from "../lib/constants";
import { createSessionToken } from "../lib/session-token";
import { homeworkInputSchema, homeworkWriterInputSchema } from "../lib/validation";
import { dateOnlyToDate, formatHomeworkDate, getHomeworkDateStatus } from "../lib/homework-display";
import { COMPLETED_ID_LIMIT, encodeCompletedIds, parseCompletedIds, toggleCompletedId } from "../lib/homework-completed";
import { createHomeworkToken, hashHomeworkToken, hashesMatch } from "../lib/homework-security";

describe("homework validation", () => {
  const base = { title: "Türev tekrar ödevi", description: "", subject: "MATEMATIK" as const, dueText: "ilk derse", dueDate: "2026-10-04" };

  it("requires a valid date-only due date and homework subject", () => {
    expect(homeworkInputSchema.safeParse(base).success).toBe(true);
    expect(homeworkInputSchema.safeParse({ ...base, dueDate: "2026-02-31" }).success).toBe(false);
    expect(homeworkInputSchema.safeParse({ ...base, dueDate: "2026-10-04T12:00:00" }).success).toBe(false);
  });

  it("accepts optional notDoneStudents text", () => {
    expect(homeworkInputSchema.safeParse({ ...base, notDoneStudents: "Kerem uygur\ntoprak doğan" }).success).toBe(true);
    expect(homeworkInputSchema.safeParse({ ...base, notDoneStudents: "a".repeat(5001) }).success).toBe(false);
  });

  it("requires fixed subjects only for teacher writers", () => {
    expect(homeworkWriterInputSchema.safeParse({ name: "Matematik Öğretmeni", kind: "TEACHER", fixedSubject: "MATEMATIK" }).success).toBe(true);
    expect(homeworkWriterInputSchema.safeParse({ name: "Akıllı Tahta", kind: "SMART_BOARD", fixedSubject: null }).success).toBe(true);
    expect(homeworkWriterInputSchema.safeParse({ name: "Öğretmen", kind: "TEACHER", fixedSubject: null }).success).toBe(false);
    expect(homeworkWriterInputSchema.safeParse({ name: "Tahta", kind: "SMART_BOARD", fixedSubject: "FIZIK" }).success).toBe(false);
  });
});

describe("completed homework cookie", () => {
  it("round-trips ids through the cookie encoding", () => {
    const ids = ["a1", "b2", "c3"];
    expect(parseCompletedIds(encodeCompletedIds(ids))).toEqual(ids);
  });

  it("treats missing, malformed and non-string values as no completions", () => {
    expect(parseCompletedIds(undefined)).toEqual([]);
    expect(parseCompletedIds("")).toEqual([]);
    expect(parseCompletedIds("not-json")).toEqual([]);
    expect(parseCompletedIds(encodeURIComponent('{"id":"a1"}'))).toEqual([]);
    expect(parseCompletedIds(encodeURIComponent('["a1",7,null]'))).toEqual(["a1"]);
  });

  it("keeps the cookie inside the browser size budget by dropping the oldest ids", () => {
    const ids = Array.from({ length: COMPLETED_ID_LIMIT + 25 }, (_, index) => `id-${index}`);
    const stored = parseCompletedIds(encodeCompletedIds(ids));
    expect(stored).toHaveLength(COMPLETED_ID_LIMIT);
    expect(stored.at(-1)).toBe("id-" + (ids.length - 1));
  });

  it("toggles a single id without duplicating or losing the others", () => {
    expect(toggleCompletedId(["a", "b"], "c")).toEqual(["a", "b", "c"]);
    expect(toggleCompletedId(["a", "b", "c"], "b")).toEqual(["a", "c"]);
    expect(toggleCompletedId([], "a")).toEqual(["a"]);
  });
});

describe("homework credential boundaries", () => {
  it("hashes keys and compares only equal-length digests", () => {
    const raw = createHomeworkToken();
    const digest = hashHomeworkToken(raw);
    expect(digest).not.toContain(raw);
    expect(hashesMatch(digest, hashHomeworkToken(raw))).toBe(true);
    expect(hashesMatch(digest, hashHomeworkToken(`${raw}-different`))).toBe(false);
    expect(hashesMatch(digest, "00")).toBe(false);
  });

  it("keeps date-only homework on the Istanbul calendar date", () => {
    const date = dateOnlyToDate("2026-10-04");
    expect(formatHomeworkDate(date!)).toContain("4 Ekim 2026");
    expect(getHomeworkDateStatus("2026-10-03", false, new Date("2026-10-04T12:00:00Z"))).toBe("overdue");
    expect(getHomeworkDateStatus("2026-10-04", false, new Date("2026-10-04T12:00:00Z"))).toBe("today");
    expect(getHomeworkDateStatus("2026-10-05", false, new Date("2026-10-04T12:00:00Z"))).toBe("upcoming");
    expect(getHomeworkDateStatus("2026-10-05", true, new Date("2026-10-04T12:00:00Z"))).toBe("overdue");
  });
});

describe("proxy redirect boundaries", () => {
  it("never redirects /panel to itself when authenticated", async () => {
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("../proxy");
    const { HOMEWORK_WRITER_COOKIE } = await import("../lib/constants");

    const panelReq = new NextRequest("http://localhost:3000/panel", {
      headers: { cookie: `${HOMEWORK_WRITER_COOKIE}=some-session-token` },
    });
    const panelRes = await proxy(panelReq);
    expect(panelRes.headers.get("location")).toBeNull();

    const rootReqWithCookie = new NextRequest("http://localhost:3000/", {
      headers: { cookie: `${HOMEWORK_WRITER_COOKIE}=some-session-token` },
    });
    const rootRes = await proxy(rootReqWithCookie);
    expect(rootRes.headers.get("location")).toBe("http://localhost:3000/panel");

    const rootReqNoCookie = new NextRequest("http://localhost:3000/");
    const rootResNoCookie = await proxy(rootReqNoCookie);
    expect(rootResNoCookie.headers.get("location")).toBeNull();
  });
});

describe("admin proxy authentication", () => {
  async function requestFor(pathname: string, cookie?: string) {
    const { NextRequest } = await import("next/server");
    return new NextRequest(`http://localhost:3000${pathname}`, {
      headers: cookie ? { cookie } : undefined,
    });
  }

  function expectAdminRedirect(response: Response, expectedNext: string) {
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    const url = new URL(location!);
    expect(url.pathname).toBe("/auth/bal-id");
    expect(url.searchParams.get("next")).toBe(expectedNext);
  }

  it("redirects anonymous /admin requests to the admin login", async () => {
    const { proxy } = await import("../proxy");
    expectAdminRedirect(await proxy(await requestFor("/admin")), "/admin");
  });

  it("redirects requests with a garbage session cookie", async () => {
    const { proxy } = await import("../proxy");
    const response = await proxy(await requestFor("/admin", `${SESSION_COOKIE}=not-a-session-token`));
    expectAdminRedirect(response, "/admin");
  });

  it("allows a valid admin session token", async () => {
    const { proxy } = await import("../proxy");
    const token = createSessionToken("admin-user", authSecret());
    const response = await proxy(await requestFor("/admin", `${SESSION_COOKIE}=${token}`));
    expect(response.status).toBeLessThan(300);
    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves the full admin pathname in the next parameter", async () => {
    const { proxy } = await import("../proxy");
    expectAdminRedirect(await proxy(await requestFor("/admin/alt")), "/admin/alt");
  });

  it("leaves the writer-root behavior unchanged on /", async () => {
    const { proxy } = await import("../proxy");
    const token = createSessionToken("admin-user", authSecret());

    const adminRoot = await proxy(await requestFor("/", `${SESSION_COOKIE}=${token}`));
    expect(adminRoot.status).toBe(200);
    expect(adminRoot.headers.get("location")).toBeNull();

    const anonymousRoot = await proxy(await requestFor("/"));
    expect(anonymousRoot.status).toBe(200);
    expect(anonymousRoot.headers.get("location")).toBeNull();
  });
});
