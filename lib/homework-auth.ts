import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  HOMEWORK_LOGIN_MAX_ATTEMPTS,
  HOMEWORK_LOGIN_WINDOW_MS,
  HOMEWORK_WRITER_COOKIE,
  HOMEWORK_WRITER_SESSION_DAYS,
} from "@/lib/constants";
import { hashHomeworkToken } from "@/lib/homework-security";
import type { HomeworkWriterView } from "@/lib/homework-types";

export type HomeworkWriterDto = HomeworkWriterView;

export function homeworkWriterCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: HOMEWORK_WRITER_SESSION_DAYS * 24 * 60 * 60,
  };
}

function toWriterDto(writer: { id: string; name: string; kind: "TEACHER" | "SMART_BOARD"; fixedSubject: HomeworkWriterDto["fixedSubject"]; isActive: boolean; lastLoginAt: Date | null }): HomeworkWriterDto {
  return {
    id: writer.id,
    name: writer.name,
    kind: writer.kind,
    fixedSubject: writer.fixedSubject,
    isActive: writer.isActive,
    lastLoginAt: writer.lastLoginAt?.toISOString() ?? null,
  };
}

export const getCurrentHomeworkWriter = cache(async (): Promise<HomeworkWriterDto | null> => {
  const token = (await cookies()).get(HOMEWORK_WRITER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.homeworkWriterSession.findUnique({
    where: { tokenHash: hashHomeworkToken(token) },
    include: { writer: true },
  });
  if (!session) return null;
  if (!session.writer.isActive) {
    await db.homeworkWriterSession.deleteMany({ where: { writerId: session.writer.id } });
    return null;
  }
  if (session.expiresAt <= new Date()) {
    await db.homeworkWriterSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  await db.homeworkWriterSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
  return toWriterDto(session.writer);
});

export async function getHomeworkAuth() {
  const [writer, user] = await Promise.all([getCurrentHomeworkWriter(), getCurrentUser()]);
  return { writer, isAdmin: Boolean(user?.isAdmin), adminUserId: user?.isAdmin ? user.id : null };
}

export function getRequestIp(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

export async function consumeHomeworkLoginAttempt() {
  const requestHeaders = await headers();
  const bucketKey = hashHomeworkToken(`homework-login:${getRequestIp(requestHeaders)}`);
  const now = new Date();
  const allowed = await db.$transaction(async (tx) => {
    const current = await tx.homeworkLoginRateLimit.findUnique({ where: { bucketKey } });
    if (!current || now.getTime() - current.windowStart.getTime() >= HOMEWORK_LOGIN_WINDOW_MS) {
      await tx.homeworkLoginRateLimit.upsert({
        where: { bucketKey },
        create: { bucketKey, windowStart: now, attempts: 1 },
        update: { windowStart: now, attempts: 1 },
      });
      return true;
    }
    if (current.attempts >= HOMEWORK_LOGIN_MAX_ATTEMPTS) return false;
    await tx.homeworkLoginRateLimit.update({ where: { bucketKey }, data: { attempts: { increment: 1 } } });
    return true;
  });
  return { allowed, bucketKey };
}

export async function clearHomeworkLoginRateLimit(bucketKey: string) {
  await db.homeworkLoginRateLimit.delete({ where: { bucketKey } }).catch(() => undefined);
}

export async function establishHomeworkSession(writerId: string, rawToken: string) {
  const expiresAt = new Date(Date.now() + HOMEWORK_WRITER_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.homeworkWriterSession.create({ data: { writerId, tokenHash: hashHomeworkToken(rawToken), expiresAt } });
  (await cookies()).set(HOMEWORK_WRITER_COOKIE, rawToken, homeworkWriterCookieOptions());
}

export async function destroyHomeworkSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HOMEWORK_WRITER_COOKIE)?.value;
  if (token) await db.homeworkWriterSession.deleteMany({ where: { tokenHash: hashHomeworkToken(token) } });
  cookieStore.delete(HOMEWORK_WRITER_COOKIE);
}
