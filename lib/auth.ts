import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import type { UserStatus } from "@prisma/client";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { authSecret } from "@/lib/auth-secret";
import { SESSION_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session-token";
import { safePath } from "@/lib/utils";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  status: UserStatus;
  isAdmin: boolean;
};

export function hashToken(token: string) {
  return createHmac("sha256", authSecret()).update(token).digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string) {
  return adminEmails().has(email.toLowerCase());
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = verifySessionToken(token, authSecret());
  if (!claims) return null;

  const profile = await db.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, name: true, picture: true, status: true },
  });
  if (!profile || profile.status === "BANNED") return null;

  return { ...profile, isAdmin: isAdminEmail(profile.email) };
});

export async function requireUser(nextPath = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/bal-id?next=${encodeURIComponent(safePath(nextPath))}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}

export function setSessionCookie(response: NextResponse, userId: string): void {
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(userId, authSecret()),
    sessionCookieOptions(process.env.NODE_ENV === "production"),
  );
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
}
