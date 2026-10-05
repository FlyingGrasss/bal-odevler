import { describe, expect, it } from "vitest";
import { homeworkInputSchema, homeworkWriterInputSchema } from "../lib/validation";
import { dateOnlyToDate, formatHomeworkDate, getHomeworkDateStatus } from "../lib/homework-display";
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
