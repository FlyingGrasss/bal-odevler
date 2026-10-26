import { NextResponse, type NextRequest } from "next/server";
import { authSecret } from "./lib/auth-secret";
import { HOMEWORK_WRITER_COOKIE, SESSION_COOKIE } from "./lib/constants";
import { verifySessionToken } from "./lib/session-token";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isWriter = Boolean(request.cookies.get(HOMEWORK_WRITER_COOKIE)?.value);

  if (isWriter && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/panel";
    return NextResponse.redirect(redirectUrl);
  }

  // Optimistic UX check only: the admin page and every admin action remain
  // authoritative. Keep this cookie/token check DB-free and secret-safe.
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPath) {
    const claims = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, authSecret());
    if (!claims) {
      const loginUrl = new URL("/auth/bal-id", request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
