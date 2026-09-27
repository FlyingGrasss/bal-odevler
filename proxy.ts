import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSiteMode } from "@/lib/site";
import { HOMEWORK_WRITER_COOKIE } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const site = getSiteMode(request.nextUrl.hostname);
  const pathname = request.nextUrl.pathname;
  const blockedPrefixes = site === "homework" ? ["/notlar", "/sozler", "/paylas", "/profil"] : ["/odevler", "/login"];
  const blocked = blockedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const redirectUrl = blocked ? request.nextUrl.clone() : null;
  if (redirectUrl) redirectUrl.pathname = site === "homework" ? "/odevler" : "/notlar";
  const writerHome = site === "homework"
    && (pathname === "/" || pathname === "/odevler")
    && Boolean(request.cookies.get(HOMEWORK_WRITER_COOKIE)?.value);
  const writerRedirect = writerHome ? request.nextUrl.clone() : null;
  if (writerRedirect) writerRedirect.pathname = "/odevler/panel";
  const hasFilterValue = Boolean(
    request.nextUrl.searchParams.get("q")
      || request.nextUrl.searchParams.get("sinif")
      || request.nextUrl.searchParams.get("ders")
      || (request.nextUrl.searchParams.get("sirala") && request.nextUrl.searchParams.get("sirala") !== "yeni")
      || (request.nextUrl.searchParams.get("sayfa") && request.nextUrl.searchParams.get("sayfa") !== "1"),
  );
  const filterRewrite = site === "notes"
    && pathname === "/notlar"
    && hasFilterValue;
  const rewritePath = !redirectUrl && !writerRedirect
    ? pathname === "/" && site === "homework"
      ? "/odevler"
      : filterRewrite
        ? "/notlar/filtre"
        : null
    : null;
  const rewriteUrl = rewritePath ? request.nextUrl.clone() : null;
  if (rewriteUrl && rewritePath) rewriteUrl.pathname = rewritePath;
  const responseForRequest = () => redirectUrl
    ? NextResponse.redirect(redirectUrl)
    : writerRedirect
    ? NextResponse.redirect(writerRedirect)
    : rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request })
    : NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return responseForRequest();

  let response = responseForRequest();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = responseForRequest();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
