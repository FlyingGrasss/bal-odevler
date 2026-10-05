import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { safePath } from "@/lib/utils";
import { createSupabaseClient } from "@/lib/supabase/server";

export function hashToken(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET üretim ortamında tanımlanmalıdır.");
  }
  return createHmac("sha256", secret ?? "bal-odevler-development-secret-change-me")
    .update(token)
    .digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase("tr-TR"))
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string) {
  return adminEmails().has(email.toLocaleLowerCase("tr-TR"));
}

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;

  const profile = await db.user.findUnique({ where: { id: user.id } });
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

export async function establishSupabaseSession(accessToken: string, refreshToken: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
}

export async function destroyCurrentSession() {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
}
