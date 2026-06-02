import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  authCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import type { AuthSession } from "@/lib/auth/tokens";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_VERSION = "v1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

async function proxyApiRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const pathname = stripVersion(path.join("/"));
  const isAuthRequest = pathname.startsWith("auth/");
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const body = hasBody(request.method) ? await request.arrayBuffer() : undefined;

  const apiResponse = await forwardRequest(request, pathname, body, accessToken);
  if (apiResponse.status !== 401 || !refreshToken || isAuthRequest) {
    return buildResponse(apiResponse);
  }

  const refreshResponse = await refreshSession(refreshToken);
  if (!refreshResponse?.accessToken) return buildResponse(apiResponse);

  const retryResponse = await forwardRequest(
    request,
    pathname,
    body,
    refreshResponse.accessToken,
  );
  const response = await buildResponse(retryResponse);
  setAuthCookies(response, refreshResponse);
  return response;
}

async function forwardRequest(
  request: NextRequest,
  pathname: string,
  body?: BodyInit,
  accessToken?: string,
) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  return fetch(`${API_URL}/api/${API_VERSION}/${pathname}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/${API_VERSION}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const payload = await response.json();
  return payload?.data as AuthSession | undefined;
}

async function buildResponse(apiResponse: Response) {
  const responseHeaders = new Headers();
  const contentType = apiResponse.headers.get("Content-Type");
  const contentDisposition = apiResponse.headers.get("Content-Disposition");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  if (contentDisposition) {
    responseHeaders.set("Content-Disposition", contentDisposition);
  }

  const response = new NextResponse(await apiResponse.arrayBuffer(), {
    status: apiResponse.status,
    headers: responseHeaders,
  });

  if (apiResponse.status === 401) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  return response;
}

function setAuthCookies(response: NextResponse, session: AuthSession) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...authCookieOptions,
    maxAge: 60 * 15,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
}

function hasBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

function stripVersion(pathname: string) {
  return pathname.replace(/^v\d+\//, "");
}
