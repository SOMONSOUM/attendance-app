"use client";

import {
  Badge,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Download,
  IdCard,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Search,
  Send,
  Share2,
  UserRoundPlus,
  X,
} from "lucide-react";
import type React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ScanControls } from "@/components/scan-controls";
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
import { ApiRequestError, api } from "@/lib/api";
import type { PublicMeeting } from "./page";

const TITLE_OPTIONS = [
  { value: "Dr.", en: "Dr.", km: "បណ្ឌិត" },
  { value: "H.E.", en: "H.E.", km: "ឯកឧត្តម / លោកជំទាវ" },
  { value: "Mr.", en: "Mr.", km: "លោក" },
  { value: "Mrs.", en: "Mrs.", km: "លោកស្រី" },
  { value: "Ms.", en: "Ms.", km: "កញ្ញា / លោកស្រី" },
  { value: "Miss", en: "Miss", km: "កញ្ញា" },
  { value: "Prof.", en: "Prof.", km: "សាស្ត្រាចារ្យ" },
];
const TITLE_PLACEHOLDER = "__title_placeholder__";

type MeetingRegistrationDraft = {
  values: {
    fullNameEn: string;
    fullNameKm: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    titleName: string;
    positionName: string;
    organization: string;
    phoneNumber: string;
    email: string;
    deliveryMethod: "download" | "email" | "telegram";
  };
  step: number;
};

const meetingRegistrationDrafts = new Map<string, MeetingRegistrationDraft>();

