import { GradeLevel, HomeworkSubject, HomeworkWriterKind } from "@prisma/client";
import { z } from "zod";

const gradeSchema = z.enum(GradeLevel);

export const noteInputSchema = z
  .object({
    title: z.string().trim().min(5, "Başlık en az 5 karakter olmalı.").max(120),
    description: z.string().trim().max(2000).optional().default(""),
    gradeLevel: gradeSchema,
    subjectId: z.string().trim().max(80).optional().nullable(),
    customSubject: z.string().trim().max(60).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasSubject = Boolean(value.subjectId);
    const hasCustom = Boolean(value.customSubject);
    if (hasSubject === hasCustom) {
      ctx.addIssue({
        code: "custom",
        path: ["subjectId"],
        message: "Bir ders seçin veya Diğer alanını doldurun.",
      });
    }
    if (hasCustom && value.customSubject!.length < 2) {
      ctx.addIssue({ code: "custom", path: ["customSubject"], message: "Ders adı en az 2 karakter olmalı." });
    }
  });

export const quoteInputSchema = z.object({
  teacherName: z.string().trim().min(2, "Öğretmen adı en az 2 karakter olmalı.").max(80),
  quote: z.string().trim().min(5, "Söz en az 5 karakter olmalı.").max(280),
  context: z.string().trim().max(300).optional().default(""),
  gradeLevel: gradeSchema.optional().nullable(),
  subjectId: z.string().trim().max(80).optional().nullable(),
});

export const subjectInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(60),
  gradeLevel: gradeSchema,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const moderationSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  recommended: z.boolean().optional().default(false),
  reason: z.string().trim().max(1000).optional().default(""),
});

export const banSchema = z.object({
  userId: z.string().min(1),
  noteId: z.string().optional(),
  reason: z.string().trim().min(3, "Yasaklama nedeni en az 3 karakter olmalı.").max(1000),
});

export const homeworkInputSchema = z.object({
  title: z.string().trim().min(2, "Ödev başlığı en az 2 karakter olmalı.").max(120),
  description: z.string().trim().max(2000, "Açıklama en fazla 2000 karakter olabilir.").optional().default(""),
  subject: z.enum(HomeworkSubject),
  dueText: z.string().trim().min(1, "Teslim bilgisini yazın.").max(160, "Teslim bilgisi en fazla 160 karakter olabilir."),
  dueDate: z.string().trim().max(10).optional().default(""),
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

export type NoteInput = z.infer<typeof noteInputSchema>;
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type HomeworkInput = z.infer<typeof homeworkInputSchema>;
export type HomeworkWriterInput = z.infer<typeof homeworkWriterInputSchema>;

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message || "Bilgileri kontrol edip tekrar deneyin.";
}
