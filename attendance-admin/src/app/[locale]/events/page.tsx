"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarPlus,
  Edit3,
  FileSpreadsheet,
  Plus,
  QrCode,
  Trash2,
  Upload,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { LocationPicker } from "@/components/admin/location-picker";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
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
  copyRegistrationImport,
  deleteEvent,
  eventKeys,
  getCurrentUser,
  hasPermission,
  type EventForm,
  type EventRecord,
  listRegistrationImports,
  listEvents,
  updateEvent,
  uploadRegistrationImport,
} from "@/lib/admin-data";
import { useAdminUiStore } from "@/lib/ui-store";
import { eventSchema } from "@/lib/validation";

const initialForm: EventForm = {
  name: "",
  description: "",
  mode: "BULK_REGISTRATION",
  separateQrByPlace: false,
  requireLocation: false,
  locationName: "",
  latitude: 11.5564,
  longitude: 104.9282,
  radiusMeters: 100,
  places: [],
  startsAt: "2026-06-01",
  endsAt: "2026-06-01",
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

const emptyPlace: NonNullable<EventForm["places"]>[number] = {
  name: "",
  description: "",
  requireLocation: false,
  locationName: "",
  latitude: 11.5564,
  longitude: 104.9282,
  radiusMeters: 100,
};

const wizardSteps = [
  { label: "Basics", description: "Name and description" },
  { label: "QR setup", description: "QR mode and attendees" },
  { label: "Details", description: "Date, shifts, theme" },
];
const PAGE_SIZE = 10;

export default function EventsPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const queryClient = useQueryClient();
  const editing = useAdminUiStore((state) => state.editingEvent);
  const setEditing = useAdminUiStore((state) => state.setEditingEvent);
  const step = useAdminUiStore((state) => state.eventStep);
  const setStep = useAdminUiStore((state) => state.setEventStep);
  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);
  const formMethods = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialForm,
  });
  const {
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = formMethods;
  const form = watch();
  const setForm = (nextForm: EventForm) => reset(nextForm);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [placeRegistrationFiles, setPlaceRegistrationFiles] = useState<
    Record<number, File | null>
  >({});
  const [sourceImportId, setSourceImportId] = useState("");
  const [placeRegistrationImportIds, setPlaceRegistrationImportIds] = useState<
    Record<number, string>
  >({});
  const eventsQuery = useQuery({
    queryKey: [...eventKeys.all, page],
    queryFn: () => listEvents({ page, pageSize: PAGE_SIZE }),
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const importsQuery = useQuery({
    queryKey: ["registration-imports"],
    queryFn: () => listRegistrationImports({ pageSize: 100, target: "EVENT" }),
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

      if (isBulkRegistrationMode(form.mode)) {
        if (!form.separateQrByPlace && sourceImportId) {
          await copyRegistrationImport(savedEvent.id, sourceImportId);
        }
        if (!form.separateQrByPlace && registrationFile) {
          const uploaded = await uploadRegistrationImport(registrationFile);
          await copyRegistrationImport(savedEvent.id, uploaded.id);
        }
        if (form.separateQrByPlace) {
          for (const [index, place] of (savedEvent.places ?? []).entries()) {
            if (!place.id) continue;
            const file = placeRegistrationFiles[index];
            const importId = placeRegistrationImportIds[index];

            if (importId) {
              await copyRegistrationImport(savedEvent.id, importId, place.id);
            } else if (file) {
              const uploaded = await uploadRegistrationImport(file);
              await copyRegistrationImport(
                savedEvent.id,
                uploaded.id,
                place.id,
              );
            }
          }
        }
      }

      return savedEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: ["registration-imports"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      setDeleteTarget(null);
    },
  });

  const events = eventsQuery.data?.items ?? [];
  const registrationImports = importsQuery.data?.items ?? [];
  const activeCount = useMemo(
    () => events.filter((event) => new Date(event.endsAt) >= new Date()).length,
    [events],
  );

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
    setRegistrationFile(null);
    setPlaceRegistrationFiles({});
    setSourceImportId("");
    setPlaceRegistrationImportIds({});
    setStep(0);
  }

  function startEdit(event: EventRecord) {
    setEditing(event);
    setForm({
      name: event.name,
      description: event.description ?? "",
      mode: event.mode,
      separateQrByPlace: Boolean(event.separateQrByPlace),
      requireLocation: Boolean(event.requireLocation),
      locationName: event.locationName ?? "",
      latitude: toNumber(event.latitude, initialForm.latitude),
      longitude: toNumber(event.longitude, initialForm.longitude),
      radiusMeters: event.radiusMeters ?? initialForm.radiusMeters,
      places:
        event.places?.map((place) => ({
          id: place.id,
          name: place.name,
          description: place.description ?? "",
          requireLocation: Boolean(place.requireLocation),
          locationName: place.locationName ?? "",
          latitude: toNumber(place.latitude, initialForm.latitude),
          longitude: toNumber(place.longitude, initialForm.longitude),
          radiusMeters: place.radiusMeters ?? initialForm.radiusMeters,
        })) ?? [],
      startsAt: toDateInput(event.startsAt),
      endsAt: toDateInput(event.endsAt),
      shifts:
        event.shifts?.map((shift) => ({
          name: shift.name,
          startTime: toTimeInput(shift.startTime),
          endTime: toTimeInput(shift.endTime),
        })) ?? [],
      theme: {
        primaryColor:
          event.theme?.primaryColor ?? initialForm.theme.primaryColor,
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
    setPlaceRegistrationFiles({});
    setSourceImportId("");
    setPlaceRegistrationImportIds({});
    setStep(0);
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

  function updatePlace(
    index: number,
    patch: Partial<NonNullable<EventForm["places"]>[number]>,
  ) {
    setForm({
      ...form,
      places: form.places?.map((place, placeIndex) =>
        placeIndex === index ? { ...place, ...patch } : place,
      ),
    });
  }

  function changeMode(mode: EventForm["mode"]) {
    setForm({ ...form, mode });
    if (!isBulkRegistrationMode(mode)) {
      setRegistrationFile(null);
      setPlaceRegistrationFiles({});
      setSourceImportId("");
      setPlaceRegistrationImportIds({});
    }
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
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
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
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-t-0">
                    <TableHead>Name</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>QR mode</TableHead>
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
                      onClick={() =>
                        router.push(`/${locale}/events/${event.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <span className="hover:text-primary">{event.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {registrationModeLabel(event.mode)}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={event.separateQrByPlace ? "purple" : "blue"}
                        >
                          {event.separateQrByPlace ? "By place" : "Single QR"}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {event.summary?.totalUsers ??
                          event._count?.registrations ??
                          0}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {event.summary?.checkedIn ??
                          event._count?.attendances ??
                          0}
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
                                setDeleteTarget(event);
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
              <PaginationFooter
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={eventsQuery.data?.meta.totalItems ?? 0}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No events yet"
              text="Create your first event and it will be stored in the database."
            />
          )}
        </TableShell>

        <Card className="overflow-hidden xl:sticky xl:top-20">
          <CardHeader className="border-b border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {editing ? "Update event" : "Create event"}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-fg">
                  Step {step + 1} of {wizardSteps.length}:{" "}
                  {wizardSteps[step].description}
                </p>
              </div>
              <StatusPill tone={form.separateQrByPlace ? "purple" : "blue"}>
                {form.separateQrByPlace ? "By place" : "Single QR"}
              </StatusPill>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Form {...formMethods}>
              <form
                className="flex max-h-[calc(100dvh-9rem)] flex-col"
                onSubmit={handleSubmit(() => saveMutation.mutate())}
              >
                <div className="border-b border-border p-4">
                  <WizardSteps step={step} onStepChange={setStep} />
                </div>
                <div className="grid gap-4 overflow-y-auto p-4">
                  {step === 0 ? (
                    <>
                      <Field
                        label="Event name"
                        value={form.name}
                        error={errors.name?.message}
                        onChange={(value) => setForm({ ...form, name: value })}
                      />
                      <Field
                        label="Description"
                        value={form.description ?? ""}
                        onChange={(value) =>
                          setForm({ ...form, description: value })
                        }
                      />
                    </>
                  ) : null}
                  {step === 1 ? (
                    <>
                      <div className="grid gap-2">
                        <Label>Registration mode</Label>
                        <Select
                          value={form.mode}
                          onChange={(event) =>
                            changeMode(event.target.value as EventForm["mode"])
                          }
                        >
                          <option value="BULK_REGISTRATION">
                            Bulk registration
                          </option>
                          <option value="OPEN_REGISTRATION">
                            Open registration
                          </option>
                          <option value="PRE_REGISTRATION">
                            Pre-registration
                          </option>
                        </Select>
                      </div>
                      <RegistrationModeGuide mode={form.mode} noun="attendees" />
                      <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                        <div>
                          <h3 className="text-sm font-semibold">
                            QR code setup
                          </h3>
                          <p className="mt-1 text-xs text-muted-fg">
                            Use one QR for the whole event, or create separate
                            QR codes for each place, hall, or room.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Label>QR code mode</Label>
                          <Select
                            value={
                              form.separateQrByPlace ? "separate" : "single"
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                separateQrByPlace:
                                  event.target.value === "separate",
                                places:
                                  event.target.value === "separate" &&
                                  !form.places?.length
                                    ? [
                                        {
                                          ...emptyPlace,
                                          name: "Main hall",
                                          locationName: "Main hall",
                                        },
                                      ]
                                    : form.places,
                              })
                            }
                          >
                            <option value="single">
                              One QR code for the event
                            </option>
                            <option value="separate">
                              Separate QR code by place
                            </option>
                          </Select>
                        </div>
                        {form.separateQrByPlace ? (
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <Label>Places / halls / rooms</Label>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-3"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    places: [
                                      ...(form.places ?? []),
                                      {
                                        ...emptyPlace,
                                        name: `Place ${(form.places?.length ?? 0) + 1}`,
                                      },
                                    ],
                                  })
                                }
                              >
                                <Plus size={14} />
                                Add
                              </Button>
                            </div>
                            {form.places?.map((place, index) => (
                              <div
                                className="grid gap-3 rounded-md border border-border p-3"
                                key={index}
                              >
                                <div className="flex items-center gap-2">
                                  <Field
                                    label="Place name"
                                    value={place.name}
                                    onChange={(value) =>
                                      updatePlace(index, { name: value })
                                    }
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="mt-7 size-9 px-0"
                                    aria-label="Remove place"
                                    onClick={() =>
                                      setForm({
                                        ...form,
                                        places: form.places?.filter(
                                          (_, placeIndex) =>
                                            placeIndex !== index,
                                        ),
                                      })
                                    }
                                  >
                                    <Trash2 size={15} />
                                  </Button>
                                </div>
                                <Field
                                  label="Location name"
                                  value={place.locationName ?? ""}
                                  onChange={(value) =>
                                    updatePlace(index, { locationName: value })
                                  }
                                />
                                <Field
                                  label="Place description"
                                  value={place.description ?? ""}
                                  required={false}
                                  onChange={(value) =>
                                    updatePlace(index, { description: value })
                                  }
                                />
                                {form.mode !== "PRE_REGISTRATION" ? (
                                  <LocationPicker
                                    value={{
                                      requireLocation: place.requireLocation,
                                      locationName: place.locationName ?? "",
                                      latitude: toNumber(
                                        place.latitude,
                                        form.latitude,
                                      ),
                                      longitude: toNumber(
                                        place.longitude,
                                        form.longitude,
                                      ),
                                      radiusMeters:
                                        place.radiusMeters ??
                                        form.radiusMeters,
                                    }}
                                    onChange={(value) =>
                                      updatePlace(index, {
                                        requireLocation: value.requireLocation,
                                        locationName: value.locationName,
                                        latitude: value.latitude,
                                        longitude: value.longitude,
                                        radiusMeters: value.radiusMeters,
                                      })
                                    }
                                    title={`${place.name || `Place ${index + 1}`} location check-in`}
                                  />
                                ) : null}
                                {isBulkRegistrationMode(form.mode) ? (
                                  <div className="grid gap-3">
                                    <div className="grid gap-2">
                                      <Label>Saved attendee import</Label>
                                      <Select
                                        value={
                                          placeRegistrationImportIds[index] ??
                                          ""
                                        }
                                        onChange={(event) => {
                                          const importId = event.target.value;
                                          setPlaceRegistrationImportIds({
                                            ...placeRegistrationImportIds,
                                            [index]: importId,
                                          });
                                          if (importId) {
                                            setPlaceRegistrationFiles({
                                              ...placeRegistrationFiles,
                                              [index]: null,
                                            });
                                          }
                                        }}
                                      >
                                        <option value="">
                                          Do not use saved import
                                        </option>
                                        {registrationImports.map((item) => (
                                          <option key={item.id} value={item.id}>
                                            {item.originalName} ({item.rowCount}{" "}
                                            users)
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                    <label className="grid gap-2 text-sm font-medium">
                                      Upload Excel for this place
                                      <Input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        disabled={Boolean(
                                          placeRegistrationImportIds[index],
                                        )}
                                        onChange={(event) =>
                                          setPlaceRegistrationFiles({
                                            ...placeRegistrationFiles,
                                            [index]:
                                              event.target.files?.[0] ?? null,
                                          })
                                        }
                                      />
                                    </label>
                                    {placeRegistrationImportIds[index] ? (
                                      <p className="text-xs text-muted-fg">
                                        Using saved import:{" "}
                                        {registrationImports.find(
                                          (item) =>
                                            item.id ===
                                            placeRegistrationImportIds[index],
                                        )?.originalName ?? "Selected import"}
                                      </p>
                                    ) : placeRegistrationFiles[index] ? (
                                      <p className="text-xs text-muted-fg">
                                        Selected file:{" "}
                                        {placeRegistrationFiles[index]?.name}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {!form.separateQrByPlace &&
                      form.mode !== "PRE_REGISTRATION" ? (
                        <LocationPicker
                          value={{
                            requireLocation: form.requireLocation,
                            locationName: form.locationName,
                            latitude: form.latitude,
                            longitude: form.longitude,
                            radiusMeters: form.radiusMeters,
                          }}
                          onChange={(value) => setForm({ ...form, ...value })}
                          title="Event location check-in"
                        />
                      ) : null}
                    </>
                  ) : null}
                  {step === 2 ? (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <DateField
                          label="Starts"
                          value={form.startsAt}
                          error={errors.startsAt?.message}
                          onChange={(value) =>
                            setForm({ ...form, startsAt: value })
                          }
                        />
                        <DateField
                          label="Ends"
                          value={form.endsAt}
                          error={errors.endsAt?.message}
                          onChange={(value) =>
                            setForm({ ...form, endsAt: value })
                          }
                        />
                      </div>
                      <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">
                              Event shifts
                            </h3>
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
                                    startTime: "07:00",
                                    endTime: "12:00",
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
                                          (_, shiftIndex) =>
                                            shiftIndex !== index,
                                        ),
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <TimeField
                                    label="Shift starts"
                                    value={shift.startTime}
                                    onChange={(value) =>
                                      updateShift(index, { startTime: value })
                                    }
                                  />
                                  <TimeField
                                    label="Shift ends"
                                    value={shift.endTime}
                                    onChange={(value) =>
                                      updateShift(index, { endTime: value })
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
                      {isBulkRegistrationMode(form.mode) &&
                      !form.separateQrByPlace ? (
                        <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet
                              size={16}
                              className="text-primary"
                            />
                            <div>
                              <h3 className="text-sm font-semibold">
                                Bulk attendee list
                              </h3>
                              <p className="mt-1 text-xs text-muted-fg">
                                Select a saved attendee import or upload an
                                Excel file. These invited attendees can scan the
                                event QR when attendance starts.
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label>Saved attendee import</Label>
                            <Select
                              value={sourceImportId}
                              onChange={(event) => {
                                setSourceImportId(event.target.value);
                                if (event.target.value)
                                  setRegistrationFile(null);
                              }}
                            >
                              <option value="">Do not use saved import</option>
                              {registrationImports.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.originalName} ({item.rowCount} users)
                                </option>
                              ))}
                            </Select>
                          </div>
                          <label className="grid gap-2 text-sm font-medium">
                            Upload Excel
                            <Input
                              type="file"
                              accept=".xlsx,.xls"
                              disabled={Boolean(sourceImportId)}
                              onChange={(event) =>
                                setRegistrationFile(
                                  event.target.files?.[0] ?? null,
                                )
                              }
                            />
                          </label>
                          {sourceImportId ? (
                            <p className="text-xs text-muted-fg">
                              Using saved import:{" "}
                              {registrationImports.find(
                                (item) => item.id === sourceImportId,
                              )?.originalName ?? "Selected import"}
                            </p>
                          ) : registrationFile ? (
                            <p className="text-xs text-muted-fg">
                              Selected file: {registrationFile.name}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-fg">
                            Columns: Fullname English, Fullname Khmer, Gender,
                            Position, Department.
                          </p>
                        </div>
                      ) : null}
                      {form.mode === "PRE_REGISTRATION" ? (
                        <div className="rounded-md border border-dashed border-border bg-background p-3 text-sm text-muted-fg">
                          Attendees register before the event starts. After
                          they submit their information, the system issues a
                          unique QR code for that attendee, and admins scan that
                          QR at arrival to mark attendance.
                        </div>
                      ) : null}
                      <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                        <div>
                          <h3 className="text-sm font-semibold">
                            Scan page theme
                          </h3>
                          <p className="mt-1 text-xs text-muted-fg">
                            Customize the page attendees see after scanning this
                            event QR.
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
                                theme: {
                                  ...form.theme,
                                  backgroundColor: value,
                                },
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
                              theme: {
                                ...form.theme,
                                backgroundImageUrl: value,
                              },
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
                                theme: {
                                  ...form.theme,
                                  fontFamily: event.target.value,
                                },
                              })
                            }
                          >
                            <option value="Inter">Inter</option>
                            <option value="Noto Sans Khmer">
                              Noto Sans Khmer
                            </option>
                            <option value="Koh Santepheap">
                              Koh Santepheap
                            </option>
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
                                theme: {
                                  ...form.theme,
                                  fontSize: Number(value),
                                },
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
                    </>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border bg-card p-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={step === 0 || saveMutation.isPending}
                    onClick={() => setStep(Math.max(step - 1, 0))}
                  >
                    Back
                  </Button>
                  <Button
                    disabled={
                      saveMutation.isPending ||
                      (editing ? !canUpdate : !canCreate)
                    }
                    type="button"
                    onClick={() => {
                      if (step < 2) {
                        setStep(step + 1);
                        return;
                      }
                      void handleSubmit(() => saveMutation.mutate())();
                    }}
                  >
                    <CalendarPlus size={16} />
                    {step < 2
                      ? "Continue"
                      : editing
                        ? "Update event"
                        : "Save and generate QR"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(deleteTarget)}
        title="Delete event"
        description={
          deleteTarget
            ? `This will delete ${deleteTarget.name} and related attendance data.`
            : undefined
        }
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!deleteTarget || deleteMutation.isPending}
            onClick={() =>
              deleteTarget && deleteMutation.mutate(deleteTarget.id)
            }
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Dialog>
    </AdminShell>
  );
}

function WizardSteps({
  step,
  onStepChange,
}: {
  step: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {wizardSteps.map((item, index) => (
        <button
          key={item.label}
          type="button"
          className={`flex min-w-0 items-center gap-2 rounded-md border p-2 text-left transition-colors ${
            step === index
              ? "border-primary bg-secondary text-secondary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
          onClick={() => onStepChange(index)}
        >
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-md text-sm font-semibold ${
              step === index
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-fg"
            }`}
          >
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="block truncate text-xs text-muted-fg">
              {item.description}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [date] = value.split("T");

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        className="h-11"
        type="date"
        value={date}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        className="h-11"
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}

function normalizeForm(form: EventForm): EventForm {
  const requireLocation =
    form.mode !== "PRE_REGISTRATION" && Boolean(form.requireLocation);
  return {
    ...form,
    requireLocation,
    locationName: requireLocation
      ? form.locationName?.trim() || "Event venue"
      : "",
    latitude: requireLocation ? (form.latitude ?? 0) : 0,
    longitude: requireLocation ? (form.longitude ?? 0) : 0,
    radiusMeters: requireLocation
      ? clamp(form.radiusMeters ?? 100, 10, 5000)
      : 0,
    shifts: form.shifts?.map((shift) => ({
      name: shift.name,
      startTime: normalizeTime(shift.startTime),
      endTime: normalizeTime(shift.endTime),
    })),
    places: form.separateQrByPlace
      ? form.places?.map((place) => ({
          id: place.id,
          name: place.name,
          description: place.description?.trim() || null,
          requireLocation:
            form.mode !== "PRE_REGISTRATION" &&
            Boolean(place.requireLocation),
          locationName: place.locationName?.trim() || place.name,
          latitude:
            form.mode !== "PRE_REGISTRATION" && place.requireLocation
              ? (place.latitude ?? 0)
              : null,
          longitude:
            form.mode !== "PRE_REGISTRATION" && place.requireLocation
              ? (place.longitude ?? 0)
              : null,
          radiusMeters:
            form.mode !== "PRE_REGISTRATION" && place.requireLocation
            ? clamp(place.radiusMeters ?? 100, 10, 5000)
            : 0,
        }))
      : [],
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

function isBulkRegistrationMode(mode: EventForm["mode"]) {
  return mode === "BULK_REGISTRATION";
}

function registrationModeLabel(mode: EventForm["mode"]) {
  if (isBulkRegistrationMode(mode)) return "Bulk registration";
  if (mode === "PRE_REGISTRATION") return "Pre-registration";
  return "Open registration";
}

function RegistrationModeGuide({
  mode,
  noun,
}: {
  mode: EventForm["mode"];
  noun: string;
}) {
  const content = isBulkRegistrationMode(mode)
    ? {
        title: "Bulk registration",
        text: `Admin uploads invited ${noun}. When the event starts, each attendee scans the event QR and checks in from the uploaded list.`,
        icon: FileSpreadsheet,
      }
    : mode === "PRE_REGISTRATION"
      ? {
          title: "Pre-registration",
          text: `Attendees register before the event starts. The system creates a unique QR for each attendee for admin check-in at arrival.`,
          icon: QrCode,
        }
      : {
          title: "Open registration",
          text: `Attendees register from the event QR and receive a personal QR. Admin scans that personal QR at arrival to mark attendance.`,
          icon: Upload,
        };
  const Icon = content.icon;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-sm font-semibold">{content.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-fg">{content.text}</p>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toNumber(value: string | number | null | undefined, fallback?: number) {
  const parsed = Number(value ?? fallback ?? 0);
  return Number.isFinite(parsed) ? parsed : (fallback ?? 0);
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function toTimeInput(value: string) {
  if (!value) return "00:00";
  if (value.includes("T")) {
    return new Date(value).toISOString().slice(11, 16);
  }

  return value.slice(0, 5);
}

function normalizeTime(value: string) {
  return value.length === 5 ? value : value.slice(0, 5);
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
