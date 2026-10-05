import { describe, expect, it } from "vitest";
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
