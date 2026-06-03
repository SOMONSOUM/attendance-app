import createMiddleware from "next-intl/middleware";
import type { NextRequest, NextResponse } from "next/server";

const handleI18n = createMiddleware({
  locales: ["en", "km"],
  defaultLocale: "en",
});

export default function proxy(request: NextRequest) {
  const response = handleI18n(request);
  return withFrameHeaders(response, request.nextUrl.pathname);
}

export const config = {
  matcher: ["/", "/(en|km)/:path*"],
};

function withFrameHeaders(response: NextResponse, pathname: string) {
  if (/^\/(en|km)\/(event-scan|meeting-scan)\//.test(pathname)) {
    response.headers.set("Content-Security-Policy", "frame-ancestors *;");
    response.headers.delete("X-Frame-Options");
    return response;
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none';");
  return response;
}
