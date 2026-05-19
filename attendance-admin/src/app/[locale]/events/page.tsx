"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarPlus,
  Download,
  Edit3,
  FileSpreadsheet,
  QrCode,
  Trash2,
  Upload,
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
  copyRegistrations,
  deleteEvent,
  eventKeys,
  getCurrentUser,
  getEventQr,
  hasPermission,
  type EventForm,
  type EventRecord,
  listEvents,
  updateEvent,
  uploadRegistrations,
} from "@/lib/admin-data";

const initialForm: EventForm = {
  name: "",
  description: "",
  mode: "PRE_REGISTERED",
  startsAt: "2026-06-01T08:30",
  endsAt: "2026-06-01T17:30",
  shifts: [],
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
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EventRecord | null>(null);
  const [form, setForm] = useState<EventForm>(initialForm);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [sourceEventId, setSourceEventId] = useState("");
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
    mutationFn: async () => {
      const savedEvent = editing
        ? await updateEvent(editing.id, normalizeForm(form))
        : await createEvent(normalizeForm(form));

      if (form.mode === "PRE_REGISTERED") {
        if (sourceEventId) {
          await copyRegistrations(savedEvent.id, sourceEventId);
        }
        if (registrationFile) {
          await uploadRegistrations(savedEvent.id, registrationFile);
        }
      }

      return savedEvent;
    },
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
    setRegistrationFile(null);
    setSourceEventId("");
  }

  function startEdit(event: EventRecord) {
    setEditing(event);
    setForm({
      name: event.name,
      description: event.description ?? "",
      mode: event.mode,
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: toDatetimeLocal(event.endsAt),
      shifts: event.shifts?.map((shift) => ({
        name: shift.name,
        startsAt: toDatetimeLocal(shift.startsAt),
        endsAt: toDatetimeLocal(shift.endsAt),
      })) ?? [],
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
    setRegistrationFile(null);
    setSourceEventId("");
  }

  function updateShift(
    index: number,
    patch: Partial<NonNullable<EventForm["shifts"]>[number]>,
  ) {
    setForm({
      ...form,
      shifts: form.shifts?.map((shift, shiftIndex) =>
        shiftIndex === index ? { ...shift, ...patch } : shift,
      ),
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
            <Table className="min-w-180">
              <TableHeader>
                <TableRow className="border-t-0">
                  <TableHead>Name</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Total users</TableHead>
                  <TableHead>Checked in</TableHead>
                  <TableHead>Join rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer transition-colors hover:bg-muted"
                    onClick={() => router.push(`/${locale}/events/${event.id}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="hover:text-primary">{event.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event.mode.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event.summary?.totalUsers ?? event._count?.registrations ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event.summary?.checkedIn ?? event._count?.attendances ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {event.summary?.joinRate ?? 0}%
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
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setQrEvent(event);
                          }}
                        >
                          <QrCode size={14} />
                        </Button>
                        {canUpdate ? (
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              startEdit(event);
                            }}
                          >
                            <Edit3 size={14} />
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              deleteMutation.mutate(event.id);
                            }}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateTimeField
                  label="Starts"
                  value={form.startsAt}
                  onChange={(value) => setForm({ ...form, startsAt: value })}
                />
                <DateTimeField
                  label="Ends"
                  value={form.endsAt}
                  onChange={(value) => setForm({ ...form, endsAt: value })}
                />
              </div>
              <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Event shifts</h3>
                    <p className="mt-1 text-xs text-muted-fg">
                      Optional. Leave empty for a single all-day event.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      setForm({
                        ...form,
                        shifts: [
                          ...(form.shifts ?? []),
                          {
                            name: `Shift ${(form.shifts?.length ?? 0) + 1}`,
                            startsAt: form.startsAt,
                            endsAt: form.endsAt,
                          },
                        ],
                      })
                    }
                  >
                    Add shift
                  </Button>
                </div>
                {form.shifts?.length ? (
                  <div className="grid gap-3">
                    {form.shifts.map((shift, index) => (
                      <div
                        className="grid gap-3 rounded-md border border-border bg-card p-3"
                        key={index}
                      >
                        <div className="flex items-end gap-2">
                          <Field
                            label="Shift name"
                            value={shift.name}
                            onChange={(value) =>
                              updateShift(index, { name: value })
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="mb-0 h-10"
                            onClick={() =>
                              setForm({
                                ...form,
                                shifts: form.shifts?.filter(
                                  (_, shiftIndex) => shiftIndex !== index,
                                ),
                              })
                            }
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DateTimeField
                            label="Shift starts"
                            value={shift.startsAt}
                            onChange={(value) =>
                              updateShift(index, { startsAt: value })
                            }
                          />
                          <DateTimeField
                            label="Shift ends"
                            value={shift.endsAt}
                            onChange={(value) =>
                              updateShift(index, { endsAt: value })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                    No shifts configured.
                  </p>
                )}
              </div>
              {form.mode === "PRE_REGISTERED" ? (
                <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold">
                        Pre-registration users
                      </h3>
                      <p className="mt-1 text-xs text-muted-fg">
                        Copy an existing import or upload an Excel file after saving.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Pre-registration imports</Label>
                    <Select
                      value={sourceEventId}
                      onChange={(event) => setSourceEventId(event.target.value)}
                    >
                      <option value="">Do not copy existing import</option>
                      {events
                        .filter((event) => event.id !== editing?.id)
                        .filter(
                          (event) =>
                            event.mode === "PRE_REGISTERED" &&
                            (event.summary?.registrations ?? 0) > 0,
                        )
                        .map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name} ({event.summary?.registrations ?? 0} users)
                          </option>
                        ))}
                    </Select>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Upload Excel
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(event) =>
                        setRegistrationFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <p className="text-xs text-muted-fg">
                    Columns: Fullname English, Fullname Khmer, Gender, Position,
                    Department, Shift.
                  </p>
                </div>
              ) : null}
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
                <CalendarPlus size={16} />
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

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [date, time] = value.split("T");

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-[1.15fr_0.85fr] overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring">
        <Input
          className="h-11 rounded-none border-0 bg-transparent"
          type="date"
          value={date}
          onChange={(event) => onChange(`${event.target.value}T${time ?? "00:00"}`)}
          required
        />
        <Input
          className="h-11 rounded-none border-0 border-l border-input bg-transparent"
          type="time"
          value={time ?? "00:00"}
          onChange={(event) => onChange(`${date}T${event.target.value}`)}
          required
        />
      </div>
    </div>
  );
}

function normalizeForm(form: EventForm): EventForm {
  return {
    ...form,
    shifts: form.shifts?.map((shift) => ({
      ...shift,
      startsAt: new Date(shift.startsAt).toISOString(),
      endsAt: new Date(shift.endsAt).toISOString(),
    })),
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
