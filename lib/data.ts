import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import type { GradeLevel, Prisma, SubmissionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getHomeworkAdminData } from "@/lib/homework-data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export const noteCardInclude = {
  author: { select: { id: true, name: true, picture: true } },
  subject: { select: { id: true, name: true, slug: true } },
  assets: { orderBy: { sortOrder: "asc" as const }, take: 4 },
  _count: { select: { votes: true } },
} satisfies Prisma.NoteInclude;

export type NoteCardData = Prisma.NoteGetPayload<{ include: typeof noteCardInclude }>;

export const getNote = cache(async (id: string, currentUserId?: string) => {
  const note = await db.note.findFirst({
    where: { id, status: { not: "DRAFT" } },
    include: {
      ...noteCardInclude,
      assets: { orderBy: { sortOrder: "asc" } },
      votes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
    },
  });
  return note;
});

export async function getHomeData() {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.notes, CACHE_TAGS.quotes);
  const [recommended, popular, recent, quotes] = await Promise.all([
    db.note.findMany({
      where: { status: "APPROVED", isRecommended: true },
      include: noteCardInclude,
      orderBy: [{ recommendedAt: "desc" }, { publishedAt: "desc" }],
      take: 6,
    }),
    db.note.findMany({
      where: { status: "APPROVED" },
      include: noteCardInclude,
      orderBy: [{ votes: { _count: "desc" } }, { publishedAt: "desc" }],
      take: 6,
    }),
    db.note.findMany({
      where: { status: "APPROVED" },
      include: noteCardInclude,
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    db.teacherQuote.findMany({
      where: { status: "APPROVED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const seen = new Set(recommended.map((note) => note.id));
  const filled = [...recommended];
  for (const note of popular) {
    if (filled.length >= 6) break;
    if (!seen.has(note.id)) filled.push(note);
  }
  return { recommended: filled, popular, recent, quotes };
}

export async function getActiveSubjects(gradeLevel?: GradeLevel) {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.subjects);
  return db.subject.findMany({
    where: { isActive: true, ...(gradeLevel ? { gradeLevel } : {}) },
    orderBy: [{ gradeLevel: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export type NoteFeedFilters = {
  grade?: GradeLevel;
  subject?: string;
  q?: string;
  sort?: "new" | "top";
  page?: number;
};

export async function getNoteFeed(filters: NoteFeedFilters) {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.notes, CACHE_TAGS.subjects);
  const page = Math.max(filters.page || 1, 1);
  const where: Prisma.NoteWhereInput = {
    status: "APPROVED",
    ...(filters.grade ? { gradeLevel: filters.grade } : {}),
    ...(filters.subject ? { subjectId: filters.subject } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { customSubject: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [notes, total] = await Promise.all([
    db.note.findMany({
      where,
      include: noteCardInclude,
      orderBy:
        filters.sort === "top"
          ? [{ votes: { _count: "desc" } }, { publishedAt: "desc" }]
          : { publishedAt: "desc" },
      skip: (page - 1) * 12,
      take: 12,
    }),
    db.note.count({ where }),
  ]);
  return { notes, total, page, pages: Math.max(1, Math.ceil(total / 12)) };
}

export async function getProfileData(userId: string) {
  const [notes, quotes] = await Promise.all([
    db.note.findMany({
      where: { authorId: userId },
      include: { ...noteCardInclude, assets: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.teacherQuote.findMany({ where: { authorId: userId }, include: { subject: { select: { id: true, name: true, gradeLevel: true } } }, orderBy: { updatedAt: "desc" } }),
  ]);
  return { notes, quotes };
}

export async function getApprovedQuotes() {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.quotes, CACHE_TAGS.subjects);
  return db.teacherQuote.findMany({
    where: { status: "APPROVED" },
    include: { author: { select: { name: true } }, subject: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getAdminData() {
  const moderationStatuses: SubmissionStatus[] = ["PENDING", "APPROVED", "REJECTED"];
  const [notes, quotes, subjects, users, counts, homeworkData] = await Promise.all([
    db.note.findMany({
      where: { status: { in: moderationStatuses } },
      include: { ...noteCardInclude, assets: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "asc" },
      take: 300,
    }),
    db.teacherQuote.findMany({
      where: { status: { in: moderationStatuses } },
      include: { author: { select: { id: true, name: true, email: true } }, subject: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
      take: 300,
    }),
    db.subject.findMany({ orderBy: [{ gradeLevel: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, picture: true, status: true, banReason: true, createdAt: true, _count: { select: { notes: true, teacherQuotes: true } } },
      take: 100,
    }),
    Promise.all([
      db.note.count({ where: { status: "PENDING" } }),
      db.teacherQuote.count({ where: { status: "PENDING" } }),
      db.user.count({ where: { status: "BANNED" } }),
    ]),
    getHomeworkAdminData(),
  ]);
  return { notes, quotes, subjects, users, counts, ...homeworkData };
}
