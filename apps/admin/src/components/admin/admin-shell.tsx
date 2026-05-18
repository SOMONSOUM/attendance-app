import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Home,
  Palette,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/en", icon: Home },
  { label: "Events", href: "/en/events", icon: CalendarDays },
  { label: "Registrations", href: "/en/registrations", icon: FileSpreadsheet },
  { label: "Attendance", href: "/en/attendance", icon: ClipboardCheck },
  { label: "People", href: "/en/people", icon: Users },
  { label: "Roles & RBAC", href: "/en/roles", icon: ShieldCheck },
  { label: "Theme Builder", href: "/en/theme", icon: Palette, badge: "NEW" },
  { label: "Settings", href: "/en/settings", icon: Settings },
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
  return (
    <main className="min-h-screen border-t-4 border-primary bg-background">
      <div className="grid min-h-screen lg:grid-cols-[246px_1fr]">
        <aside className="hidden border-r border-border bg-card lg:block">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Link href="/en" className="flex items-center gap-3">
              <div className="relative size-9">
                <span className="absolute left-0 top-0 size-5 rounded-full bg-primary" />
                <span className="absolute bottom-0 left-2 size-5 rounded-full bg-info" />
                <span className="absolute right-0 top-3 size-5 rounded-full bg-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Attendly</p>
                <p className="mt-1 text-xs text-muted-fg">Event attendance</p>
              </div>
            </Link>
            <ChevronLeft size={17} className="text-muted-fg" />
          </div>

          <div className="px-4 py-5">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-fg">
              Menu
            </p>
            <nav className="grid gap-1">
              {navItems.slice(0, 7).map((item) => (
                <NavLink key={item.href} item={item} active={active} />
              ))}
            </nav>

            <p className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-fg">
              System
            </p>
            <nav className="grid gap-1">
              {navItems.slice(7).map((item) => (
                <NavLink key={item.href} item={item} active={active} />
              ))}
            </nav>
          </div>

          <div className="absolute bottom-5 left-4 w-[214px] rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Setup progress</p>
              <span className="text-muted-fg">x</span>
            </div>
            <p className="mb-2 text-xs text-muted-fg">62% completed</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[62%] rounded-full bg-primary" />
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
              <Search size={17} className="shrink-0 text-muted-fg" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-fg"
                placeholder="Search events, guests, QR codes..."
              />
            </div>
            <Button variant="outline" className="hidden sm:inline-flex">
              <Sparkles size={16} />
              Run AI
            </Button>
            <Button
              variant="outline"
              className="size-10 px-0"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </Button>
          </header>

          <div className="px-4 py-6 md:px-6">
            <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-1 text-sm text-muted-fg">{description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal size={16} />
                  Customize
                </Button>
                {action}
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function NavLink({ item, active }: { item: NavItem; active: string }) {
  const Icon = item.icon;
  const selected = item.label === active;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
        selected
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-fg hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon size={16} />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-info px-2 py-0.5 text-[10px] font-semibold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
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
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
