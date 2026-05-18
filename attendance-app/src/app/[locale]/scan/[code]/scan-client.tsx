"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Check,
  CheckCircle2,
  Languages,
  LocateFixed,
  Monitor,
  Moon,
  QrCode,
  Search,
  Sun,
  UserRoundPlus,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type AppearanceMode } from "@/components/appearance-provider";
import { api } from "@/lib/api";

type Registration = {
  id: string;
  fullNameEn: string;
  fullNameKm?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  position?: string;
  department?: string;
};

type Event = {
  id: string;
  name: string;
  description?: string | null;
  mode: "PRE_REGISTERED" | "OPEN_REGISTRATION";
  locationName: string;
  startsAt: string;
  endsAt: string;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    backgroundImageUrl?: string | null;
    fontFamily: string;
    fontSize: number;
    radius: number;
    appearance: "light" | "dark" | "system";
  } | null;
};

export function ScanClient({ code, event }: { code: string; event: Event }) {
  const t = useTranslations("scan");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [results, setResults] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [form, setForm] = useState({
    fullNameEn: "",
    fullNameKm: "",
    gender: "MALE",
    position: "",
    department: "",
  });
  const [status, setStatus] = useState<string>(t("readyStatus"));
  const [busy, setBusy] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem("attendance-appearance")) {
      setTheme(event.theme?.appearance ?? "system");
    }
  }, [event.theme?.appearance, setTheme]);

  useEffect(() => {
    setAppearance((theme as AppearanceMode | undefined) ?? "system");
  }, [theme]);

  const effectiveAppearance = mounted ? appearance : "light";
  const resolvedDark = mounted && resolvedTheme === "dark";

  const themeStyle = useMemo(() => {
    const primaryColor = event.theme?.primaryColor ?? "#5b3fd5";
    const pageBackground = resolvedDark
      ? "#111018"
      : event.theme?.backgroundColor ?? "#fbfafc";

    return {
      "--primary": primaryColor,
      "--primary-foreground": readableForeground(primaryColor),
      "--background": pageBackground,
      "--foreground": resolvedDark ? "#f7f4ff" : "#17131f",
      "--card": resolvedDark ? "#191724" : "#ffffff",
      "--card-foreground": resolvedDark ? "#f7f4ff" : "#17131f",
      "--secondary": resolvedDark ? "#262138" : "#f3f0fb",
      "--secondary-foreground": resolvedDark ? "#f7f4ff" : "#2d2544",
      "--muted": resolvedDark ? "#211e2d" : "#f5f3f8",
      "--border": resolvedDark ? "#343047" : "#e7e3ee",
      "--input": resolvedDark ? "#403a55" : "#ded8eb",
      "--ring": primaryColor,
      "--radius": `${event.theme?.radius ?? 8}px`,
      fontFamily: `${event.theme?.fontFamily ?? "Inter"}, "Noto Sans Khmer", system-ui, sans-serif`,
      fontSize: `${event.theme?.fontSize ?? 16}px`,
      backgroundColor: pageBackground,
      backgroundImage: event.theme?.backgroundImageUrl
        ? `${resolvedDark ? "linear-gradient(rgba(17,16,24,.84), rgba(17,16,24,.92))" : "linear-gradient(rgba(247,249,252,.86), rgba(247,249,252,.92))"}, url(${event.theme.backgroundImageUrl})`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as CSSProperties;
  }, [event.theme, resolvedDark]);

  function changeLocale(locale: string) {
    const nextPath = pathname.replace(/^\/(en|km)(?=\/|$)/, `/${locale}`);
    router.replace(`${nextPath}${window.location.search}`);
  }

  function changeAppearance(mode: AppearanceMode) {
    setAppearance(mode);
    setTheme(mode);
  }

  useEffect(() => {
    if (event.mode !== "PRE_REGISTERED") return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      void searchRegistrations(trimmedQuery);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [event.id, event.mode, query]);

  async function searchRegistrations(value = query.trim()) {
    if (!value) return;
    setSelected(null);
    setSearching(true);
    setHasSearched(true);
    try {
      const data = await api<Registration[]>(
        `/events/${event.id}/registrations/search?q=${encodeURIComponent(value)}`,
      );
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  async function join() {
    setBusy(true);
    setStatus(t("checkingLocation"));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          ...(selected ?? form),
          registrationId: selected?.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          await api(`/attendance/qr/${code}/join`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
          setStatus(t("confirmedStatus"));
        } catch (error) {
          setStatus(
            error instanceof Error ? error.message : t("couldNotJoin"),
          );
        } finally {
          setBusy(false);
        }
      },
      () => {
        setStatus(t("locationRequired"));
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <main
      className="scan-theme min-h-screen border-t-4 border-primary bg-background px-4 py-6"
      style={themeStyle}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex flex-wrap justify-end gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <Languages size={16} className="text-primary" />
            <Select
              value={params.locale}
              onChange={(event) => changeLocale(event.target.value)}
              className="h-8 border-0 bg-transparent px-1"
            >
              <option value="en">{t("english")}</option>
              <option value="km">{t("khmer")}</option>
            </Select>
          </div>
          <div className="flex gap-1 rounded-md border border-border bg-card p-1">
            <ModeButton
              icon={Sun}
              active={effectiveAppearance === "light"}
              label="Light"
              onClick={() => changeAppearance("light")}
            />
            <ModeButton
              icon={Moon}
              active={effectiveAppearance === "dark"}
              label="Dark"
              onClick={() => changeAppearance("dark")}
            />
            <ModeButton
              icon={Monitor}
              active={effectiveAppearance === "system"}
              label="System"
              onClick={() => changeAppearance("system")}
            />
          </div>
        </div>
        <section className="rounded-lg border border-border bg-card-glass p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
              <QrCode size={22} />
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              {event.mode === "PRE_REGISTERED"
                ? t("preRegistered")
                : t("openRegistration")}
            </span>
          </div>
          <p className="text-sm font-medium text-muted-fg">
            {event.locationName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {event.name}
          </h1>
          {event.description ? (
            <p className="mt-3 text-muted-fg">{event.description}</p>
          ) : null}
        </section>

        <Card className="space-y-4 p-4 sm:p-5">
          {event.mode === "PRE_REGISTERED" ? (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    void setQuery(e.target.value)
                  }
                  placeholder={t("searchPlaceholder")}
                />
                <Button
                  onClick={() => void searchRegistrations()}
                  aria-label={t("searchButton")}
                >
                  <Search size={18} />
                    <span className="sm:hidden">{t("searchButton")}</span>
                </Button>
              </div>
              <div className="grid gap-2">
                {searching ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                    {t("searching")}
                  </p>
                ) : null}
                {results.map((person) => (
                  <button
                    className={`flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted ${
                      selected?.id === person.id
                        ? "border-primary bg-secondary"
                        : "border-border"
                    }`}
                    key={person.id}
                    onClick={() => {
                      setSelected(person);
                      setResults([]);
                    }}
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded border border-border bg-background">
                      {selected?.id === person.id ? (
                        <Check size={14} className="text-primary" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate">{person.fullNameEn}</strong>
                      <span className="block truncate text-sm text-muted-fg">
                        {[person.fullNameKm, person.position, person.department]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
                {hasSearched &&
                query.trim() &&
                !searching &&
                !results.length &&
                !selected ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                    {t("noMatch")}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {event.mode === "OPEN_REGISTRATION" ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRoundPlus size={16} className="text-primary" />
                {t("registrationDetails")}
              </div>
              <Input
                placeholder={t("fullNameEn")}
                value={form.fullNameEn}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, fullNameEn: e.target.value })
                }
              />
              <Input
                placeholder={t("fullNameKm")}
                value={form.fullNameKm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, fullNameKm: e.target.value })
                }
              />
              <Select
                value={form.gender}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, gender: e.target.value })
                }
              >
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
                <option value="OTHER">{t("other")}</option>
              </Select>
              <Input
                placeholder={t("position")}
                value={form.position}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, position: e.target.value })
                }
              />
              <Input
                placeholder={t("department")}
                value={form.department}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </div>
          ) : selected ? (
            <div className="rounded-md bg-secondary p-4">
              <p className="font-semibold">{selected.fullNameEn}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label={t("khmerName")} value={selected.fullNameKm} />
                <Detail label={t("gender")} value={selected.gender} />
                <Detail label={t("position")} value={selected.position} />
                <Detail label={t("department")} value={selected.department} />
              </dl>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-fg">
              {t("selectBeforeJoining")}
            </div>
          )}

          <Button
            disabled={
              busy ||
              (event.mode === "PRE_REGISTERED"
                ? !selected
                : !form.fullNameEn.trim())
            }
            onClick={join}
            className="w-full"
          >
            {status === t("confirmedStatus") ? (
              <CheckCircle2 size={18} />
            ) : (
              <LocateFixed size={18} />
            )}
            {t("join")}
          </Button>
          <p className="text-center text-sm text-muted-fg">{status}</p>
        </Card>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-fg">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "-"}</dd>
    </div>
  );
}

function readableForeground(background: string) {
  const hex = background.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#17131f" : "#ffffff";
}

function ModeButton({
  icon: Icon,
  active,
  label,
  onClick,
}: {
  icon: typeof Sun;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      className="size-8 px-0"
      aria-label={label}
      onClick={onClick}
    >
      <Icon size={16} />
    </Button>
  );
}
