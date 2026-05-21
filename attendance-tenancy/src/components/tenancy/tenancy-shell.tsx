"use client";

import {
  Building2,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/tenancy/theme-toggle";
import type { SessionUser } from "@/features/auth/types";
import type { ViewKey } from "@/features/tenants/types";

export function TenancyShell({
  activeView,
  user,
  children,
  onViewChange,
  onLogout,
}: {
  activeView: ViewKey;
  user: SessionUser | null;
  children: ReactNode;
  onViewChange: (view: ViewKey) => void;
  onLogout: () => void;
}) {
  const t = useTranslations("tenancy");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function changeLocale(nextLocale: string) {
    const nextPath = pathname.replace(/^\/(en|km)(?=\/|$)/, `/${nextLocale}`);
    router.replace(nextPath);
  }

  return (
    <main className="min-h-screen border-t-4 border-primary bg-background">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-card lg:block">
          <div className="flex h-16 items-center gap-3 border-b border-border px-5">
            <span className="grid size-9 place-items-center rounded-md bg-secondary text-primary">
              <LayoutDashboard size={18} />
            </span>
            <div>
              <p className="font-semibold">Attendance</p>
              <p className="text-xs text-muted-fg">Tenant Console</p>
            </div>
          </div>
          <nav className="grid gap-1 p-3">
            <NavButton
              active={activeView === "overview"}
              icon={LayoutDashboard}
              label={t("overview")}
              onClick={() => onViewChange("overview")}
            />
            <NavButton
              active={activeView === "tenants"}
              icon={Building2}
              label={t("tenants")}
              onClick={() => onViewChange("tenants")}
            />
            <NavButton
              active={activeView === "create"}
              icon={Plus}
              label={t("create")}
              onClick={() => onViewChange("create")}
            />
            <NavButton
              active={activeView === "owners"}
              icon={Users}
              label={t("owners")}
              onClick={() => onViewChange("owners")}
            />
            <NavButton
              active={activeView === "settings"}
              icon={Monitor}
              label={t("settings")}
              onClick={() => onViewChange("settings")}
            />
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {t("title")}
              </h1>
              <p className="hidden text-sm text-muted-fg md:block">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                className="w-24"
                value={locale}
                onChange={(event) => changeLocale(event.target.value)}
              >
                <option value="en">EN</option>
                <option value="km">KM</option>
              </Select>
              <ThemeToggle />
              {user ? (
                <Button variant="outline" onClick={onLogout}>
                  <LogOut size={16} />
                  {t("logout")}
                </Button>
              ) : null}
            </div>
          </header>
          <div className="grid gap-5 p-4 md:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className="justify-start"
      onClick={onClick}
    >
      <Icon size={16} />
      {label}
    </Button>
  );
}
