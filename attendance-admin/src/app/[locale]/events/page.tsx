"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus,
  Download,
  Edit3,
  MapPin,
  QrCode,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createEvent,
  deleteEvent,
  eventKeys,
  getCurrentUser,
  getEventQr,
  hasPermission,
  type EventForm,
  type EventRecord,
  listEvents,
  updateEvent,
} from "@/lib/admin-data";

const initialForm: EventForm = {
  name: "",
  description: "",
  mode: "PRE_REGISTERED",
  locationName: "",
  latitude: 11.5564,
  longitude: 104.9282,
  radiusMeters: 100,
  startsAt: "2026-06-01T08:30",
  endsAt: "2026-06-01T17:30",
  theme: {
    primaryColor: "#5b3fd5",
    backgroundColor: "#fbfafc",
    backgroundImageUrl: "",
    fontFamily: "Inter",
    fontSize: 16,
    radius: 8,
    appearance: "system",
  },
};

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventForm>(initialForm);
  const [qrEvent, setQrEvent] = useState<EventRecord | null>(null);
  const eventsQuery = useQuery({
    queryKey: eventKeys.all,
    queryFn: listEvents,
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const qrQuery = useQuery({
    queryKey: ["events", qrEvent?.id, "qr"],
    queryFn: () => getEventQr(qrEvent!.id),
    enabled: Boolean(qrEvent),
  });
  const currentUser = currentUserQuery.data;
  const canCreate = hasPermission(currentUser, "events:create");
  const canUpdate = hasPermission(currentUser, "events:update");
  const canDelete = hasPermission(currentUser, "events:delete");

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? updateEvent(editing.id, normalizeForm(form))
        : createEvent(normalizeForm(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  });

  const events = eventsQuery.data ?? [];
  const activeCount = useMemo(
    () => events.filter((event) => new Date(event.endsAt) >= new Date()).length,
    [events],
  );

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
  }

  function startEdit(event: EventRecord) {
    setEditing(event);
    setForm({
      name: event.name,
      description: event.description ?? "",
      mode: event.mode,
      locationName: event.locationName,
      latitude: Number(event.latitude),
      longitude: Number(event.longitude),
      radiusMeters: event.radiusMeters,
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: toDatetimeLocal(event.endsAt),
      theme: {
        primaryColor: event.theme?.primaryColor ?? initialForm.theme.primaryColor,
        backgroundColor:
          event.theme?.backgroundColor ?? initialForm.theme.backgroundColor,
        backgroundImageUrl: event.theme?.backgroundImageUrl ?? "",
        fontFamily: event.theme?.fontFamily ?? initialForm.theme.fontFamily,
        fontSize: event.theme?.fontSize ?? initialForm.theme.fontSize,
        radius: event.theme?.radius ?? initialForm.theme.radius,
        appearance: event.theme?.appearance ?? initialForm.theme.appearance,
      },
    });
  }

  return (
    <AdminShell
      active="Events"
      title="Events"
      description={`${events.length} events in database, ${activeCount} active or upcoming.`}
      action={
        canCreate ? (
          <Button onClick={resetForm}>
            <CalendarPlus size={16} />
            Create event
          </Button>
        ) : null
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <TableShell>
          <SectionToolbar title="Event list">
            <Button variant="outline" className="h-8">
              <QrCode size={14} />
              QR ready
            </Button>
          </SectionToolbar>
          {eventsQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">Loading events...</div>
          ) : events.length ? (
            <Table className="min-w-215">
              <TableHeader>
                <TableRow className="border-t-0">
                  <TableHead>Name</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell className="text-muted-fg">
                      {event.mode.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event.locationName}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event.radiusMeters}m
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event._count?.registrations ?? 0} registrations,{" "}
                      {event._count?.attendances ?? 0} joined
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={eventTone(event)}>
                        {eventStatus(event)}
                      </StatusPill>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-8 px-3"
                          onClick={() => setQrEvent(event)}
                        >
                          <QrCode size={14} />
                        </Button>
                        {canUpdate ? (
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => startEdit(event)}
                          >
                            <Edit3 size={14} />
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => deleteMutation.mutate(event.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No events yet"
              text="Create your first event and it will be stored in the database."
            />
          )}
        </TableShell>

        <Card>
          <CardHeader>
            <CardTitle>
              {editing ? "Update event" : "Quick event setup"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate();
              }}
            >
              <Field
                label="Event name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
              />
              <Field
                label="Description"
                value={form.description ?? ""}
                onChange={(value) => setForm({ ...form, description: value })}
              />
              <div className="grid gap-2">
                <Label>Registration mode</Label>
                <Select
                  value={form.mode}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      mode: event.target.value as EventForm["mode"],
                    })
                  }
                >
                  <option value="PRE_REGISTERED">Pre-registered</option>
                  <option value="OPEN_REGISTRATION">Open registration</option>
                </Select>
              </div>
              <Field
                label="Location name"
                value={form.locationName}
                onChange={(value) => setForm({ ...form, locationName: value })}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Latitude"
                  type="number"
                  value={String(form.latitude)}
                  onChange={(value) =>
                    setForm({ ...form, latitude: Number(value) })
                  }
                />
                <Field
                  label="Longitude"
                  type="number"
                  value={String(form.longitude)}
                  onChange={(value) =>
                    setForm({ ...form, longitude: Number(value) })
                  }
                />
              </div>
              <Field
                label="Location radius"
                type="number"
                value={String(form.radiusMeters)}
                onChange={(value) =>
                  setForm({ ...form, radiusMeters: Number(value) })
                }
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Starts"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(value) => setForm({ ...form, startsAt: value })}
                />
                <Field
                  label="Ends"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(value) => setForm({ ...form, endsAt: value })}
                />
              </div>
              <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                <div>
                  <h3 className="text-sm font-semibold">Scan page theme</h3>
                  <p className="mt-1 text-xs text-muted-fg">
                    Customize the page attendees see after scanning this event QR.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Theme color"
                    type="color"
                    value={form.theme.primaryColor}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        theme: { ...form.theme, primaryColor: value },
                      })
                    }
                  />
                  <Field
                    label="Background color"
                    type="color"
                    value={form.theme.backgroundColor}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        theme: { ...form.theme, backgroundColor: value },
                      })
                    }
                  />
                </div>
                <Field
                  label="Image background"
                  value={form.theme.backgroundImageUrl ?? ""}
                  required={false}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      theme: { ...form.theme, backgroundImageUrl: value },
                    })
                  }
                />
                <div className="grid gap-2">
                  <Label>Font family</Label>
                  <Select
                    value={form.theme.fontFamily}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        theme: { ...form.theme, fontFamily: event.target.value },
                      })
                    }
                  >
                    <option value="Inter">Inter</option>
                    <option value="Noto Sans Khmer">Noto Sans Khmer</option>
                    <option value="Koh Santepheap">Koh Santepheap</option>
                    <option value="system-ui">System UI</option>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Font size"
                    type="number"
                    value={String(form.theme.fontSize)}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        theme: { ...form.theme, fontSize: Number(value) },
                      })
                    }
                  />
                  <Field
                    label="Page radius"
                    type="number"
                    value={String(form.theme.radius)}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        theme: { ...form.theme, radius: Number(value) },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Page mode</Label>
                  <Select
                    value={form.theme.appearance}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        theme: {
                          ...form.theme,
                          appearance: event.target
                            .value as EventForm["theme"]["appearance"],
                        },
                      })
                    }
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Select>
                </div>
              </div>
              <Button
                disabled={
                  saveMutation.isPending || (editing ? !canUpdate : !canCreate)
                }
              >
                <MapPin size={16} />
                {editing ? "Update event" : "Save and generate QR"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(qrEvent)}
        title={qrEvent?.name ?? "QR code"}
        description="Scan QR code"
        onOpenChange={(open) => !open && setQrEvent(null)}
      >
        {qrQuery.data && qrEvent ? (
          <div className="grid gap-4">
            <img
              src={qrQuery.data.qrImage}
              alt={`${qrEvent.name} QR code`}
              className="mx-auto size-64 rounded-md border border-border bg-white p-3"
            />
            <p className="break-all rounded-md bg-muted p-2 text-xs text-muted-fg">
              {qrQuery.data.code}
            </p>
            <Button
              onClick={() =>
                downloadDataUrl(qrQuery.data.qrImage, `${qrEvent.name}-qr.png`)
              }
            >
              <Download size={16} />
              Download QR
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-fg">Loading QR code...</p>
        )}
      </Dialog>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required ?? label !== "Description"}
      />
    </div>
  );
}

function normalizeForm(form: EventForm): EventForm {
  return {
    ...form,
    theme: {
      ...form.theme,
      backgroundImageUrl: form.theme.backgroundImageUrl?.trim() || null,
      fontSize: clamp(form.theme.fontSize, 12, 22),
      radius: clamp(form.theme.radius, 0, 24),
    },
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
  };
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toDatetimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}

function eventStatus(event: EventRecord) {
  const now = Date.now();
  if (new Date(event.startsAt).getTime() > now) return "Ready";
  if (new Date(event.endsAt).getTime() < now) return "Closed";
  return "Live";
}

function eventTone(event: EventRecord) {
  const status = eventStatus(event);
  if (status === "Live") return "green";
  if (status === "Ready") return "purple";
  return "amber";
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^\w.-]+/g, "-").toLowerCase();
  link.click();
}
