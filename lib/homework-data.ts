import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getCurrentHomeworkWriter, type HomeworkWriterDto } from "@/lib/homework-auth";
import { formatHomeworkDate } from "@/lib/homework-display";
import type { HomeworkDto } from "@/lib/homework-types";

function toDateOnly(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(value);
}

function sortHomeworkByDueDate<T extends { dueDate: string | null; isPast?: boolean; updatedAt: string }>(items: T[]) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  return items.sort((left, right) => {
    const leftPast = Boolean(left.isPast || (left.dueDate && left.dueDate < today));
    const rightPast = Boolean(right.isPast || (right.dueDate && right.dueDate < today));
    if (leftPast !== rightPast) return leftPast ? 1 : -1;
    if (leftPast && rightPast) return (right.dueDate || "").localeCompare(left.dueDate || "") || right.updatedAt.localeCompare(left.updatedAt);
    if (left.dueDate === null && right.dueDate !== null) return 1;
    if (left.dueDate !== null && right.dueDate === null) return -1;
    return (left.dueDate || "").localeCompare(right.dueDate || "") || right.updatedAt.localeCompare(left.updatedAt);
  });
}

export async function getPublicHomework() {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.homework);
  const homework = await db.homework.findMany({
    include: { writer: { select: { id: true, name: true, kind: true } } },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });
  const mapped = homework.map((item): HomeworkDto => ({
    id: item.id,
    title: item.title,
    description: item.description,
    subject: item.subject,
    dueText: item.dueText,
    dueDate: item.dueDate ? toDateOnly(item.dueDate) : null,
    isPast: item.isPast,
    writer: item.writer,
    updatedAt: item.updatedAt.toISOString(),
  }));
  return sortHomeworkByDueDate(mapped);
}

export async function getHomeworkWriterPageData() {
  const [homework, writer] = await Promise.all([getPublicHomework(), getCurrentHomeworkWriter()]);
  const ownHomework = writer
    ? homework.filter((item) => item.writer.id === writer.id)
    : [];
  return { homework: ownHomework, writer };
}

export async function getHomeworkAdminData() {
  const [writers, homework] = await Promise.all([
    db.homeworkWriter.findMany({
      select: { id: true, name: true, kind: true, fixedSubject: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.homework.findMany({
      include: { writer: { select: { id: true, name: true, kind: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    }),
  ]);
  return {
    writers: writers.map((writer) => ({ ...writer, lastLoginAt: writer.lastLoginAt?.toISOString() ?? null, createdAt: writer.createdAt.toISOString() })),
    homework: homework.map((item): HomeworkDto => ({
      id: item.id,
      title: item.title,
      description: item.description,
      subject: item.subject,
      dueText: item.dueText,
      dueDate: item.dueDate ? toDateOnly(item.dueDate) : null,
      isPast: item.isPast,
      writer: item.writer,
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

export type HomeworkPageWriter = HomeworkWriterDto;

export { formatHomeworkDate };
