"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { TenancyShell } from "@/components/tenancy/tenancy-shell";
import { useAuthStore } from "@/features/auth/auth-store";
import type { ViewKey } from "@/features/tenants/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, loadCurrentUser, logout } = useAuthStore();
  const activeView = useMemo<ViewKey>(() => {
    const pathWithoutLocale = pathname.replace(/^\/(en|km)(?=\/|$)/, "");
    if (pathWithoutLocale.startsWith("/tenants/new")) return "create";
    if (pathWithoutLocale.startsWith("/tenants")) return "tenants";
    if (pathWithoutLocale.startsWith("/owners")) return "owners";
    if (pathWithoutLocale.startsWith("/settings")) return "settings";
    return "overview";
  }, [pathname]);

  useEffect(() => {
    loadCurrentUser().catch(() => router.replace(`/${locale}/login`));
  }, [loadCurrentUser, locale, router]);

  async function handleLogout() {
    await logout();
    router.replace(`/${locale}/login`);
  }

  function changeView(view: ViewKey) {
    const paths: Record<ViewKey, string> = {
      overview: `/${locale}`,
      tenants: `/${locale}/tenants`,
      create: `/${locale}/tenants/new`,
      owners: `/${locale}/owners`,
      settings: `/${locale}/settings`,
    };
    router.push(paths[view]);
  }

  return (
    <TenancyShell
      activeView={activeView}
      user={user}
      onViewChange={changeView}
      onLogout={() => void handleLogout()}
    >
      {children}
    </TenancyShell>
  );
}
