"use server";

import { del } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { banSchema, firstZodError, moderationSchema, subjectInputSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/actions/notes";
import { CACHE_TAGS } from "@/lib/cache-tags";

function refreshContent() {
  updateTag(CACHE_TAGS.notes);
  updateTag(CACHE_TAGS.quotes);
  updateTag(CACHE_TAGS.subjects);
  revalidatePath("/");
  revalidatePath("/notlar");
  revalidatePath("/notlar/filtre");
  revalidatePath("/sozler");
  revalidatePath("/admin");
}

export async function moderateNote(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = moderationSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (parsed.data.decision === "REJECTED" && !parsed.data.reason) {
    return { success: false, error: "Yazar için bir ret nedeni yazın." };
  }
  const note = await db.note.findUnique({ where: { id: parsed.data.id }, select: { id: true } });
  if (!note) return { success: false, error: "Not bulunamadı." };
  await db.note.update({
    where: { id: note.id },
    data: {
      status: parsed.data.decision,
      rejectionReason: parsed.data.decision === "REJECTED" ? parsed.data.reason : null,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      publishedAt: parsed.data.decision === "APPROVED" ? new Date() : null,
      isRecommended: parsed.data.decision === "APPROVED" ? parsed.data.recommended : false,
      recommendedAt: parsed.data.decision === "APPROVED" && parsed.data.recommended ? new Date() : null,
    },
  });
  refreshContent();
  updateTag(CACHE_TAGS.note(note.id));
  revalidatePath(`/notlar/${note.id}`, "page");
  return { success: true, data: undefined };
}

export async function moderateQuote(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = moderationSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  if (parsed.data.decision === "REJECTED" && !parsed.data.reason) return { success: false, error: "Yazar için bir ret nedeni yazın." };
  const result = await db.teacherQuote.updateMany({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.decision,
      rejectionReason: parsed.data.decision === "REJECTED" ? parsed.data.reason : null,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      publishedAt: parsed.data.decision === "APPROVED" ? new Date() : null,
    },
  });
  if (!result.count) return { success: false, error: "Söz bulunamadı." };
  refreshContent();
  return { success: true, data: undefined };
}

export async function toggleRecommended(noteId: string): Promise<ActionResult<{ recommended: boolean }>> {
  await requireAdmin();
  const note = await db.note.findFirst({ where: { id: noteId, status: "APPROVED" }, select: { isRecommended: true } });
  if (!note) return { success: false, error: "Yalnızca onaylanmış notlar önerilebilir." };
  const recommended = !note.isRecommended;
  await db.note.update({ where: { id: noteId }, data: { isRecommended: recommended, recommendedAt: recommended ? new Date() : null } });
  refreshContent();
  return { success: true, data: { recommended } };
}

export async function saveSubject(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = subjectInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  const slug = slugify(parsed.data.name);
  try {
    if (parsed.data.id) {
      const existing = await db.subject.findUnique({
        where: { id: parsed.data.id },
        select: { gradeLevel: true, _count: { select: { notes: true } } },
      });
      if (!existing) return { success: false, error: "Ders bulunamadı." };
      if (existing.gradeLevel !== parsed.data.gradeLevel && existing._count.notes > 0) {
        return {
          success: false,
          error: "Notlarda kullanılan bir dersin sınıfı değiştirilemez. Yeni bir ders oluşturun.",
        };
      }
      await db.subject.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, gradeLevel: parsed.data.gradeLevel, slug, sortOrder: parsed.data.sortOrder } });
    } else {
      await db.subject.create({ data: { name: parsed.data.name, gradeLevel: parsed.data.gradeLevel, slug, sortOrder: parsed.data.sortOrder } });
    }
  } catch {
    return { success: false, error: "Bu sınıfta aynı adlı bir ders zaten var." };
  }
  updateTag(CACHE_TAGS.subjects);
  revalidatePath("/admin");
  revalidatePath("/paylas");
  revalidatePath("/notlar");
  return { success: true, data: undefined };
}

export async function toggleSubject(subjectId: string): Promise<ActionResult<{ active: boolean }>> {
  await requireAdmin();
  const subject = await db.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return { success: false, error: "Ders bulunamadı." };
  const active = !subject.isActive;
  await db.subject.update({ where: { id: subject.id }, data: { isActive: active } });
  updateTag(CACHE_TAGS.subjects);
  revalidatePath("/admin");
  revalidatePath("/paylas");
  return { success: true, data: { active } };
}

export async function deleteSubject(subjectId: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await db.note.count({ where: { subjectId } });
  if (count) return { success: false, error: "Bu ders mevcut notlarda kullanılıyor; silmek yerine pasifleştirin." };
  await db.subject.deleteMany({ where: { id: subjectId } });
  updateTag(CACHE_TAGS.subjects);
  revalidatePath("/admin");
  revalidatePath("/paylas");
  return { success: true, data: undefined };
}

export async function deleteNoteAsAdmin(noteId: string): Promise<ActionResult> {
  await requireAdmin();
  const note = await db.note.findUnique({ where: { id: noteId }, include: { assets: { select: { pathname: true } } } });
  if (!note) return { success: false, error: "Not bulunamadı." };
  await db.note.delete({ where: { id: note.id } });
  if (note.assets.length) void del(note.assets.map((asset) => asset.pathname)).catch(console.error);
  refreshContent();
  return { success: true, data: undefined };
}

export async function banUser(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = banSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: firstZodError(parsed.error) };
  const target = await db.user.findUnique({
    where: { id: parsed.data.userId },
    include: { notes: { include: { assets: { select: { pathname: true } } } } },
  });
  if (!target) return { success: false, error: "Kullanıcı bulunamadı." };
  if (isAdminEmail(target.email)) return { success: false, error: "Yönetici izin listesindeki bir hesap yasaklanamaz." };

  const paths = target.notes.flatMap((note) => note.assets.map((asset) => asset.pathname));
  await db.$transaction([
    db.noteVote.deleteMany({ where: { userId: target.id } }),
    db.note.deleteMany({ where: { authorId: target.id } }),
    db.teacherQuote.deleteMany({ where: { authorId: target.id } }),
    db.user.update({
      where: { id: target.id },
      data: { status: "BANNED", banReason: parsed.data.reason, bannedAt: new Date(), bannedById: admin.id },
    }),
  ]);
  if (paths.length) void del(paths).catch(console.error);
  refreshContent();
  return { success: true, data: undefined };
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await db.user.updateMany({ where: { id: userId, status: "BANNED" }, data: { status: "ACTIVE", banReason: null, bannedAt: null, bannedById: null } });
  if (!result.count) return { success: false, error: "Yasaklı kullanıcı bulunamadı." };
  revalidatePath("/admin");
  return { success: true, data: undefined };
}
