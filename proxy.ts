import { NextResponse, type NextRequest } from "next/server";
import { HOMEWORK_WRITER_COOKIE } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isWriter = Boolean(request.cookies.get(HOMEWORK_WRITER_COOKIE)?.value);

  if (isWriter && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/panel";
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
