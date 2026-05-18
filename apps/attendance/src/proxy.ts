import createMiddleware from "next-intl/middleware";
import { locales } from "@attendance/shared";

export default createMiddleware({
  locales,
  defaultLocale: "en",
});

export const config = {
  matcher: ["/", "/(en|km)/:path*"],
};
