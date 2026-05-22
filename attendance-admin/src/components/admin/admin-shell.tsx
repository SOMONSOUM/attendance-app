"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import ReactCountryFlag from "react-country-flag";
import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Handshake,
  Home,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Palette,
  QrCode,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type AppearanceMode,
  useAppearance,
} from "@/components/providers/appearance-provider";
import { logoutAdmin } from "@/lib/auth/actions";
import { authKeys, getCurrentUser } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

type ShellUser = {
  fullNameEn: string;
  email: string | null;
  permissions: string[];
  tenantName?: string | null;
  tenantSlug?: string | null;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  permission?: string;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/en", icon: Home },
  {
    key: "events",
    label: "Events",
    href: "/en/events",
    icon: CalendarDays,
    permission: "events:read",
  },
  {
    key: "meetings",
    label: "Meetings",
    href: "/en/meetings",
    icon: Handshake,
    permission: "meetings:read",
  },
  {
    key: "registrations",
    label: "Registrations",
    href: "/en/registrations",
    icon: FileSpreadsheet,
    permission: "registrations:read",
  },
  {
    key: "attendance",
    label: "Attendance",
    href: "/en/attendance",
    icon: ClipboardCheck,
    permission: "attendance:read",
  },
  {
    key: "people",
    label: "People",
    href: "/en/people",
    icon: Users,
    permission: "users:read",
  },
  {
    key: "roles",
    label: "Roles & RBAC",
    href: "/en/roles",
    icon: ShieldCheck,
    permission: "roles:read",
  },
  {
    key: "theme",
    label: "Theme Builder",
    href: "/en/theme",
    icon: Palette,
    badge: "NEW",
    permission: "theme:update",
  },
  { key: "settings", label: "Settings", href: "/en/settings", icon: Settings },
];

export function AdminShell({
  active,
  title,
  description,
  children,
  action,
}: {
  active: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const t = useTranslations("adminShell");
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { data: currentUser } = useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    setCollapsed(localStorage.getItem("admin-sidebar-collapsed") === "true");
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <main className="min-h-screen border-t-4 border-primary bg-background">
      <div
        className={cn(
          "grid min-h-screen",
          hydrated && collapsed
            ? "lg:grid-cols-[80px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        <ResponsiveSidebar
          active={active}
          collapsed={hydrated && collapsed}
          currentUser={currentUser}
          onToggle={toggleCollapsed}
        />

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-border bg-card px-3 py-2 md:px-6">
            <div className="flex min-h-12 items-center gap-2 md:gap-3">
              <MobileMenuButton active={active} currentUser={currentUser} />
              <TenantBadge currentUser={currentUser} />
              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                <AppearanceToggle />
                <LanguageSwitcher />
                <Button
                  variant="outline"
                  className="size-10 px-0"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                </Button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 md:px-6">
            <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {localizeTitle(title, t)}
                </h1>
                {description ? (
                  <p className="mt-1 text-sm text-muted-fg">{description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">{action}</div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function TenantBadge({ currentUser }: { currentUser?: ShellUser }) {
  const tenantName =
    currentUser?.tenantName ?? currentUser?.tenantSlug ?? "Tenant";

  return (
    <div className="flex h-10 min-w-0 flex-1 items-center gap-2  px-2.5 sm:max-w-64 md:flex-none md:basis-56">
      <Building2 size={16} className="shrink-0 text-primary" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold">{tenantName}</p>
      </div>
    </div>
  );
}

function AppearanceToggle() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useAppearance();
  const options: Array<{
    value: AppearanceMode;
    icon: ComponentType<{ size?: number; className?: string }>;
    label: string;
  }> = [
    { value: "light", icon: Sun, label: t("light") },
    { value: "dark", icon: Moon, label: t("dark") },
    { value: "system", icon: Monitor, label: t("systemMode") },
  ];

  return (
    <div className="hidden gap-1 rounded-md border border-border bg-background p-1 sm:flex">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "secondary" : "ghost"}
            className="size-8 px-0"
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
          >
            <Icon size={15} />
          </Button>
        );
      })}
    </div>
  );
}

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "km";
  const nextLocale = locale === "km" ? "en" : "km";
  const countryCode = locale === "km" ? "KH" : "US";

  function switchLocale() {
    const nextPath = pathname.replace(/^\/(en|km)(?=\/|$)/, `/${nextLocale}`);
    router.replace(nextPath);
  }

  return (
    <Button
      variant="outline"
      className="size-10 px-0"
      aria-label="Switch language"
      onClick={switchLocale}
    >
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{ height: "1rem", width: "1.25rem" }}
      />
    </Button>
  );
}

function ResponsiveSidebar({
  active,
  collapsed,
  currentUser,
  onToggle,
}: {
  active: string;
  collapsed: boolean;
  currentUser?: ShellUser;
  onToggle: () => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh overflow-hidden border-r border-border bg-card lg:block">
      <SidebarContent
        active={active}
        collapsed={collapsed}
        currentUser={currentUser}
        onToggle={onToggle}
      />
    </aside>
  );
}

