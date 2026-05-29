import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  authCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import type { AuthSession } from "@/lib/auth/tokens";

const locales = ["en", "km"] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const handleI18n = createMiddleware({
  locales: ["en", "km"],
  defaultLocale: "km",
});

export default async function proxy(request: NextRequest) {
  const locale = getLocale(request.nextUrl.pathname);
  const isLoginPage = locale
    ? request.nextUrl.pathname === `/${locale}/login`
    : false;

  if (!locale || isLoginPage) return handleI18n(request);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (accessToken) return handleI18n(request);

  if (!refreshToken) return redirectToLogin(request, locale);

  const session = await refreshSession(refreshToken);
  if (!session) return redirectToLogin(request, locale);

  const response = handleI18n(request);
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...authCookieOptions,
    maxAge: 60 * 15,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export const config = {
  matcher: ["/", "/(en|km)/:path*"],
};

function getLocale(pathname: string) {
  return locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function redirectToLogin(request: NextRequest, locale: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = `/${locale}/login`;
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.data as AuthSession | undefined;
}
