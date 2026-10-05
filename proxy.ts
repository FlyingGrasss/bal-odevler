import { NextResponse, type NextRequest } from "next/server";
import { HOMEWORK_WRITER_COOKIE } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const writerHome =
    (pathname === "/" || pathname === "/panel") &&
    Boolean(request.cookies.get(HOMEWORK_WRITER_COOKIE)?.value);
  if (!writerHome) return NextResponse.next();
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/panel";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
