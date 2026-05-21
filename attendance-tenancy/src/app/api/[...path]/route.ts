import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  authCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import type { AuthSession } from "@/lib/auth/tokens";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyApiRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
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
  const pathname = path.join("/");
  const body = hasBody(request.method) ? await request.arrayBuffer() : undefined;

  if (pathname === "auth/login") {
    const apiResponse = await forwardRequest(request, pathname, body);
    return buildAuthResponse(apiResponse);
  }

  if (pathname === "auth/logout") {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const apiResponse = refreshToken
      ? await forwardRequest(
          request,
          pathname,
          Buffer.from(JSON.stringify({ refreshToken })),
        )
      : null;
    const response = apiResponse
      ? await buildResponse(apiResponse)
      : NextResponse.json({ success: true });
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const apiResponse = await forwardRequest(request, pathname, body, accessToken);
  if (apiResponse.status !== 401 || !refreshToken) {
    return buildResponse(apiResponse);
  }

  const session = await refreshSession(refreshToken);
  if (!session?.user.permissions.includes("tenants:read")) {
    return unauthorizedResponse();
  }

  const retryResponse = await forwardRequest(
    request,
    pathname,
    body,
    session.accessToken,
  );
  const response = await buildResponse(retryResponse);
  setAuthCookies(response, session);
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
  if (body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return fetch(`${API_URL}/api/${pathname}${request.nextUrl.search}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function buildAuthResponse(apiResponse: Response) {
  if (!apiResponse.ok) return buildResponse(apiResponse);

  const text = await apiResponse.text();
  const payload = JSON.parse(text) as { data?: AuthSession };
  const session = payload.data;
  if (!session?.user.permissions.includes("tenants:read")) {
    return unauthorizedResponse("This account cannot access tenant management.");
  }

  const response = new NextResponse(text, {
    status: apiResponse.status,
    headers: {
      "Content-Type":
        apiResponse.headers.get("Content-Type") ?? "application/json",
    },
  });
  setAuthCookies(response, session);
  return response;
}

async function buildResponse(apiResponse: Response) {
  const response = new NextResponse(await apiResponse.text(), {
    status: apiResponse.status,
    headers: {
      "Content-Type":
        apiResponse.headers.get("Content-Type") ?? "application/json",
    },
  });

  if (apiResponse.status === 401) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

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

function unauthorizedResponse(message = "Unauthorized") {
  const response = NextResponse.json(
    { success: false, error: { message } },
    { status: 403 },
  );
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

function hasBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}
