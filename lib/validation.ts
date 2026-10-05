import { HomeworkSubject, HomeworkWriterKind } from "@prisma/client";
import { z } from "zod";

export const homeworkInputSchema = z.object({
  title: z.string().trim().min(2, "Ödev başlığı en az 2 karakter olmalı.").max(120),
  description: z.string().trim().max(2000, "Açıklama en fazla 2000 karakter olabilir.").optional().default(""),
  subject: z.enum(HomeworkSubject),
  dueText: z.string().trim().max(160, "Teslim bilgisi en fazla 160 karakter olabilir.").optional().default(""),
  dueDate: z.string().trim().max(10).optional().default(""),
  isPast: z.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (!value.dueDate) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.dueDate)) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Sıralama tarihi geçerli değil." });
    return;
  }
  const [year, month, day] = value.dueDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Sıralama tarihi geçerli değil." });
  }
});

export const homeworkWriterInputSchema = z.object({
  name: z.string().trim().min(2, "Yazar adı en az 2 karakter olmalı.").max(80),
  kind: z.enum(HomeworkWriterKind),
  fixedSubject: z.enum(HomeworkSubject).optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.kind === "TEACHER" && !value.fixedSubject) {
    ctx.addIssue({ code: "custom", path: ["fixedSubject"], message: "Öğretmen için sabit ders seçin." });
  }
  if (value.kind === "SMART_BOARD" && value.fixedSubject) {
    ctx.addIssue({ code: "custom", path: ["fixedSubject"], message: "Akıllı tahta yazarı için sabit ders seçilmez." });
  }
});

export type HomeworkInput = z.infer<typeof homeworkInputSchema>;
export type HomeworkWriterInput = z.infer<typeof homeworkWriterInputSchema>;

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message || "Bilgileri kontrol edip tekrar deneyin.";
}
