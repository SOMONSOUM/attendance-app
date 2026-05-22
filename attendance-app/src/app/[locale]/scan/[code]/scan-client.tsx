"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  CircleAlert,
  Check,
  CheckCircle2,
  Languages,
  Monitor,
  Moon,
  QrCode,
  Search,
  Sun,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AppearanceMode } from "@/components/appearance-provider";
import { ApiRequestError, api } from "@/lib/api";
import {
  type ScanRegistration as Registration,
  useScanStore,
} from "@/lib/scan-store";
import {
  openRegistrationSchema,
  type OpenRegistrationValues,
} from "@/lib/validation";

type Event = {
  id: string;
  name: string;
  description?: string | null;
  mode: "PRE_REGISTERED" | "OPEN_REGISTRATION";
  locationName?: string;
  requireLocation?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  radiusMeters?: number;
  startsAt: string;
  endsAt: string;
  shifts: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  }[];
  scanPlace?: {
    id: string;
    name: string;
    description?: string | null;
    locationName?: string | null;
  } | null;
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

type WarningKey = "eventNotStarted" | "eventEnded" | "invalidShiftTime";

export function ScanClient({ code, event }: { code: string; event: Event }) {
  const t = useTranslations("scan");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const {
    results,
    selected,
    searching,
    hasSearched,
    busy,
    alreadyJoinedOpen,
    setResults,
    setSelected,
    setSearching,
    setHasSearched,
    setBusy,
    setAlreadyJoinedOpen,
  } = useScanStore();
  const {
    register,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<OpenRegistrationValues>({
    resolver: zodResolver(openRegistrationSchema),
    defaultValues: {
      fullNameEn: "",
      fullNameKm: "",
      gender: "MALE",
      position: "",
      department: "",
    },
  });
  const form = watch();
  const [status, setStatus] = useState<string>(t("readyStatus"));
  const [warning, setWarning] = useState<WarningKey | null>(null);
  const [appearance, setAppearance] = useState<AppearanceMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setAppearance((theme as AppearanceMode | undefined) ?? "system");
  }, [theme]);

  const effectiveAppearance = mounted ? appearance : "light";
  const scanBlockReason = useMemo(() => getScanBlockReason(event), [event]);

  const themeStyle = useMemo(() => {
    const primaryColor = event.theme?.primaryColor ?? "#5b3fd5";
    const backgroundImageUrl = event.theme?.backgroundImageUrl;

    return {
      "--event-primary": primaryColor,
      "--event-primary-foreground": readableForeground(primaryColor),
      "--event-background": event.theme?.backgroundColor ?? "#fbfafc",
      "--radius": `${event.theme?.radius ?? 8}px`,
      fontFamily: `${event.theme?.fontFamily ?? "Inter"}, "Noto Sans Khmer", system-ui, sans-serif`,
      fontSize: `${event.theme?.fontSize ?? 16}px`,
      backgroundImage: backgroundImageUrl
        ? `linear-gradient(var(--scan-image-overlay), var(--scan-image-overlay)), url(${backgroundImageUrl})`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } as CSSProperties;
  }, [event.theme]);

  useEffect(() => {
    setWarning(scanBlockReason);
  }, [scanBlockReason]);

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
        `/events/${event.id}/registrations/search?${new URLSearchParams({
          q: value,
          ...(event.scanPlace?.id ? { placeId: event.scanPlace.id } : {}),
        })}`,
      );
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  async function join() {
    if (scanBlockReason) {
      setWarning(scanBlockReason);
      return;
    }

    if (event.mode === "OPEN_REGISTRATION" && !(await trigger())) {
      return;
    }

    setBusy(true);
    setStatus(event.requireLocation ? "Requesting your current location..." : t("checkingLocation"));

    try {
      const position = event.requireLocation ? await getCurrentLocation() : null;
      const payload = {
        ...(selected ?? getValues()),
        registrationId: selected?.id,
        ...(position
          ? {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          : {}),
      };

      await api(`/attendance/qr/${code}/join`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatus(t("confirmedStatus"));
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "ALREADY_JOINED") {
        setAlreadyJoinedOpen(true);
        setStatus(t("alreadyJoinedStatus"));
      } else if (
        error instanceof ApiRequestError &&
        (error.code === "EVENT_NOT_STARTED" ||
          error.code === "EVENT_ENDED" ||
          error.code === "INVALID_SHIFT_TIME")
      ) {
        const nextWarning =
          error.code === "EVENT_NOT_STARTED"
            ? "eventNotStarted"
            : error.code === "EVENT_ENDED"
              ? "eventEnded"
              : "invalidShiftTime";
        setWarning(nextWarning);
        setStatus(t(`${nextWarning}Status`));
      } else {
        setStatus(error instanceof Error ? error.message : t("couldNotJoin"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="scan-theme min-h-screen border-t-4 border-primary bg-background px-4 py-6"
      style={themeStyle}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex flex-wrap justify-end gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1">
            <Languages size={16} className="text-primary" />
            <Select
              value={params.locale}
              onValueChange={(value) => changeLocale(value)}
            >
              <SelectTrigger className="h-9 min-w-24 border-0 bg-transparent px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("english")}</SelectItem>
                <SelectItem value="km">{t("khmer")}</SelectItem>
              </SelectContent>
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
            {new Date(event.startsAt).toLocaleString()}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {event.name}
          </h1>
          {event.scanPlace ? (
            <p className="mt-2 text-sm font-medium text-primary">
              {event.scanPlace.name}
            </p>
          ) : null}
          {event.description ? (
            <p className="mt-3 text-muted-fg">{event.description}</p>
          ) : null}
          {event.requireLocation ? (
            <p className="mt-3 rounded-md border border-border bg-background/70 p-3 text-sm text-muted-fg">
              Location check-in is required within {event.radiusMeters ?? 100}m of{" "}
              {event.locationName || "the venue"}.
            </p>
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
                      <strong className="block truncate">
                        {person.fullNameEn}
                      </strong>
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
                {...register("fullNameEn")}
              />
              {errors.fullNameEn ? (
                <p className="text-xs text-destructive">
                  {errors.fullNameEn.message}
                </p>
              ) : null}
              <Input
                placeholder={t("fullNameKm")}
                {...register("fullNameKm")}
              />
              <NativeSelect {...register("gender")}>
                <option value="MALE">{t("male")}</option>
                <option value="FEMALE">{t("female")}</option>
                <option value="OTHER">{t("other")}</option>
              </NativeSelect>
              <Input
                placeholder={t("position")}
                {...register("position")}
              />
              <Input
                placeholder={t("department")}
                {...register("department")}
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
              Boolean(scanBlockReason) ||
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
              <Check size={18} />
            )}
            {t("join")}
          </Button>
          <p className="text-center text-sm text-muted-fg">{status}</p>
        </Card>
      </div>

      {alreadyJoinedOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="already-joined-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                  <CircleAlert size={22} />
                </span>
                <div>
                  <h2
                    id="already-joined-title"
                    className="text-lg font-semibold"
                  >
                    {t("alreadyJoinedTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-fg">
                    {t("alreadyJoinedMessage")}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="size-8 shrink-0 px-0"
                aria-label={t("close")}
                onClick={() => setAlreadyJoinedOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <Button
              type="button"
              className="mt-5 w-full"
              onClick={() => setAlreadyJoinedOpen(false)}
            >
              {t("ok")}
            </Button>
          </div>
        </div>
      ) : null}

      {warning ? (
        <WarningDialog
          title={t(`${warning}Title`)}
          message={t(`${warning}Message`)}
          closeLabel={t("close")}
          okLabel={t("ok")}
          onClose={() => setWarning(null)}
        />
      ) : null}
    </main>
  );
}

function WarningDialog({
  title,
  message,
  closeLabel,
  okLabel,
  onClose,
}: {
  title: string;
  message: string;
  closeLabel: string;
  okLabel: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-warning-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
              <CircleAlert size={22} />
            </span>
            <div>
              <h2 id="scan-warning-title" className="text-lg font-semibold">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-fg">{message}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="size-8 shrink-0 px-0"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>
        <Button type="button" className="mt-5 w-full" onClick={onClose}>
          {okLabel}
        </Button>
      </div>
    </div>
  );
}

function getScanBlockReason(event: Event): WarningKey | null {
  const now = new Date();
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);

  if (now < startOfDay(startsAt)) return "eventNotStarted";
  if (now > endOfDay(endsAt)) return "eventEnded";
  if (!event.shifts.length) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const activeShift = event.shifts.some((shift) =>
    isWithinShift(nowMinutes, shift.startTime, shift.endTime),
  );

  return activeShift ? null : "invalidShiftTime";
}

function isWithinShift(nowMinutes: number, startTime: string, endTime: string) {
  const startMinutes = toTimeMinutes(startTime);
  const endMinutes = toTimeMinutes(endTime);

  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

function toTimeMinutes(value: string) {
  if (value.includes("T")) {
    const time = new Date(value);
    return time.getUTCHours() * 60 + time.getUTCMinutes();
  }

  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("This browser does not support location sharing."));
  }

  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 15_000,
    });
  });
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
