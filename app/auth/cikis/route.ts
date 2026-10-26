import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "@/lib/constants";
import { clearSessionCookie } from "@/lib/auth";
import { appUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const expectedOrigin = new URL(appUrl()).origin;
  const origin = request.headers.get("origin");
  const sameOrigin = origin
    ? origin === expectedOrigin
    : request.headers.get("sec-fetch-site") === "same-origin";
  if (!sameOrigin) {
    return NextResponse.json(
      { error: "gecersiz-istek" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.redirect(appUrl("/"), 303);
  clearSessionCookie(response);
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/auth" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function GET() {
  return NextResponse.json(
    { error: "yontem-desteklenmiyor" },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}
