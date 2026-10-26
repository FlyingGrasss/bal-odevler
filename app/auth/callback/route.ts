import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OAUTH_STATE_COOKIE } from "@/lib/constants";
import { hashToken, setSessionCookie } from "@/lib/auth";
import { appUrl, safePath } from "@/lib/utils";

type TokenResponse = { access_token?: string };
type UserInfo = { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

function authError(code: string) {
  const response = NextResponse.redirect(appUrl(`/auth/hata?kod=${encodeURIComponent(code)}`), 303);
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/auth" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) return authError("gecersiz-istek");

  const issuer = process.env.BAL_ID_ISSUER_URL?.replace(/\/$/, "");
  const clientId = process.env.BAL_ID_CLIENT_ID;
  const clientSecret = process.env.BAL_ID_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret) return authError("yapilandirma");

  try {
    const attempt = await db.oAuthAttempt.findUnique({ where: { stateHash: hashToken(state) } });
    if (!attempt || attempt.expiresAt <= new Date()) return authError("oturum-suresi");
    const consumed = await db.oAuthAttempt.deleteMany({ where: { stateHash: attempt.stateHash } });
    if (!consumed.count) return authError("gecersiz-istek");

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
      signal: AbortSignal.timeout(5000),
    });
    if (!tokenResponse.ok) return authError("token-hatasi");
    const token = (await tokenResponse.json()) as TokenResponse;
    if (!token.access_token) return authError("token-hatasi");

    const userResponse = await fetch(`${issuer}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!userResponse.ok) return authError("kimlik-hatasi");
    const info = (await userResponse.json()) as UserInfo;
    if (
      typeof info.sub !== "string" ||
      info.sub.length < 1 ||
      info.sub.length > 128 ||
      typeof info.email !== "string" ||
      !info.email ||
      info.email_verified !== true
    ) {
      return authError("kimlik-hatasi");
    }

    const email = info.email.toLowerCase();
    const name = typeof info.name === "string" && info.name.trim() ? info.name.trim() : email.split("@")[0];
    const picture = typeof info.picture === "string" ? info.picture : null;
    const existing = await db.user.findUnique({ where: { id: info.sub }, select: { status: true } });
    if (existing?.status === "BANNED") return authError("yasakli-hesap");
    await db.user.upsert({
      where: { id: info.sub },
      create: { id: info.sub, email, name, picture },
      update: { email, name, picture },
    });

    const response = NextResponse.redirect(appUrl(safePath(attempt.nextPath)), 303);
    setSessionCookie(response, info.sub);
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/auth" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("BAL ID callback hatası", error instanceof Error ? error.name : "unknown");
    return authError("baglanti-hatasi");
  }
}
