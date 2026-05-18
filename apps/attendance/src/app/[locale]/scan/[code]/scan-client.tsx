"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import {
  CheckCircle2,
  LocateFixed,
  QrCode,
  Search,
  UserRoundPlus,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [results, setResults] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [form, setForm] = useState({
    fullNameEn: "",
    fullNameKm: "",
    gender: "MALE",
    position: "",
    department: "",
  });
  const [status, setStatus] = useState<string>("Ready to verify location");
  const [busy, setBusy] = useState(false);

  const themeStyle = useMemo(
    () =>
      ({
        "--primary": event.theme?.primaryColor ?? "#5b3fd5",
        "--background": event.theme?.backgroundColor ?? "#fbfafc",
        "--radius": `${event.theme?.radius ?? 8}px`,
        fontFamily: `${event.theme?.fontFamily ?? "Inter"}, "Noto Sans Khmer", system-ui, sans-serif`,
        fontSize: `${event.theme?.fontSize ?? 16}px`,
        backgroundImage: event.theme?.backgroundImageUrl
          ? `linear-gradient(rgba(247,249,252,.86), rgba(247,249,252,.92)), url(${event.theme.backgroundImageUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }) as CSSProperties,
    [event.theme],
  );

  async function search() {
    if (!query.trim()) return;
    const data = await api<Registration[]>(
      `/events/${event.id}/registrations/search?q=${encodeURIComponent(query)}`,
    );
    setResults(data);
  }

  async function join() {
    setBusy(true);
    setStatus("Checking your location...");
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
          setStatus("Attendance confirmed. Thank you.");
        } catch (error) {
          setStatus(
            error instanceof Error ? error.message : "Could not join event",
          );
        } finally {
          setBusy(false);
        }
      },
      () => {
        setStatus("Location permission is required to join this event.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <main
      className="min-h-screen border-t-4 border-primary bg-background px-4 py-6"
      style={themeStyle}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="rounded-lg border border-border bg-card-glass p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
              <QrCode size={22} />
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              {event.mode === "PRE_REGISTERED"
                ? "Pre-registered"
                : "Open registration"}
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

        <Card className="space-y-4 p-5">
          {event.mode === "PRE_REGISTERED" ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    void setQuery(e.target.value)
                  }
                  placeholder="Search English or Khmer name"
                />
                <Button onClick={search} aria-label="Search">
                  <Search size={18} />
                </Button>
              </div>
              <div className="grid gap-2">
                {results.map((person) => (
                  <button
                    className="rounded-md border border-border p-3 text-left hover:bg-muted"
                    key={person.id}
                    onClick={() => setSelected(person)}
                  >
                    <strong>{person.fullNameEn}</strong>
                    <span className="block text-sm text-muted-fg">
                      {person.fullNameKm} {person.department}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {!selected ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRoundPlus size={16} className="text-primary" />
                Registration details
              </div>
              <Input
                placeholder="Full name English"
                value={form.fullNameEn}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, fullNameEn: e.target.value })
                }
              />
              <Input
                placeholder="Full name Khmer"
                value={form.fullNameKm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, fullNameKm: e.target.value })
                }
              />
              <Input
                placeholder="Position"
                value={form.position}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, position: e.target.value })
                }
              />
              <Input
                placeholder="Department"
                value={form.department}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </div>
          ) : (
            <div className="rounded-md bg-secondary p-4">
              <p className="font-semibold">{selected.fullNameEn}</p>
              <p className="text-sm text-muted-fg">
                {selected.fullNameKm} {selected.position} {selected.department}
              </p>
            </div>
          )}

          <Button
            disabled={busy || (!selected && !form.fullNameEn)}
            onClick={join}
            className="w-full"
          >
            {status.includes("confirmed") ? (
              <CheckCircle2 size={18} />
            ) : (
              <LocateFixed size={18} />
            )}
            Join event
          </Button>
          <p className="text-center text-sm text-muted-fg">{status}</p>
        </Card>
      </div>
    </main>
  );
}
