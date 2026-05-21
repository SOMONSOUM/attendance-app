import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  authCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import type { AuthSession } from "@/lib/auth/tokens";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const handleI18n = createMiddleware({
  locales: ["en", "km"],
  defaultLocale: "en",
});

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = getLocale(pathname);

  if (!locale) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(nextUrl);
  }

  const isLoginPage = pathname === `/${locale}/login`;

  if (isLoginPage) {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken || !(await canManageTenants(accessToken))) {
      return handleI18n(request);
    }
    return redirectToHome(request);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (accessToken && (await canManageTenants(accessToken))) {
    return handleI18n(request);
  }

  if (!refreshToken) return redirectToLogin(request);

  const session = await refreshSession(refreshToken);
  if (!session?.user.permissions.includes("tenants:read")) {
    return redirectToLogin(request);
  }

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

function redirectToHome(request: NextRequest) {
  const nextUrl = request.nextUrl.clone();
  const locale = getLocale(request.nextUrl.pathname) ?? "en";
  nextUrl.pathname = `/${locale}`;
  nextUrl.search = "";
  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/", "/(en|km)/:path*"],
};

function getLocale(pathname: string) {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/km" || pathname.startsWith("/km/")) return "km";
  return null;
}

function redirectToLogin(request: NextRequest) {
  const locale = getLocale(request.nextUrl.pathname) ?? "en";
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = `/${locale}/login`;
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.data as AuthSession | undefined;
}

async function canManageTenants(accessToken: string) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return false;

  const payload = await response.json();
  const permissions = payload?.data?.permissions as string[] | undefined;
  return Boolean(permissions?.includes("tenants:read"));
}
