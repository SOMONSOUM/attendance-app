"use client";

import { Check, CheckCircle2, MapPin, QrCode, Search, UserRoundPlus } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [fullNameKm, setFullNameKm] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready to check in");
  const [participantQr, setParticipantQr] = useState<{
    fullNameEn: string;
    qrImage: string;
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
        if (!needle) return true;
        return [participant.fullNameEn, participant.fullNameKm, participant.position]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      }),
    [meeting.participants, meeting.scanPlace?.id, query],
  );

  async function join() {
    setBusy(true);
    setStatus(
      meeting.mode === "BULK_REGISTRATION" && meeting.requireLocation
        ? "Requesting your current location..."
        : meeting.mode === "BULK_REGISTRATION"
          ? "Checking in..."
          : "Registering participant...",
    );

    try {
      const position =
        meeting.mode === "BULK_REGISTRATION" && meeting.requireLocation
          ? await getCurrentLocation()
          : null;
      const response = await api<{ fullNameEn: string; qrImage?: string }>(
        `/meetings/qr/${code}/join`,
        {
        method: "POST",
        body: JSON.stringify({
          participantId: selected?.id,
          fullNameEn: selected?.fullNameEn ?? fullNameEn,
          fullNameKm: selected?.fullNameKm ?? fullNameKm,
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
        });
        setStatus("Registration complete. Show this QR to admin at arrival.");
      } else {
        setStatus("Check-in confirmed");
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "ALREADY_JOINED") {
        setStatus("This participant already joined.");
      } else {
        setStatus(error instanceof Error ? error.message : "Could not check in");
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
              Meeting
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
              Check-in requires your current location within {meeting.radiusMeters ?? 100}m of{" "}
              {meeting.locationName || "the venue"}.
            </p>
          ) : null}
        </section>

        <Card className="space-y-4 p-4 sm:p-5">
          {participantQr ? (
            <div className="grid gap-3 text-center">
              <p className="text-sm font-medium text-muted-fg">
                Personal check-in QR for
              </p>
              <p className="text-lg font-semibold">
                {participantQr.fullNameEn}
              </p>
              <img
                src={participantQr.qrImage}
                alt="Personal check-in QR"
                className="mx-auto size-56 rounded-md border border-border bg-white p-3"
              />
            </div>
          ) : isRegisteredListMode(meeting.mode) ? (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your name"
                />
                <Button type="button" aria-label="Search">
                  <Search size={18} />
                </Button>
              </div>
              <div className="grid gap-2">
                {availableParticipants.slice(0, 8).map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    className={`rounded-md border p-3 text-left ${
                      selectedId === participant.id
                        ? "border-primary bg-secondary"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedId(participant.id)}
                  >
                    <strong className="block">{participant.fullNameEn}</strong>
                    <span className="text-sm text-muted-fg">
                      {[participant.fullNameKm, participant.position, participant.department]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRoundPlus size={16} className="text-primary" />
                Registration details
              </div>
              <Input
                placeholder="Full name English"
                value={fullNameEn}
                onChange={(event) => setFullNameEn(event.target.value)}
              />
              <Input
                placeholder="Full name Khmer"
                value={fullNameKm}
                onChange={(event) => setFullNameKm(event.target.value)}
              />
            </div>
          )}

          <Button
            disabled={
              busy ||
              Boolean(participantQr) ||
              (isRegisteredListMode(meeting.mode)
                ? !selected
                : !fullNameEn.trim())
            }
            onClick={join}
            className="w-full"
          >
            {status === "Check-in confirmed" ? <CheckCircle2 size={18} /> : <Check size={18} />}
            Check in
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

function isRegisteredListMode(mode: PublicMeeting["mode"]) {
  return mode === "BULK_REGISTRATION";
}
