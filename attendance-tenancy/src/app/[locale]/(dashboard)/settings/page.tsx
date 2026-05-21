"use client";

import { useAppearance } from "@/components/providers/appearance-provider";
import { SettingsPanel } from "@/features/tenants/settings-panel";
import type { Locale } from "@/features/tenants/types";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const { theme, setTheme } = useAppearance();

  function changeLocale(nextLocale: Locale) {
    router.replace(pathname.replace(/^\/(en|km)(?=\/|$)/, `/${nextLocale}`));
  }

  return (
    <SettingsPanel
      locale={locale}
      theme={theme}
      onLocaleChange={changeLocale}
      onThemeChange={setTheme}
    />
  );
}
