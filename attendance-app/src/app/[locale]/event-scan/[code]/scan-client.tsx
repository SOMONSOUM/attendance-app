"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useEffect, useMemo, useState } from "react";
import type React from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import {
  CircleAlert,
  AtSign,
  Badge,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  Languages,
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  Phone,
  QrCode,
  Search,
  Send,
  Share2,
  Sun,
  User,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
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
  mode:
    | "BULK_REGISTRATION"
    | "PRE_REGISTRATION"
    | "OPEN_REGISTRATION";
  separateQrByPlace?: boolean;
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
  personalQrEnabled?: boolean;
  personalQrDeliveryMethods?: string;
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
    setValue,
    formState: { errors },
  } = useForm<OpenRegistrationValues>({
    resolver: zodResolver(openRegistrationSchema),
    defaultValues: {
      fullNameEn: "",
      fullNameKm: "",
      gender: "MALE",
      title: "",
      position: "",
      organization: "",
      phoneNumber: "",
      email: "",
      deliveryMethod: "download",
    },
  });
  const form = watch();
  const [status, setStatus] = useState<string>(t("readyStatus"));
  const [attendeeQr, setAttendeeQr] = useState<{
    fullNameEn: string;
    qrImage: string;
    cardImage?: string;
    delivery?: {
      method: string;
      telegramUrl?: string | null;
      emailSent?: boolean;
    } | null;
  } | null>(null);
  const [warning, setWarning] = useState<WarningKey | null>(null);
  const [appearance, setAppearance] = useState<AppearanceMode>("system");
  const [mounted, setMounted] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [profileImage, setProfileImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

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
      fontFamily: `${event.theme?.fontFamily ?? "Google Sans"}, system-ui, sans-serif`,
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

  useEffect(() => {
    return () => {
      if (profileImage?.url) URL.revokeObjectURL(profileImage.url);
    };
  }, [profileImage?.url]);

  function changeLocale(locale: string) {
    const nextPath = pathname.replace(/^\/(en|km)(?=\/|$)/, `/${locale}`);
    router.replace(`${nextPath}${window.location.search}`);
  }

  function changeAppearance(mode: AppearanceMode) {
    setAppearance(mode);
    setTheme(mode);
  }

  function changeProfileImage(file?: File | null) {
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setProfileImage((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return { url: nextUrl, name: file.name };
    });
  }

  function removeProfileImage() {
    setProfileImage((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return null;
    });
  }

  useEffect(() => {
    if (!isRegisteredListMode(event.mode)) return;

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
          ...(event.separateQrByPlace && event.scanPlace?.id
            ? { placeId: event.scanPlace.id }
            : {}),
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

    if (!isRegisteredListMode(event.mode) && !(await trigger())) {
      return;
    }

    setBusy(true);
    setStatus(
      event.mode === "BULK_REGISTRATION"
        ? "Preparing your personal QR..."
        : "Registering attendee...",
    );

    try {
      const position =
        event.mode !== "BULK_REGISTRATION" && event.requireLocation
          ? await getCurrentLocation()
          : null;
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

      const response = await api<{
        fullNameEn: string;
        qrImage?: string;
        cardImage?: string;
        delivery?: {
          method: string;
          telegramUrl?: string | null;
          emailSent?: boolean;
        } | null;
      }>(
        event.mode === "BULK_REGISTRATION"
          ? `/attendance/qr/${code}/join`
          : `/attendance/qr/${code}/register`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      if (response.qrImage) {
        setAttendeeQr({
          fullNameEn: response.fullNameEn,
          qrImage: response.qrImage,
          cardImage: response.cardImage,
          delivery: response.delivery,
        });
        setStatus("Registration complete. Show this QR to admin at arrival.");
        if (response.delivery?.telegramUrl) {
          window.location.href = response.delivery.telegramUrl;
        }
      } else {
        setStatus(t("confirmedStatus"));
      }
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
      className="scan-theme min-h-screen bg-background px-4 py-6 text-foreground"
      style={themeStyle}
    >
      <div className="mx-auto max-w-3xl space-y-5">
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
        {isRegisteredListMode(event.mode) ? (
          <EventHeaderCard event={event} label={registrationModeLabel(event.mode, t)} />
        ) : null}

        <Card className="space-y-4 border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5">
          {isRegisteredListMode(event.mode) ? (
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
                        {[person.fullNameKm, person.position, person.organization]
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

          {attendeeQr ? (
            <RegistrationSurface>
              <EventHeaderCard event={event} label={registrationModeLabel(event.mode, t)} compact />
              <RegistrationSuccess
                contextName={event.name}
                fullName={attendeeQr.fullNameEn}
                qrImage={attendeeQr.qrImage}
                cardImage={attendeeQr.cardImage}
                delivery={attendeeQr.delivery}
                profileImageUrl={profileImage?.url}
                t={t}
              />
            </RegistrationSurface>
          ) : !isRegisteredListMode(event.mode) ? (
            <RegistrationSurface>
              <EventHeaderCard event={event} label={registrationModeLabel(event.mode, t)} compact />
              <RegistrationWizard
                step={registrationStep}
                setStep={setRegistrationStep}
                form={form}
                register={register}
                errors={errors}
                setValue={setValue}
                trigger={trigger}
                busy={busy}
                personalQrEnabled={event.personalQrEnabled ?? true}
                methods={event.personalQrDeliveryMethods}
                profileImage={profileImage}
                onProfileImageChange={changeProfileImage}
                onProfileImageRemove={removeProfileImage}
                onSubmit={join}
                t={t}
              />
            </RegistrationSurface>
          ) : selected ? (
            <div className="rounded-md bg-secondary p-4">
              <p className="font-semibold">{selected.fullNameEn}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label={t("khmerName")} value={selected.fullNameKm} />
                <Detail label={t("gender")} value={selected.gender} />
                <Detail label={t("position")} value={selected.position} />
                <Detail label={t("organization")} value={selected.organization} />
                <Detail label={t("phoneNumber")} value={selected.phoneNumber} />
              </dl>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-fg">
              {t("selectBeforeJoining")}
            </div>
          )}

          {isRegisteredListMode(event.mode) ? (
            <Button
              disabled={busy || Boolean(attendeeQr) || Boolean(scanBlockReason) || !selected}
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
          ) : null}
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

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

async function shareRegistrationCard(title: string, text: string) {
  if (!navigator.share) return;
  await navigator.share({ title, text });
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

  if (now < startOfDay(startsAt) && event.mode === "BULK_REGISTRATION") {
    return "eventNotStarted";
  }
  if (now > endOfDay(endsAt)) return "eventEnded";
  if (event.mode !== "BULK_REGISTRATION" || !event.shifts.length) return null;

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

function isRegisteredListMode(mode: Event["mode"]) {
  return mode === "BULK_REGISTRATION";
}

function registrationModeLabel(
  mode: Event["mode"],
  t: ReturnType<typeof useTranslations<"scan">>,
) {
  if (mode === "OPEN_REGISTRATION") return t("openRegistration");
  if (mode === "PRE_REGISTRATION") return t("preRegistration");
  return t("bulkRegistration");
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

function RegistrationSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl shadow-black/5 sm:p-6">
      {children}
    </div>
  );
}

function EventHeaderCard({
  event,
  label,
  compact = false,
}: {
  event: Event;
  label: string;
  compact?: boolean;
}) {
  const startsAt = new Date(event.startsAt);
  const location = event.scanPlace?.locationName ?? event.locationName;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-secondary text-primary">
            <CalendarDays size={25} />
          </span>
          <div className="min-w-0">
            <h1
              className={`truncate font-bold tracking-tight text-card-foreground ${
                compact ? "text-xl" : "text-2xl"
              }`}
            >
              {event.name}
            </h1>
            <p className="truncate text-sm font-medium text-muted-fg">
              {[location, startsAt.toLocaleDateString()].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-semibold text-primary">
          <UserRoundPlus size={16} />
          {label}
        </span>
      </div>
      {!compact && event.description ? (
        <p className="mt-4 text-sm font-medium text-muted-fg">{event.description}</p>
      ) : null}
    </section>
  );
}

function RegistrationWizard({
  step,
  setStep,
  form,
  register,
  errors,
  setValue,
  trigger,
  busy,
  personalQrEnabled,
  methods,
  profileImage,
  onProfileImageChange,
  onProfileImageRemove,
  onSubmit,
  t,
}: {
  step: number;
  setStep: (step: number) => void;
  form: OpenRegistrationValues;
  register: UseFormRegister<OpenRegistrationValues>;
  errors: FieldErrors<OpenRegistrationValues>;
  setValue: UseFormSetValue<OpenRegistrationValues>;
  trigger: UseFormTrigger<OpenRegistrationValues>;
  busy: boolean;
  personalQrEnabled: boolean;
  methods?: string;
  profileImage: { url: string; name: string } | null;
  onProfileImageChange: (file?: File | null) => void;
  onProfileImageRemove: () => void;
  onSubmit: () => void;
  t: ReturnType<typeof useTranslations<"scan">>;
}) {
  async function next() {
    const fields =
      step === 1
        ? (["fullNameEn", "fullNameKm", "gender", "position"] as const)
        : step === 2
          ? (["organization", "phoneNumber"] as const)
          : step === 3 && form.deliveryMethod === "email"
            ? (["email"] as const)
            : ([] as const);
    if (fields.length && !(await trigger(fields))) return;
    setStep(Math.min(step + 1, 4));
  }

  return (
    <div className="space-y-5">
      <StepProgress step={step} />
      {step === 1 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<UserRoundPlus size={18} />} title={t("profilePhoto")} />
          <div className="flex items-center gap-5 rounded-2xl border border-border bg-secondary/50 p-4">
            <label className="relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-card text-primary">
              {profileImage ? (
                <img
                  src={profileImage.url}
                  alt={t("profilePicture")}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid justify-items-center gap-1 text-xs font-bold">
                  <User size={24} />
                  {t("upload")}
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={(event) => {
                  onProfileImageChange(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <div>
              <p className="text-lg font-semibold text-card-foreground">{t("profilePicture")}</p>
              <p className="mt-1 text-sm font-medium text-muted-fg">
                {profileImage?.name ?? t("profileHelp")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-sm font-medium text-primary">
                  {profileImage ? t("replace") : t("upload")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="sr-only"
                    onChange={(event) => {
                      onProfileImageChange(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                {profileImage ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 text-destructive"
                    onClick={onProfileImageRemove}
                  >
                    {t("remove")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <SectionTitle icon={<Badge size={18} />} title={t("personalInformation")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("fullNameKmLabel")} error={errors.fullNameKm?.message}>
              <IconInput icon={<Languages size={16} />} placeholder={t("fullNameKmPlaceholder")} invalid={Boolean(errors.fullNameKm)} {...register("fullNameKm")} />
            </Field>
            <Field label={t("fullNameEnLabel")} error={errors.fullNameEn?.message}>
              <IconInput icon={<Badge size={16} />} placeholder={t("fullNameEnPlaceholder")} invalid={Boolean(errors.fullNameEn)} {...register("fullNameEn")} />
            </Field>
          </div>
          <GenderPicker
            value={form.gender}
            onChange={(value) => setValue("gender", value)}
            t={t}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("position")} error={errors.position?.message}>
              <IconInput icon={<BriefcaseBusiness size={16} />} placeholder={t("positionPlaceholder")} invalid={Boolean(errors.position)} {...register("position")} />
            </Field>
            <Field label={t("title")}>
              <IconInput icon={<Badge size={16} />} placeholder={t("titlePlaceholder")} {...register("title")} />
            </Field>
          </div>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<Phone size={18} />} title={t("contactOrganization")} />
          <Field label={t("phoneNumber")} error={errors.phoneNumber?.message}>
            <IconInput icon={<Phone size={16} />} placeholder={t("phonePlaceholder")} invalid={Boolean(errors.phoneNumber)} {...register("phoneNumber")} />
          </Field>
          <Field label={t("organizationLabel")} error={errors.organization?.message}>
            <IconInput icon={<Building2 size={16} />} placeholder={t("organizationPlaceholder")} invalid={Boolean(errors.organization)} {...register("organization")} />
            <p className="-mt-1 text-xs font-medium text-muted-fg">
              {t("certificateHelp")}
            </p>
          </Field>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<QrCode size={17} />} title={t("receiveQrVia")} />
          <DeliveryOptions
            enabled={personalQrEnabled}
            methods={methods}
            selected={form.deliveryMethod ?? "download"}
            email={form.email ?? ""}
            emailError={errors.email?.message}
            onMethodChange={(value) =>
              setValue("deliveryMethod", value, { shouldValidate: true })
            }
            onEmailChange={(value) =>
              setValue("email", value, { shouldValidate: true })
            }
            t={t}
          />
        </div>
      ) : null}
      {step === 4 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<CheckCircle2 size={17} />} title={t("reviewDetails")} />
          <div className="rounded-2xl border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-4">
              {profileImage ? (
                <img
                  src={profileImage.url}
                  alt={t("profilePicture")}
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-16 place-items-center rounded-full bg-card text-muted-fg">
                  <User size={24} />
                </span>
              )}
              <div>
                <p className="text-lg font-semibold">{form.fullNameEn || "-"}</p>
                <p className="text-sm text-muted-fg">
                  {[form.position, form.gender].filter(Boolean).join(" · ") || "-"}
                </p>
              </div>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <ReviewRow label={t("khmerName")} value={form.fullNameKm} />
              <ReviewRow label={t("fullNameEnLabel")} value={form.fullNameEn} />
              <ReviewRow label={t("position")} value={form.position} />
              <ReviewRow label={t("title")} value={form.title} />
              <ReviewRow label={t("phoneNumber")} value={form.phoneNumber} />
              <ReviewRow label={t("organization")} value={form.organization} />
              <ReviewRow label={t("qrVia")} value={form.deliveryMethod ?? "download"} />
            </dl>
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          className="border-primary text-primary hover:bg-secondary"
          disabled={step === 1 || busy}
          onClick={() => setStep(Math.max(step - 1, 1))}
        >
          {t("back")}
        </Button>
        <span className="text-sm font-medium text-muted-fg">
          {t("stepOf", { step })}
        </span>
        {step < 4 ? (
          <Button type="button" className="min-w-36 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void next()}>
            {t("continue")} →
          </Button>
        ) : (
          <Button type="button" disabled={busy} className="min-w-32 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onSubmit}>
            <Send size={16} />
            {busy ? t("submitting") : t("submit")}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepProgress({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-center rounded-2xl bg-secondary/50 p-3">
      {[1, 2, 3, 4].map((item) => (
        <Fragment key={item}>
          <div
            className={`flex size-9 items-center justify-center rounded-full border text-sm font-semibold ${
              item < step
                ? "border-primary bg-primary text-primary-foreground"
                : item === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-fg"
            }`}
          >
            {item < step ? <Check size={17} /> : item}
          </div>
          {item < 4 ? (
            <div
              className={`mx-2 h-0.5 ${
                item < step ? "bg-primary" : "bg-border"
              }`}
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 text-base font-semibold text-card-foreground">
      <span className="text-muted-fg">{icon}</span>
      {title}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-card-foreground">
      {label}
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function IconInput({
  icon,
  invalid = false,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof Input> & {
  icon: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg">
        {icon}
      </span>
      <Input
        className={`h-12 rounded-xl bg-card pl-10 text-base font-medium text-card-foreground shadow-sm placeholder:text-muted-fg focus-visible:ring-primary ${
          invalid
            ? "border-destructive focus-visible:ring-destructive"
            : "border-border"
        } ${className}`}
        {...props}
      />
    </div>
  );
}

function GenderPicker({
  value,
  onChange,
  t,
}: {
  value: "MALE" | "FEMALE" | "OTHER";
  onChange: (value: "MALE" | "FEMALE" | "OTHER") => void;
  t: ReturnType<typeof useTranslations<"scan">>;
}) {
  const options = [
    { value: "MALE" as const, label: t("male"), symbol: "♂" },
    { value: "FEMALE" as const, label: t("female"), symbol: "♀" },
    { value: "OTHER" as const, label: t("other"), symbol: "⚧" },
  ];

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-card-foreground">{t("gender")}</p>
      <div className="grid gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex h-12 items-center gap-3 rounded-xl border px-4 text-left text-base font-semibold transition ${
                selected
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-card text-card-foreground hover:border-primary/40"
              }`}
              onClick={() => onChange(option.value)}
            >
              <span
                className={`grid size-6 place-items-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-border"
                }`}
              >
                {selected ? <span className="size-3 rounded-full bg-primary" /> : null}
              </span>
              <span className="text-xl leading-none text-primary">
                {option.symbol}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-b-0">
      <dt className="font-medium text-muted-fg">{label}</dt>
      <dd className="text-right font-semibold text-card-foreground">{value?.trim() || "-"}</dd>
    </div>
  );
}

function RegistrationSuccess({
  contextName,
  fullName,
  qrImage,
  cardImage,
  delivery,
  profileImageUrl,
  t,
}: {
  contextName: string;
  fullName: string;
  qrImage: string;
  cardImage?: string;
  delivery?: { method: string; emailSent?: boolean; telegramUrl?: string | null } | null;
  profileImageUrl?: string;
  t: ReturnType<typeof useTranslations<"scan">>;
}) {
  return (
    <div className="grid justify-items-center gap-5 rounded-2xl border border-border bg-card p-6 text-center">
      <div className="w-full rounded-xl border border-border bg-secondary p-3 text-base font-semibold text-primary">
        {delivery?.method === "email" && delivery.emailSent
          ? t("qrSentEmail")
          : delivery?.method === "telegram"
            ? t("openTelegramQr")
            : t("registrationComplete")}
      </div>
      {profileImageUrl ? (
        <img
          src={profileImageUrl}
          alt={t("profilePicture")}
          className="size-20 rounded-full border border-border object-cover"
        />
      ) : null}
      <img
        src={qrImage}
        alt={t("personalQrAlt")}
        className="size-44 rounded-2xl border border-border bg-white p-3 shadow-sm"
      />
      <div>
        <p className="text-2xl font-bold">{fullName}</p>
        <p className="text-base font-medium text-muted-fg">{contextName}</p>
      </div>
      {cardImage ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadDataUrl(cardImage, "attendee-card.png")}
          >
            <Download size={16} />
            {t("downloadQr")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void shareRegistrationCard(
                `${fullName} QR`,
                `${fullName} registration QR for ${contextName}`,
              )
            }
          >
            <Share2 size={16} />
            {t("share")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function DeliveryOptions({
  enabled,
  methods,
  selected,
  email,
  emailError,
  onMethodChange,
  onEmailChange,
  t,
}: {
  enabled: boolean;
  methods?: string;
  selected: "download" | "email" | "telegram";
  email: string;
  emailError?: string;
  onMethodChange: (value: "download" | "email" | "telegram") => void;
  onEmailChange: (value: string) => void;
  t: ReturnType<typeof useTranslations<"scan">>;
}) {
  if (!enabled) return null;
  const allowed = new Set((methods || "download,email,telegram").split(","));
  const options = [
    { value: "download" as const, label: t("download"), help: t("downloadHelp"), icon: Download },
    { value: "telegram" as const, label: t("telegram"), help: t("telegramHelp"), icon: MessageCircle },
    { value: "email" as const, label: t("email"), help: t("emailHelp"), icon: Mail },
  ].filter((option) => allowed.has(option.value));

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-card-foreground">{t("receivePersonalQr")}</p>
      <div className="grid gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-left transition ${
                selected === option.value
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-card text-card-foreground hover:border-primary/40"
              }`}
              onClick={() => onMethodChange(option.value)}
            >
              <span
                className={`grid size-14 shrink-0 place-items-center rounded-2xl border ${
                  selected === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-muted-fg"
                }`}
              >
                <Icon size={25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{option.label}</span>
                <span className="block text-sm font-semibold opacity-75">
                  {option.help}
                </span>
              </span>
              {selected === option.value ? (
                <CheckCircle2 size={22} className="shrink-0 text-primary" />
              ) : null}
            </button>
          );
        })}
      </div>
      {selected === "email" ? (
        <div className="rounded-2xl border border-border bg-secondary p-4">
          <Field label={t("emailAddress")} error={emailError}>
            <IconInput
              icon={<AtSign size={16} />}
              invalid={Boolean(emailError)}
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </Field>
        </div>
      ) : null}
    </div>
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
