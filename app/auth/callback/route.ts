import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OAUTH_STATE_COOKIE } from "@/lib/constants";
import { establishSupabaseSession, hashToken } from "@/lib/auth";
import { appUrl } from "@/lib/utils";

type TokenResponse = { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
type UserInfo = { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

function authError(code: string) {
  return NextResponse.redirect(appUrl(`/auth/hata?kod=${encodeURIComponent(code)}`));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) return authError("gecersiz-istek");

  const attempt = await db.oAuthAttempt.findUnique({ where: { stateHash: hashToken(state) } });
  if (!attempt || attempt.expiresAt <= new Date()) return authError("oturum-suresi");
  await db.oAuthAttempt.delete({ where: { stateHash: attempt.stateHash } });

  const issuer = process.env.BAL_ID_ISSUER_URL?.replace(/\/$/, "");
  const clientId = process.env.BAL_ID_CLIENT_ID;
  const clientSecret = process.env.BAL_ID_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret) return authError("yapilandirma");

  try {
    const tokenResponse = await fetch(`${issuer}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: appUrl("/auth/callback"),
        code_verifier: attempt.codeVerifier,
      }),
      cache: "no-store",
    });
    const token = (await tokenResponse.json()) as TokenResponse;
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token) return authError(token.error || "token-hatasi");

    const userResponse = await fetch(`${issuer}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    const info = (await userResponse.json()) as UserInfo;
    if (!userResponse.ok || !info.sub || !info.email || info.email_verified !== true) return authError("kimlik-hatasi");

    const existing = await db.user.findUnique({ where: { id: info.sub }, select: { status: true } });
    if (existing?.status === "BANNED") return authError("yasakli-hesap");
    await db.user.upsert({
      where: { id: info.sub },
      create: { id: info.sub, email: info.email.toLocaleLowerCase("tr-TR"), name: info.name || info.email.split("@")[0], picture: info.picture || null },
      update: { email: info.email.toLocaleLowerCase("tr-TR"), name: info.name || info.email.split("@")[0], picture: info.picture || null },
    });
    await establishSupabaseSession(token.access_token, token.refresh_token);
    const response = NextResponse.redirect(appUrl(attempt.nextPath));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("BAL ID callback error", error);
    return authError("baglanti-hatasi");
  }
}