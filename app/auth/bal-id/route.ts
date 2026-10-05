import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OAUTH_STATE_COOKIE } from "@/lib/constants";
import { hashToken, randomToken } from "@/lib/auth";
import { appUrl, safePath } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const issuer = process.env.BAL_ID_ISSUER_URL?.replace(/\/$/, "");
  const clientId = process.env.BAL_ID_CLIENT_ID;
  if (!issuer || !clientId) return NextResponse.redirect(appUrl("/auth/hata?kod=yapilandirma"));

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const nextPath = safePath(request.nextUrl.searchParams.get("next"));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.oAuthAttempt.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.oAuthAttempt.create({ data: { stateHash: hashToken(state), codeVerifier: verifier, nextPath, expiresAt } });

  const authorizationUrl = new URL(`${issuer}/oauth/authorize`);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", appUrl("/auth/callback"));
  authorizationUrl.searchParams.set("scope", "email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    expires: expiresAt,
  });
  return response;
}