export function MeetingScanClient({
  code,
  meeting,
}: {
  code: string;
  meeting: PublicMeeting;
}) {
  const t = useTranslations("meetingScan");
  const params = useParams<{ locale: string }>();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [fullNameKm, setFullNameKm] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [titleName, setTitleName] = useState("");
  const [positionName, setPositionName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"download" | "email" | "telegram">("download");
  const [registrationStep, setRegistrationStep] = useState(1);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(t("readyStatus"));
  const [alreadyJoinedOpen, setAlreadyJoinedOpen] = useState(false);
  const [participantQr, setParticipantQr] = useState<{
    fullNameEn: string;
    qrImage: string;
    cardImage?: string;
    delivery?: {
      method: string;
      telegramUrl?: string | null;
      emailSent?: boolean;
    } | null;
  } | null>(null);
  const selected = meeting.participants.find((item) => item.id === selectedId);
  const location = meeting.scanPlace?.locationName ?? meeting.locationName;
  const shiftText = formatShifts(meeting.shifts ?? []);
  const draftKey = `attendance-meeting-registration:${code}`;
  const registrationValues = useMemo(
    () => ({
      fullNameEn,
      fullNameKm,
      gender,
      titleName,
      positionName,
      organization,
      phoneNumber,
      email,
      deliveryMethod,
    }),
    [
      deliveryMethod,
      email,
      fullNameEn,
      fullNameKm,
      gender,
      organization,
      phoneNumber,
      positionName,
      titleName,
    ],
  );
  const availableParticipants = useMemo(
    () =>
      meeting.participants.filter((participant) => {
        if (participant.status === "JOINED") return false;
        if (meeting.scanPlace?.id && participant.placeId !== meeting.scanPlace.id) {
          return false;
        }
        const needle = query.trim().toLowerCase();
        if (!needle) return false;
        return [participant.fullNameEn, participant.fullNameKm, participant.position]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      }),
    [meeting.participants, meeting.scanPlace?.id, query],
  );
  const hasSearchTerm = Boolean(query.trim());

  useEffect(() => {
    if (isRegisteredListMode(meeting.mode)) {
      setDraftLoaded(true);
      return;
    }

    const draft = meetingRegistrationDrafts.get(draftKey);
    if (draft) {
      setFullNameEn(draft.values.fullNameEn ?? "");
      setFullNameKm(draft.values.fullNameKm ?? "");
      setGender(draft.values.gender ?? "MALE");
      setTitleName(draft.values.titleName ?? "");
      setPositionName(draft.values.positionName ?? "");
      setOrganization(draft.values.organization ?? "");
      setPhoneNumber(draft.values.phoneNumber ?? "");
      setEmail(draft.values.email ?? "");
      setDeliveryMethod(draft.values.deliveryMethod ?? "download");
      setRegistrationStep(Math.min(Math.max(draft.step, 1), 4));
    }
    setDraftLoaded(true);
  }, [draftKey, meeting.mode]);

  useEffect(() => {
    if (!draftLoaded || isRegisteredListMode(meeting.mode) || participantQr) return;

    meetingRegistrationDrafts.set(draftKey, {
      values: registrationValues,
      step: registrationStep,
    });
  }, [
    draftKey,
    draftLoaded,
    meeting.mode,
    participantQr,
    registrationStep,
    registrationValues,
  ]);
  async function join() {
    setBusy(true);
    setStatus(
      meeting.mode === "BULK_REGISTRATION" && meeting.requireLocation
        ? t("requestingLocation")
        : meeting.mode === "BULK_REGISTRATION"
          ? t("checkingIn")
          : t("registeringParticipant"),
    );

    try {
      const position =
        meeting.mode === "BULK_REGISTRATION" && meeting.requireLocation
          ? await getCurrentLocation()
          : null;
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
        `/meetings/qr/${code}/join`,
        {
          method: "POST",
          body: JSON.stringify({
            participantId: selected?.id,
            fullNameEn: selected?.fullNameEn ?? fullNameEn,
            fullNameKm: selected?.fullNameKm ?? fullNameKm,
            gender: selected?.gender ?? gender,
            title: titleName || undefined,
            position: selected?.position ?? positionName,
            organization: selected?.organization ?? organization,
            phoneNumber: selected?.phoneNumber ?? phoneNumber,
            email:
              deliveryMethod === "email" && email.trim()
                ? email
                : undefined,
            deliveryMethod,
            ...(position
              ? {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }
              : {}),
          }),
        },
      );
      if (response.qrImage) {
        setParticipantQr({
          fullNameEn: response.fullNameEn,
          qrImage: response.qrImage,
          cardImage: response.cardImage,
          delivery: response.delivery,
        });
        setStatus(t("registrationComplete"));
        if (response.delivery?.telegramUrl) {
          window.location.href = response.delivery.telegramUrl;
        }
      } else {
        setStatus(t("confirmedStatus"));
      }
    } catch (error) {
      if (isAlreadyJoinedError(error)) {
        setAlreadyJoinedOpen(true);
        setStatus(t("alreadyJoinedStatus"));
      } else {
        setStatus(error instanceof Error ? error.message : t("couldNotCheckIn"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="scan-theme min-h-screen border-t-4 border-primary bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-2xl space-y-5">
        <ScanControls locale={params.locale} />
        <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <QrCode size={22} />
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">
                  {meeting.name}
                </h1>
                {meeting.description ? (
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-muted-fg">
                    {meeting.description}
                  </p>
                ) : null}
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <UserRoundPlus size={16} />
              {t("meeting")}
            </span>
          </div>
          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              <HeaderInfo icon={<CalendarDays size={16} />} label="Date" value={formatDate(meeting.startsAt)} />
              {shiftText ? <HeaderInfo icon={<Clock3 size={16} />} label="Shift" value={shiftText} /> : null}
              {location ? <HeaderInfo icon={<MapPin size={16} />} label="Place" value={location} /> : null}
            </div>
            {meeting.requireLocation ? (
              <p className="flex gap-2 rounded-md border border-border bg-secondary/50 p-3 text-sm text-muted-fg">
                <MapPin size={16} className="mt-0.5 text-primary" />
                {t("locationRequired", {
                  radius: meeting.radiusMeters ?? 100,
                  venue: meeting.locationName || t("theVenue"),
                })}
              </p>
            ) : null}
          </div>
        </section>

        <Card className="space-y-4 border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5">
          {participantQr ? (
            <RegistrationSuccess
              contextName={meeting.name}
              fullName={participantQr.fullNameEn}
              qrImage={participantQr.qrImage}
              cardImage={participantQr.cardImage}
              delivery={participantQr.delivery}
            />
          ) : isRegisteredListMode(meeting.mode) ? (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedId("");
                  }}
                  placeholder={t("searchPlaceholder")}
                />
                <Button type="button" aria-label={t("searchButton")}>
                  <Search size={18} />
                  <span className="sm:hidden">{t("searchButton")}</span>
                </Button>
              </div>
              <div className="grid gap-2">
                {!hasSearchTerm ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                    {t("typeToSearch")}
                  </p>
                ) : null}
                {hasSearchTerm && !selected
                  ? availableParticipants.slice(0, 8).map((participant) => (
                      <button
                        key={participant.id}
                        type="button"
                        className={`flex items-center gap-3 rounded-md border p-3 text-left transition hover:bg-muted ${
                          selectedId === participant.id
                            ? "border-primary bg-secondary"
                            : "border-border"
                        }`}
                        onClick={() => setSelectedId(participant.id)}
                      >
                        <span className="grid size-5 shrink-0 place-items-center rounded border border-border bg-background">
                          {selectedId === participant.id ? (
                            <Check size={14} className="text-primary" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <strong className="block truncate">
                            {participant.fullNameEn}
                          </strong>
                          <span className="block truncate text-sm text-muted-fg">
                            {[
                              participant.fullNameKm,
                              participant.position,
                              participant.organization,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                    ))
                  : null}
                {hasSearchTerm && !selected && !availableParticipants.length ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                    {t("noMatch")}
                  </p>
                ) : null}
              </div>
              {selected ? (
                <div className="rounded-md border border-border bg-secondary/70 p-4">
                  <p className="font-semibold">{selected.fullNameEn}</p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Detail label={t("khmerName")} value={selected.fullNameKm} />
                    <Detail label={t("position")} value={selected.position} />
                    <Detail label="Organization" value={selected.organization} />
                    <Detail label="Phone" value={selected.phoneNumber} />
                    <Detail
                      label={t("status")}
                      value={participantStatusLabel(selected.status, t)}
                    />
                  </dl>
                </div>
              ) : null}
            </>
          ) : (
            <MeetingRegistrationWizard
              step={registrationStep}
              setStep={setRegistrationStep}
              values={{
                fullNameEn,
                fullNameKm,
                gender,
                titleName,
                positionName,
                organization,
                phoneNumber,
                email,
                deliveryMethod,
              }}
              setters={{
                setFullNameEn,
                setFullNameKm,
                setGender,
                setTitleName,
                setPositionName,
                setOrganization,
                setPhoneNumber,
                setEmail,
                setDeliveryMethod: (value) => {
                  setDeliveryMethod(value);
                  if (value !== "email") setEmail("");
                },
              }}
              enabled={meeting.personalQrEnabled ?? true}
              methods={meeting.personalQrDeliveryMethods}
              busy={busy}
              onSubmit={join}
              locale={params.locale}
            />
          )}

          {isRegisteredListMode(meeting.mode) ? (
            <Button
              disabled={busy || Boolean(participantQr) || !selected}
              onClick={join}
              className="w-full"
            >
              {status === t("confirmedStatus") ? (
                <CheckCircle2 size={18} />
              ) : (
                <Check size={18} />
              )}
              {t("checkIn")}
            </Button>
          ) : null}
          <p className="text-center text-sm text-muted-fg">{status}</p>
        </Card>
      </div>
      {alreadyJoinedOpen ? (
        <WarningDialog
          title={t("alreadyJoinedTitle")}
          message={t("alreadyJoinedStatus")}
          closeLabel={t("close")}
          okLabel={t("ok")}
          onClose={() => setAlreadyJoinedOpen(false)}
        />
      ) : null}
    </main>
  );
}

function HeaderInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-secondary/45 px-3 py-2">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="min-w-0 truncate">
        <span className="font-semibold text-muted-fg">{label}:</span>{" "}
        <span className="text-card-foreground">{value}</span>
      </span>
    </div>
  );
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function formatShifts(shifts: PublicMeeting["shifts"]) {
  if (!shifts.length) return null;
  return shifts
    .map((shift) => {
      const time = `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`;
      return shift.name ? `${shift.name}: ${time}` : time;
    })
    .join(", ");
}

function formatTime(value: string) {
  if (value.includes("T")) {
    const timePart = value.split("T")[1] ?? "";
    return timePart.slice(0, 5);
  }
  return value.slice(0, 5);
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

function isRegisteredListMode(mode: PublicMeeting["mode"]) {
  return mode === "BULK_REGISTRATION";
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
      aria-labelledby="meeting-warning-title"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
              <CircleAlert size={22} />
            </span>
            <div>
              <h2 id="meeting-warning-title" className="text-lg font-semibold">
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

function isAlreadyJoinedError(error: unknown) {
  if (!(error instanceof ApiRequestError)) return false;
  return (
    error.code === "ALREADY_JOINED" ||
    (error.statusCode === 409 && /already|duplicate|registered|joined/i.test(error.message))
  );
}

type MeetingRegistrationValues = {
  fullNameEn: string;
  fullNameKm: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  titleName: string;
  positionName: string;
  organization: string;
  phoneNumber: string;
  email: string;
  deliveryMethod: "download" | "email" | "telegram";
};

type MeetingRegistrationSetters = {
  setFullNameEn: (value: string) => void;
  setFullNameKm: (value: string) => void;
  setGender: (value: "MALE" | "FEMALE" | "OTHER") => void;
  setTitleName: (value: string) => void;
  setPositionName: (value: string) => void;
  setOrganization: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  setDeliveryMethod: (value: "download" | "email" | "telegram") => void;
};

function MeetingRegistrationWizard({
  step,
  setStep,
  values,
  setters,
  enabled,
  methods,
  busy,
  onSubmit,
  locale,
}: {
  step: number;
  setStep: (step: number) => void;
  values: MeetingRegistrationValues;
  setters: MeetingRegistrationSetters;
  enabled: boolean;
  methods?: string;
  busy: boolean;
  onSubmit: () => void;
  locale: string;
}) {
  const canContinue =
    step === 1
      ? Boolean(values.fullNameEn.trim() && values.fullNameKm.trim() && values.positionName.trim())
      : step === 2
        ? Boolean(values.organization.trim() && values.phoneNumber.trim())
        : step === 3 && values.deliveryMethod === "email"
          ? Boolean(values.email.trim())
          : true;

  return (
    <div className="space-y-5">
      <StepProgress step={step} />
      {step === 1 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<UserRoundPlus size={17} />} title="Personal information" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name (Khmer)">
              <IconInput
                icon={<Languages size={16} />}
                placeholder="ឈ្មោះពេញ"
                value={values.fullNameKm}
                onChange={(event) => setters.setFullNameKm(event.target.value)}
              />
            </Field>
            <Field label="Full name (English)">
              <IconInput
                icon={<Badge size={16} />}
                placeholder="Last name, First name"
                value={values.fullNameEn}
                onChange={(event) => setters.setFullNameEn(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Gender">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={values.gender}
              onChange={(event) =>
                setters.setGender(event.target.value as "MALE" | "FEMALE" | "OTHER")
              }
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <TitleSelect
                value={values.titleName}
                onChange={setters.setTitleName}
                locale={locale}
              />
            </Field>
            <Field label="Position">
              <IconInput
                icon={<BriefcaseBusiness size={16} />}
                placeholder="e.g. Director"
                value={values.positionName}
                onChange={(event) => setters.setPositionName(event.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<MapPin size={17} />} title="Contact & organization" />
          <Field label="Phone number">
            <IconInput
              icon={<Phone size={16} />}
              placeholder="+855 -- --- ---"
              value={values.phoneNumber}
              onChange={(event) => setters.setPhoneNumber(event.target.value)}
            />
          </Field>
          <Field label="Organization / Institution">
            <IconInput
              icon={<Building2 size={16} />}
              placeholder="Full name of organization"
              value={values.organization}
              onChange={(event) => setters.setOrganization(event.target.value)}
            />
          </Field>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<QrCode size={17} />} title="Receive your QR code via" />
          <DeliveryOptions
            enabled={enabled}
            methods={methods}
            selected={values.deliveryMethod}
            email={values.email}
            onMethodChange={setters.setDeliveryMethod}
            onEmailChange={setters.setEmail}
          />
        </div>
      ) : null}
      {step === 4 ? (
        <div className="grid gap-4">
          <SectionTitle icon={<CheckCircle2 size={17} />} title="Review your details" />
          <dl className="rounded-md border border-border bg-secondary/30 p-4 text-sm">
            <ReviewRow label="Khmer name" value={values.fullNameKm} />
            <ReviewRow label="English name" value={values.fullNameEn} />
            <ReviewRow label="Position" value={values.positionName} />
            <ReviewRow label="Title" value={values.titleName} />
            <ReviewRow label="Phone" value={values.phoneNumber} />
            <ReviewRow label="Organization" value={values.organization} />
            <ReviewRow label="QR via" value={values.deliveryMethod} />
          </dl>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={step === 1 || busy}
          onClick={() => setStep(Math.max(step - 1, 1))}
        >
          Back
        </Button>
        <span className="text-sm font-medium text-muted-fg">Step {step} of 4</span>
        {step < 4 ? (
          <Button type="button" disabled={!canContinue} onClick={() => setStep(Math.min(step + 1, 4))}>
            Continue
          </Button>
        ) : (
          <Button type="button" disabled={busy} onClick={onSubmit}>
            <Send size={16} />
            {busy ? "Submitting..." : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepProgress({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className={`flex h-10 items-center justify-center rounded-full border text-sm font-semibold ${
            item < step
              ? "border-green-700 bg-green-700 text-white"
              : item === step
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-fg"
          }`}
        >
          {item < step ? <Check size={16} /> : item}
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 text-sm font-semibold">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid content-start gap-2 text-sm font-medium text-card-foreground">
      {label}
      {children}
    </label>
  );
}

function IconInput({
  icon,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof Input> & {
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-fg">
        {icon}
      </span>
      <Input
        className={`h-10 bg-card pl-10 font-medium text-card-foreground placeholder:text-muted-fg ${className}`}
        {...props}
      />
    </div>
  );
}

function TitleSelect({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-fg">
        <IdCard size={16} />
      </span>
      <Select
        value={value || TITLE_PLACEHOLDER}
        onValueChange={(nextValue) =>
          onChange(nextValue === TITLE_PLACEHOLDER ? "" : nextValue)
        }
      >
        <SelectTrigger className="h-10 min-h-10 w-full border-border bg-card py-0 pl-10 font-medium leading-none text-card-foreground shadow-sm [&>span]:flex [&>span]:items-center">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TITLE_PLACEHOLDER}>
            {locale === "km" ? "ជ្រើសរើសងារ" : "Select title"}
          </SelectItem>
        {TITLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {locale === "km" ? option.km : option.en}
          </SelectItem>
        ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1 last:border-b-0">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="text-right font-semibold">{value?.trim() || "-"}</dd>
    </div>
  );
}

function RegistrationSuccess({
  contextName,
  fullName,
  qrImage,
  cardImage,
  delivery,
}: {
  contextName: string;
  fullName: string;
  qrImage: string;
  cardImage?: string;
  delivery?: { method: string; emailSent?: boolean; telegramUrl?: string | null } | null;
}) {
  return (
    <div className="grid justify-items-center gap-4 text-center">
      <div className="w-full rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-900 dark:border-green-500/50 dark:bg-green-500/15 dark:text-green-100">
        {delivery?.method === "email" && delivery.emailSent
          ? "QR sent to your email"
          : delivery?.method === "telegram"
            ? "Open Telegram to receive your QR"
            : "Registration complete"}
      </div>
      <img
        src={qrImage}
        alt="Personal check-in QR"
        className="size-44 rounded-md border border-border bg-white p-3"
      />
      <div>
        <p className="text-xl font-semibold">{fullName}</p>
        <p className="text-sm text-muted-fg">{contextName}</p>
      </div>
      {cardImage ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadDataUrl(cardImage, "participant-card.png")}
          >
            <Download size={16} />
            Download QR
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
            Share
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
  onMethodChange,
  onEmailChange,
}: {
  enabled: boolean;
  methods?: string;
  selected: "download" | "email" | "telegram";
  email: string;
  onMethodChange: (value: "download" | "email" | "telegram") => void;
  onEmailChange: (value: string) => void;
}) {
  if (!enabled) return null;
  const allowed = new Set((methods || "download,email,telegram").split(","));
  const options = [
    { value: "download" as const, label: "Download", icon: Download },
    { value: "email" as const, label: "Email", icon: Mail },
    { value: "telegram" as const, label: "Telegram", icon: MessageCircle },
  ].filter((option) => allowed.has(option.value));

  return (
    <div className="grid gap-2 rounded-md border border-border bg-secondary/40 p-3">
      <p className="text-sm font-medium">Receive personal QR card</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex min-h-10 items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium ${
                selected === option.value
                  ? "border-primary bg-background text-primary"
                  : "border-border bg-background text-muted-fg"
              }`}
              onClick={() => onMethodChange(option.value)}
            >
              <Icon size={14} />
              {option.label}
            </button>
          );
        })}
      </div>
      {selected === "email" ? (
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-muted-fg">{label}</dt>
      <dd className="mt-1 font-medium">{value || "-"}</dd>
    </div>
  );
}

function participantStatusLabel(
  status: PublicMeeting["participants"][number]["status"],
  t: ReturnType<typeof useTranslations<"meetingScan">>,
) {
  if (status === "JOINED") return t("joined");
  if (status === "CANCELLED") return t("cancelled");
  return t("invited");
}