function MobileMenuButton({
  active,
  currentUser,
}: {
  active: string;
  currentUser?: ShellUser;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="size-10 shrink-0 px-0 lg:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu size={17} />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-dvh w-[min(86vw,300px)] overflow-hidden border-r border-border bg-card shadow-soft">
            <SidebarContent
              active={active}
              currentUser={currentUser}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({
  active,
  collapsed = false,
  currentUser,
  onToggle,
  onNavigate,
}: {
  active: string;
  collapsed?: boolean;
  currentUser?: ShellUser;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const t = useTranslations("adminShell");
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();
  const visibleMenuItems = filterNavItems(navItems.slice(0, 7), currentUser);
  const visibleSystemItems = filterNavItems(navItems.slice(7), currentUser);
  const locale = params.locale ?? "en";

  function logout() {
    startTransition(async () => {
      await logoutAdmin();
      router.replace(`/${locale}/login`);
      router.refresh();
    });
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col">
      <div className="flex min-h-16 items-center justify-between border-b border-border px-4">
        <Link
          href={`/${locale}`}
          className="flex min-w-0 items-center gap-3"
          onClick={onNavigate}
        >
          <div className="relative size-9">
            <span className="absolute left-0 top-0 size-5 rounded-full bg-primary" />
            <span className="absolute bottom-0 left-2 size-5 rounded-full bg-info" />
            <span className="absolute right-0 top-3 size-5 rounded-full bg-warning" />
          </div>
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <p className="text-sm font-semibold leading-none">EMS</p>
            <p className="mt-1 text-xs text-muted-fg">{t("brandSubtitle")}</p>
          </div>
        </Link>
        {onToggle ? (
          <Button
            variant="ghost"
            className="size-8 px-0"
            aria-label="Collapse sidebar"
            onClick={onToggle}
          >
            <ChevronLeft
              size={17}
              className={cn("text-muted-fg", collapsed && "rotate-180")}
            />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p
          className={cn(
            "mb-2 px-2 text-[11px] font-semibold uppercase text-muted-fg",
            collapsed && "sr-only",
          )}
        >
          {t("menu")}
        </p>
        <nav className="grid gap-1">
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              locale={locale}
              active={active}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <p
          className={cn(
            "mb-2 mt-6 px-2 text-[11px] font-semibold uppercase text-muted-fg",
            collapsed && "sr-only",
          )}
        >
          {t("system")}
        </p>
        <nav className="grid gap-1">
          {visibleSystemItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              locale={locale}
              active={active}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-border p-3",
          collapsed && "grid place-items-center",
        )}
      >
        <div
          className={cn(
            "rounded-md bg-muted p-3",
            collapsed && "grid place-items-center p-2",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {currentUser?.fullNameEn?.charAt(0) ?? "A"}
            </div>
            <Button
              variant="ghost"
              className={cn("ml-auto size-8 px-0", collapsed && "hidden")}
              onClick={logout}
              disabled={isPending}
              aria-label="Logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
          <div className={cn("mt-2 min-w-0", collapsed && "hidden")}>
            <p className="truncate text-sm font-medium">
              {currentUser?.fullNameEn ?? "Admin"}
            </p>
            <p className="truncate text-xs text-muted-fg">
              {currentUser?.email ?? t("signedIn")}
            </p>
          </div>
        </div>
        {collapsed ? (
          <Button
            variant="ghost"
            className="mt-2 size-8 px-0"
            onClick={logout}
            disabled={isPending}
            aria-label="Logout"
          >
            <LogOut size={16} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function NavLink({
  item,
  locale,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  locale: string;
  active: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("adminShell");
  const Icon = item.icon;
  const selected = item.label === active;
  return (
    <Link
      href={item.href.replace(/^\/en(?=\/|$)/, `/${locale}`)}
      onClick={onNavigate}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
        collapsed && "justify-center px-0",
        selected
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-fg hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon size={16} />
      <span className={cn("flex-1", collapsed && "sr-only")}>
        {t(`nav.${item.key}`)}
      </span>
      {item.badge ? (
        <span
          className={cn(
            "rounded-full bg-info px-2 py-0.5 text-[10px] font-semibold text-white",
            collapsed && "hidden",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function localizeTitle(
  title: string,
  t: ReturnType<typeof useTranslations<"adminShell">>,
) {
  const item = navItems.find((navItem) => navItem.label === title);
  return item ? t(`nav.${item.key}`) : title;
}

function filterNavItems(
  items: NavItem[],
  currentUser?: { permissions: string[] },
) {
  if (!currentUser) return items.filter((item) => !item.permission);
  return items.filter(
    (item) =>
      !item.permission || currentUser.permissions.includes(item.permission),
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "purple" | "blue" | "amber";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "purple" && "bg-violet-50 text-violet-700",
        tone === "blue" && "bg-sky-50 text-sky-700",
        tone === "amber" && "bg-amber-50 text-amber-700",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <BadgeCheck className="mb-3 text-primary" size={28} />
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-fg">{text}</p>
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
      {children}
    </div>
  );
}

export function SectionToolbar({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
      <h2 className="font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function DataSourceBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-fg">
      <Database size={13} />
      MySQL
    </span>
  );
}
