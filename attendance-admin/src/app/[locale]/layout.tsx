import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

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
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AppearanceProvider>
          <NextIntlClientProvider messages={messages}>
            <NuqsAdapter>
              <QueryProvider>{children}</QueryProvider>
            </NuqsAdapter>
          </NextIntlClientProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
