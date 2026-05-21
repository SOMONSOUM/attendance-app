import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { HtmlLangProvider } from "@/components/providers/html-lang-provider";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLangProvider locale={locale} />
      <AppearanceProvider>{children}</AppearanceProvider>
    </NextIntlClientProvider>
  );
}
