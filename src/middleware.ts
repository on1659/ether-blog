import { NextRequest, NextResponse } from "next/server";
import { i18n, isValidLocale } from "@/i18n/config";

const getLocale = (request: NextRequest): string => {
  const cookieLocale = request.cookies.get("locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) return cookieLocale;

  // Always default to Korean for paths without locale prefix
  return i18n.defaultLocale;
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/rss.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return NextResponse.next();

  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname || "/"}`, request.url);
  newUrl.search = request.nextUrl.search;

  return NextResponse.rewrite(newUrl);
};

export const config = {
  matcher: ["/((?!_next|api|fonts|.*\\..*).*)"],
};
