"use client";

import { Check, CheckCircle2, MapPin, QrCode, Search, UserRoundPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiRequestError, api } from "@/lib/api";
import type { PublicMeeting } from "./page";

export function MeetingScanClient({
  code,
  meeting,
}: {
  code: string;
  meeting: PublicMeeting;
}) {
  const t = useTranslations("meetingScan");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [fullNameKm, setFullNameKm] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [positionName, setPositionName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(t("readyStatus"));
  const [participantQr, setParticipantQr] = useState<{
    fullNameEn: string;
    qrImage: string;
    cardImage?: string;
  } | null>(null);
  const selected = meeting.participants.find((item) => item.id === selectedId);
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
      const response = await api<{ fullNameEn: string; qrImage?: string; cardImage?: string }>(
        `/meetings/qr/${code}/join`,
        {
        method: "POST",
        body: JSON.stringify({
          participantId: selected?.id,
          fullNameEn: selected?.fullNameEn ?? fullNameEn,
          fullNameKm: selected?.fullNameKm ?? fullNameKm,
          gender: selected?.gender ?? gender,
          position: selected?.position ?? positionName,
          organization: selected?.organization ?? organization,
          phoneNumber: selected?.phoneNumber ?? phoneNumber,
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
        });
        setStatus(t("registrationComplete"));
      } else {
        setStatus(t("confirmedStatus"));
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "ALREADY_JOINED") {
        setStatus(t("alreadyJoinedStatus"));
      } else {
        setStatus(error instanceof Error ? error.message : t("couldNotCheckIn"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen border-t-4 border-primary bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
              <QrCode size={22} />
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              {t("meeting")}
            </span>
          </div>
          <p className="text-sm font-medium text-muted-fg">
            {new Date(meeting.startsAt).toLocaleString()}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {meeting.name}
          </h1>
          {meeting.scanPlace ? (
            <p className="mt-2 text-sm font-medium text-primary">
              {meeting.scanPlace.name}
            </p>
          ) : null}
          {meeting.description ? (
            <p className="mt-3 text-muted-fg">{meeting.description}</p>
          ) : null}
          {meeting.requireLocation ? (
            <p className="mt-3 flex gap-2 rounded-md border border-border bg-background p-3 text-sm text-muted-fg">
              <MapPin size={16} className="mt-0.5 text-primary" />
              {t("locationRequired", {
                radius: meeting.radiusMeters ?? 100,
                venue: meeting.locationName || t("theVenue"),
              })}
            </p>
          ) : null}
        </section>

        <Card className="space-y-4 p-4 sm:p-5">
          {participantQr ? (
            <div className="grid gap-3 text-center">
              <p className="text-sm font-medium text-muted-fg">
                {t("personalQrFor")}
              </p>
              <p className="text-lg font-semibold">
                {participantQr.fullNameEn}
              </p>
              <img
                src={participantQr.qrImage}
                alt={t("personalQrAlt")}
                className="mx-auto size-56 rounded-md border border-border bg-white p-3"
              />
              {participantQr.cardImage ? (
                <Button
                  type="button"
                  onClick={() =>
                    downloadDataUrl(participantQr.cardImage!, "participant-card.png")
                  }
                >
                  Download attendee card
                </Button>
              ) : null}
            </div>
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
                <div className="rounded-md border border-border bg-secondary p-4">
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
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRoundPlus size={16} className="text-primary" />
                {t("registrationDetails")}
              </div>
              <Input
                placeholder={t("fullNameEn")}
                value={fullNameEn}
                onChange={(event) => setFullNameEn(event.target.value)}
              />
              <Input
                placeholder={t("fullNameKm")}
                value={fullNameKm}
                onChange={(event) => setFullNameKm(event.target.value)}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as "MALE" | "FEMALE" | "OTHER")
                }
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <Input
                placeholder="Position"
                value={positionName}
                onChange={(event) => setPositionName(event.target.value)}
              />
              <Input
                placeholder="Organization"
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
              />
              <Input
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </div>
          )}

          <Button
            disabled={
              busy ||
              Boolean(participantQr) ||
              (isRegisteredListMode(meeting.mode)
                ? !selected
                : !fullNameEn.trim() ||
                  !fullNameKm.trim() ||
                  !positionName.trim() ||
                  !organization.trim() ||
                  !phoneNumber.trim())
            }
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
          <p className="text-center text-sm text-muted-fg">{status}</p>
        </Card>
      </div>
    </main>
  );
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

function isRegisteredListMode(mode: PublicMeeting["mode"]) {
  return mode === "BULK_REGISTRATION";
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
