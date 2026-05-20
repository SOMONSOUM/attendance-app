import { getRequestConfig } from "next-intl/server";
import { Locale } from "next-intl";

const locales: Locale[] = ["en", "km"];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : "km";
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
