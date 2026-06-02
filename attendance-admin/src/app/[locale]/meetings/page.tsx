"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarPlus,
  Edit3,
  FileSpreadsheet,
  Plus,
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
import { LocationPicker } from "@/components/admin/location-picker";
import { TableSkeleton } from "@/components/admin/loading-skeletons";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker, TimePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  createMeeting,
  copyMeetingRegistrationImport,
  deleteMeeting,
  getCurrentUser,
  hasPermission,
  listMeetingRegistrationImports,
  listChairpersons,
  meetingKeys,
  chairpersonKeys,
  listPlaces,
  placeKeys,
  type ChairpersonRecord,
  type MeetingChairperson,
  type EventShift,
  type MeetingForm,
  type MeetingParticipant,
  type MeetingPlace,
  type MeetingRecord,
  type PlaceRecord,
  listMeetings,
  updateMeeting,
  uploadMeetingRegistrationImport,
} from "@/lib/admin-data";
import { meetingSchema } from "@/lib/validation";

const emptyChairperson: MeetingChairperson = {
  honorificTitleEn: "",
  honorificTitleKm: "",
  firstNameEn: "",
  firstNameKm: "",
  lastNameEn: "",
  lastNameKm: "",
  position: "",
  organization: "",
};

const emptyPlace: MeetingPlace = {
  name: "",
  description: "",
  requireLocation: false,
  locationName: "",
  latitude: 11.5564,
  longitude: 104.9282,
  radiusMeters: 100,
};

const initialForm: MeetingForm = {
  name: "",
  description: "",
  mode: "BULK_REGISTRATION",
  separateQrByPlace: false,
  requireLocation: false,
  locationName: "",
  latitude: 11.5564,
  longitude: 104.9282,
  radiusMeters: 100,
  startsAt: "2026-06-01",
  endsAt: "2026-06-01",
  shifts: [],
  chairpersons: [{ ...emptyChairperson }],
  places: [],
  participants: [],
};

const wizardSteps = [
  { label: "Basics", description: "Name and chairperson" },
  { label: "QR setup", description: "QR mode and places" },
  { label: "Details", description: "Upload or select import" },
];
const PAGE_SIZE = 10;

export default function MeetingsPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [form, setForm] = useState<MeetingForm>(initialForm);
  const [participantFile, setParticipantFile] = useState<File | null>(null);
  const [sourceImportId, setSourceImportId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MeetingRecord | null>(null);
  const [page, setPage] = useState(1);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const meetingsQuery = useQuery({
    queryKey: [...meetingKeys.all, page],
    queryFn: () => listMeetings({ page, pageSize: PAGE_SIZE }),
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const importsQuery = useQuery({
    queryKey: ["registration-imports", "meetings"],
    queryFn: () => listMeetingRegistrationImports({ pageSize: 100 }),
  });
  const placesQuery = useQuery({
    queryKey: placeKeys.all,
    queryFn: () => listPlaces({ pageSize: 100 }),
  });
  const chairpersonsQuery = useQuery({
    queryKey: chairpersonKeys.all,
    queryFn: () => listChairpersons({ pageSize: 100 }),
  });
  const currentUser = currentUserQuery.data;
  const canCreate = hasPermission(currentUser, "meetings:create");
  const canUpdate = hasPermission(currentUser, "meetings:update");
  const canDelete = hasPermission(currentUser, "meetings:delete");
  const meetings = meetingsQuery.data?.items ?? [];
  const meetingImports = importsQuery.data?.items ?? [];
  const catalogPlaces = placesQuery.data?.items ?? [];
  const catalogChairpersons = chairpersonsQuery.data?.items ?? [];
  const activeCount = useMemo(
    () =>
      meetings.filter((meeting) => new Date(meeting.endsAt) >= new Date())
        .length,
    [meetings],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const savedMeeting = editing
        ? updateMeeting(editing.id, normalizeForm(form))
        : createMeeting(normalizeForm(form));
      const meeting = await savedMeeting;

      if (isBulkRegistrationMode(form.mode)) {
        if (sourceImportId) {
          await copyMeetingRegistrationImport(meeting.id, sourceImportId);
        } else if (participantFile) {
          const uploaded =
            await uploadMeetingRegistrationImport(participantFile);
          await copyMeetingRegistrationImport(meeting.id, uploaded.id);
        }
      }

      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["registration-imports", "meetings"],
      });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      setDeleteTarget(null);
    },
  });

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
    setParticipantFile(null);
    setSourceImportId("");
    setStepError("");
    setStep(0);
  }

  function startEdit(meeting: MeetingRecord) {
    setEditing(meeting);
    setForm({
      name: meeting.name,
      description: meeting.description ?? "",
      mode: meeting.mode,
      separateQrByPlace: Boolean(meeting.separateQrByPlace),
      requireLocation: Boolean(meeting.requireLocation),
      locationName: meeting.locationName ?? "",
      latitude: toNumber(meeting.latitude, initialForm.latitude),
      longitude: toNumber(meeting.longitude, initialForm.longitude),
      radiusMeters: meeting.radiusMeters ?? initialForm.radiusMeters,
      startsAt: toDateInput(meeting.startsAt),
      endsAt: toDateInput(meeting.endsAt),
      chairpersons: meeting.chairpersons.length
        ? meeting.chairpersons.map(stripChairperson)
        : [{ ...emptyChairperson }],
      places:
        meeting.places?.map((place) => ({
          id: place.id,
          catalogPlaceId: place.catalogPlaceId,
          name: place.name,
          description: place.description ?? "",
          requireLocation: Boolean(place.requireLocation),
          locationName: place.locationName ?? "",
          latitude: toNumber(place.latitude, initialForm.latitude),
          longitude: toNumber(place.longitude, initialForm.longitude),
          radiusMeters: place.radiusMeters ?? initialForm.radiusMeters,
        })) ?? [],
      shifts:
        meeting.shifts?.map((shift) => ({
          name: shift.name,
          startTime: toTimeInput(shift.startTime),
          endTime: toTimeInput(shift.endTime),
        })) ?? [],
      participants: meeting.participants.map(stripParticipant),
    });
    setParticipantFile(null);
    setSourceImportId("");
    setStepError("");
    setStep(0);
  }

  function goToStep(nextStep: number) {
    if (nextStep <= step) {
      setStep(nextStep);
      setStepError("");
      return;
    }
    if (validateCurrentStep()) {
      setStep(Math.min(nextStep, wizardSteps.length - 1));
      setStepError("");
    }
  }

  function validateCurrentStep() {
    const result = meetingSchema.safeParse(form);
    if (result.success) return true;

    const stepPaths = [
      ["name", "description", "startsAt", "endsAt", "locationName"],
      ["mode", "separateQrByPlace", "places", "requireLocation"],
      ["chairpersons", "participants", "shifts"],
    ];
    const issue = result.error.issues.find((item) =>
      stepPaths[step].includes(String(item.path[0])),
    );
    if (!issue) return true;
    setStepError(issue.message);
    return false;
  }

  function updateChairperson(
    index: number,
    patch: Partial<MeetingChairperson>,
  ) {
    setForm({
      ...form,
      chairpersons: form.chairpersons.map((chairperson, chairpersonIndex) =>
        chairpersonIndex === index ? { ...chairperson, ...patch } : chairperson,
      ),
    });
  }

  function updatePlace(index: number, patch: Partial<MeetingPlace>) {
    setForm({
      ...form,
      places: form.places?.map((place, placeIndex) =>
        placeIndex === index ? { ...place, ...patch } : place,
      ),
    });
  }

  function applyCatalogPlace(index: number, placeId: string) {
    if (!placeId) {
      updatePlace(index, { ...emptyPlace, catalogPlaceId: null });
      return;
    }
    const catalogPlace = catalogPlaces.find((place) => place.id === placeId);
    if (!catalogPlace) return;
    updatePlace(index, catalogPlaceToMeetingPlace(catalogPlace));
  }

  function applyCatalogChairperson(index: number, chairpersonId: string) {
    if (!chairpersonId) {
      updateChairperson(index, {
        ...emptyChairperson,
        catalogChairpersonId: null,
      });
      return;
    }
    const catalogChairperson = catalogChairpersons.find(
      (chairperson) => chairperson.id === chairpersonId,
    );
    if (!catalogChairperson) return;
    updateChairperson(
      index,
      catalogChairpersonToMeetingChairperson(catalogChairperson),
    );
  }

  function updateShift(index: number, patch: Partial<EventShift>) {
    setForm({
      ...form,
      shifts: form.shifts?.map((shift, shiftIndex) =>
        shiftIndex === index ? { ...shift, ...patch } : shift,
      ),
    });
  }

  function changeMode(mode: MeetingForm["mode"]) {
    setForm({ ...form, mode });
    if (!isBulkRegistrationMode(mode)) {
      setParticipantFile(null);
      setSourceImportId("");
    }
  }

  return (
    <AdminShell
      active="Meetings"
      title="Meetings"
      description={`${meetings.length} meetings in database, ${activeCount} active or upcoming.`}
      action={
        canCreate ? (
          <Button onClick={resetForm}>
            <CalendarPlus size={16} />
            New meeting
          </Button>
        ) : null
      }
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <TableShell>
          <SectionToolbar title="Meeting list">
            <Button variant="outline" className="h-8">
              <QrCode size={14} />
              QR ready
            </Button>
          </SectionToolbar>
          {meetingsQuery.isLoading ? (
            <TableSkeleton columns={7} />
          ) : meetings.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-t-0">
                    <TableHead>Name</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>QR mode</TableHead>
                    <TableHead>Chairperson</TableHead>
                    <TableHead>Total users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer transition-colors hover:bg-muted"
                      onClick={() =>
                        router.push(`/${locale}/meetings/${meeting.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <span className="hover:text-primary">
                          {meeting.name}
                        </span>
                        <p className="mt-1 text-xs font-normal text-muted-fg">
                          {meeting.locationName}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {registrationModeLabel(meeting.mode)}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={meeting.separateQrByPlace ? "purple" : "blue"}
                        >
                          {meeting.separateQrByPlace ? "By place" : "Single QR"}
                        </StatusPill>
                      </TableCell>
                      <TableCell>
                        {formatChairperson(meeting.chairpersons[0])}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {meeting._count?.participants ??
                          meeting.participants.length}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={meetingTone(meeting)}>
                          {meetingStatus(meeting)}
                        </StatusPill>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            aria-label="Edit meeting"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              startEdit(meeting);
                            }}
                            disabled={!canUpdate}
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            aria-label="Delete meeting"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setDeleteTarget(meeting);
                            }}
                            disabled={!canDelete || deleteMutation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationFooter
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={meetingsQuery.data?.meta.totalItems ?? 0}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No meetings yet"
                text="Create a meeting with at least one chairperson."
              />
            </div>
          )}
        </TableShell>

        <Card className="overflow-hidden xl:sticky xl:top-20">
          <CardHeader className="border-b border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {editing ? "Update meeting" : "Create meeting"}
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
            <form
              className="flex max-h-[calc(100dvh-9rem)] flex-col"
              onSubmit={(event) => {
                event.preventDefault();
                if (step < wizardSteps.length - 1) {
                  goToStep(step + 1);
                  return;
                }
                if (meetingSchema.safeParse(form).success) {
                  saveMutation.mutate();
                } else {
                  validateCurrentStep();
                }
              }}
            >
              <div className="border-b border-border p-4">
                <WizardSteps step={step} onStepChange={goToStep} />
              </div>
              <div className="grid gap-4 overflow-y-auto p-4">
                {step === 0 ? (
                  <>
                    <Field label="Meeting name">
                      <Input
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field label="Description">
                      <Input
                        value={form.description ?? ""}
                        onChange={(event) =>
                          setForm({ ...form, description: event.target.value })
                        }
                      />
                    </Field>
                    <Field label="Location">
                      <Input
                        value={form.locationName ?? ""}
                        onChange={(event) =>
                          setForm({ ...form, locationName: event.target.value })
                        }
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Start date">
                        <DatePicker
                          value={form.startsAt}
                          onChange={(value) =>
                            setForm({ ...form, startsAt: value })
                          }
                        />
                      </Field>
                      <Field label="End date">
                        <DatePicker
                          value={form.endsAt}
                          onChange={(value) =>
                            setForm({ ...form, endsAt: value })
                          }
                        />
                      </Field>
                    </div>
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <Field label="Registration mode">
                      <Select
                        value={form.mode}
                        onChange={(event) =>
                          changeMode(event.target.value as MeetingForm["mode"])
                        }
                      >
                        <option value="BULK_REGISTRATION">
                          Bulk registration
                        </option>
                        <option value="OPEN_REGISTRATION">
                          Open registration by QR
                        </option>
                        <option value="PRE_REGISTRATION">
                          Pre-registration
                        </option>
                      </Select>
                    </Field>
                    <RegistrationModeGuide mode={form.mode} noun="participants" />

                    <Field label="QR mode">
                      <Select
                        value={form.separateQrByPlace ? "separate" : "single"}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            separateQrByPlace:
                              event.target.value === "separate",
                            places:
                              event.target.value === "separate" &&
                              !form.places?.length
                                ? [{ ...emptyPlace }]
                                : form.places,
                          })
                        }
                      >
                        <option value="single">
                          One QR code for the meeting
                        </option>
                        <option value="separate">
                          Separate QR codes by place
                        </option>
                      </Select>
                    </Field>

                    {form.separateQrByPlace ? (
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold">
                            Meeting places
                          </h3>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() =>
                              setForm({
                                ...form,
                                places: [
                                  ...(form.places ?? []),
                                  { ...emptyPlace },
                                ],
                              })
                            }
                          >
                            <Plus size={14} />
                            Add
                          </Button>
                        </div>
                        {(form.places ?? []).map((place, index) => (
                          <div
                            key={index}
                            className="grid gap-3 rounded-md border border-border p-3"
                          >
                            {catalogPlaces.length ? (
                              <div className="grid gap-2">
                                <Label>Choose saved place</Label>
                                <Select
                                  value={place.catalogPlaceId ?? ""}
                                  onChange={(event) =>
                                    applyCatalogPlace(index, event.target.value)
                                  }
                                >
                                  <option value="">Create new place</option>
                                  {catalogPlaces.map((catalogPlace) => (
                                    <option
                                      key={catalogPlace.id}
                                      value={catalogPlace.id}
                                    >
                                      {catalogPlace.name}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                            ) : null}
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Place name"
                                value={place.name}
                                onChange={(event) =>
                                  updatePlace(index, {
                                    name: event.target.value,
                                  })
                                }
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                className="size-9 px-0"
                                aria-label="Remove place"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    places: (form.places ?? []).filter(
                                      (_, placeIndex) => placeIndex !== index,
                                    ),
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                            <Input
                              placeholder="Location name"
                              value={place.locationName ?? ""}
                              onChange={(event) =>
                                updatePlace(index, {
                                  locationName: event.target.value,
                                })
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
                                    place.radiusMeters ?? form.radiusMeters,
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
                          </div>
                        ))}
                      </div>
                    ) : null}

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
                        title="Meeting location check-in"
                      />
                    ) : null}
                  </>
                ) : null}

                {step === 0 ? (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">
                        Meeting chairpersons
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 px-3"
                        onClick={() =>
                          setForm({
                            ...form,
                            chairpersons: [
                              ...form.chairpersons,
                              { ...emptyChairperson },
                            ],
                          })
                        }
                      >
                        <Plus size={14} />
                        Add
                      </Button>
                    </div>
                    {form.chairpersons.map((chairperson, index) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-md border border-border p-3"
                      >
                        {catalogChairpersons.length ? (
                          <div className="grid gap-2">
                            <Label>Choose saved chairperson</Label>
                            <Select
                              value={chairperson.catalogChairpersonId ?? ""}
                              onChange={(event) =>
                                applyCatalogChairperson(
                                  index,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Create new chairperson</option>
                              {catalogChairpersons.map((catalogChairperson) => (
                                <option
                                  key={catalogChairperson.id}
                                  value={catalogChairperson.id}
                                >
                                  {formatChairperson(catalogChairperson)}
                                </option>
                              ))}
                            </Select>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-sm font-medium">
                            Chairperson {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            className="size-9 px-0"
                            aria-label="Remove chairperson"
                            onClick={() =>
                              setForm({
                                ...form,
                                chairpersons:
                                  form.chairpersons.length > 1
                                    ? form.chairpersons.filter(
                                        (_, chairpersonIndex) =>
                                          chairpersonIndex !== index,
                                      )
                                    : form.chairpersons,
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Honorific EN"
                            value={chairperson.honorificTitleEn}
                            onChange={(event) =>
                              updateChairperson(index, {
                                honorificTitleEn: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="Honorific KM"
                            value={chairperson.honorificTitleKm}
                            onChange={(event) =>
                              updateChairperson(index, {
                                honorificTitleKm: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="First name EN"
                            value={chairperson.firstNameEn}
                            onChange={(event) =>
                              updateChairperson(index, {
                                firstNameEn: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="First name KM"
                            value={chairperson.firstNameKm}
                            onChange={(event) =>
                              updateChairperson(index, {
                                firstNameKm: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="Last name EN"
                            value={chairperson.lastNameEn}
                            onChange={(event) =>
                              updateChairperson(index, {
                                lastNameEn: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="Last name KM"
                            value={chairperson.lastNameKm}
                            onChange={(event) =>
                              updateChairperson(index, {
                                lastNameKm: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="Position"
                            value={chairperson.position ?? ""}
                            onChange={(event) =>
                              updateChairperson(index, {
                                position: event.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="Organization"
                            value={chairperson.organization ?? ""}
                            onChange={(event) =>
                              updateChairperson(index, {
                                organization: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-3">
                    <div className="grid gap-3 rounded-md border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">
                            Meeting shifts
                          </h3>
                          <p className="mt-1 text-xs text-muted-fg">
                            Optional. Add time windows when participants should
                            attend.
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
                          <Plus size={14} />
                          Add shift
                        </Button>
                      </div>
                      {form.shifts?.length ? (
                        <div className="grid gap-3">
                          {form.shifts.map((shift, index) => (
                            <div
                              key={index}
                              className="grid gap-3 rounded-md border border-border bg-card p-3"
                            >
                              <div className="flex items-end gap-2">
                                <Field label="Shift name">
                                  <Input
                                    value={shift.name}
                                    onChange={(event) =>
                                      updateShift(index, {
                                        name: event.target.value,
                                      })
                                    }
                                    required
                                  />
                                </Field>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-10"
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
                                <Field label="Shift starts">
                                  <TimePicker
                                    value={shift.startTime}
                                    onChange={(value) =>
                                      updateShift(index, { startTime: value })
                                    }
                                  />
                                </Field>
                                <Field label="Shift ends">
                                  <TimePicker
                                    value={shift.endTime}
                                    onChange={(value) =>
                                      updateShift(index, { endTime: value })
                                    }
                                  />
                                </Field>
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
                    <h3 className="text-sm font-semibold">Participants</h3>
                    {isBulkRegistrationMode(form.mode) ? (
                      <div className="grid gap-2 rounded-md border border-dashed border-border p-3">
                        <Label>Bulk meeting participants</Label>
                        <Select
                          value={sourceImportId}
                          onChange={(event) => {
                            setSourceImportId(event.target.value);
                            if (event.target.value) setParticipantFile(null);
                          }}
                        >
                          <option value="">Choose saved meeting import</option>
                          {meetingImports.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.originalName} ({item.rowCount} rows)
                            </option>
                          ))}
                        </Select>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".xlsx,.xls"
                            disabled={Boolean(sourceImportId)}
                            onChange={(event) =>
                              setParticipantFile(
                                event.target.files?.[0] ?? null,
                              )
                            }
                          />
                          <Button type="button" variant="outline" disabled>
                            <FileSpreadsheet size={15} />
                            On save
                          </Button>
                        </div>
                      </div>
                    ) : form.mode === "PRE_REGISTRATION" ? (
                      <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                        Participants register before the meeting starts. After
                        they submit their information, the system creates a
                        unique QR code for each participant for admin check-in
                        at arrival.
                      </p>
                    ) : (
                      <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                        Participants will register after scanning the meeting QR
                        code.
                      </p>
                    )}
                  </div>
                ) : null}

                {saveMutation.error ? (
                  <p className="text-sm text-destructive">
                    {saveMutation.error.message}
                  </p>
                ) : null}
                {stepError ? (
                  <p className="text-sm text-destructive">{stepError}</p>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-card p-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0 || saveMutation.isPending}
                  onClick={() => setStep((value) => Math.max(value - 1, 0))}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={
                    saveMutation.isPending ||
                    (editing ? !canUpdate : !canCreate)
                  }
                  onClick={() => {
                    if (step < wizardSteps.length - 1) {
                      goToStep(step + 1);
                      return;
                    }
                    if (meetingSchema.safeParse(form).success) {
                      saveMutation.mutate();
                    } else {
                      validateCurrentStep();
                    }
                  }}
                >
                  {step === wizardSteps.length - 1 ? (
                    <CalendarPlus size={16} />
                  ) : null}
                  {saveMutation.isPending
                    ? "Saving..."
                    : step < wizardSteps.length - 1
                      ? "Continue"
                      : editing
                        ? "Update meeting"
                        : "Save and generate QR"}
                </Button>
                {editing ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={Boolean(deleteTarget)}
        title="Delete meeting"
        description={
          deleteTarget
            ? `This will delete ${deleteTarget.name} and related participants.`
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function isBulkRegistrationMode(mode: MeetingForm["mode"]) {
  return mode === "BULK_REGISTRATION";
}

function registrationModeLabel(mode: MeetingForm["mode"]) {
  if (isBulkRegistrationMode(mode)) return "Bulk registration";
  if (mode === "PRE_REGISTRATION") return "Pre-registration";
  return "Open registration";
}

function RegistrationModeGuide({
  mode,
  noun,
}: {
  mode: MeetingForm["mode"];
  noun: string;
}) {
  const content = isBulkRegistrationMode(mode)
    ? {
        title: "Bulk registration",
        text: `Admin uploads invited ${noun}. When the meeting starts, each participant scans the meeting QR and checks in from the uploaded list.`,
        icon: FileSpreadsheet,
      }
    : mode === "PRE_REGISTRATION"
      ? {
          title: "Pre-registration",
          text: `Participants register before the meeting starts. The system creates a unique QR for each participant for admin check-in at arrival.`,
          icon: QrCode,
        }
      : {
          title: "Open registration",
          text: `Participants register from the meeting QR and receive a personal QR. Admin scans that personal QR at arrival to mark attendance.`,
          icon: Plus,
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

function normalizeForm(form: MeetingForm): MeetingForm {
  const requireLocation =
    form.mode !== "PRE_REGISTRATION" && Boolean(form.requireLocation);
  return {
    ...form,
    requireLocation,
    locationName: requireLocation
      ? form.locationName?.trim() || "Meeting venue"
      : form.locationName?.trim() || "Not required",
    latitude: requireLocation ? (form.latitude ?? 0) : 0,
    longitude: requireLocation ? (form.longitude ?? 0) : 0,
    radiusMeters: requireLocation
      ? clamp(form.radiusMeters ?? 100, 10, 5000)
      : 0,
    places: form.separateQrByPlace
      ? (form.places ?? [])
          .filter((place) => place.name.trim())
          .map((place) =>
            cleanObject({
              ...place,
              catalogPlaceId: place.catalogPlaceId,
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
            }),
          )
      : [],
    chairpersons: form.chairpersons.map((chairperson) =>
      cleanObject({
        ...chairperson,
        catalogChairpersonId: chairperson.catalogChairpersonId,
      }),
    ),
    participants: (form.participants ?? [])
      .filter((participant) => participant.fullNameEn.trim())
      .map((participant) => cleanObject(participant)),
    shifts: form.shifts?.map((shift) => ({
      name: shift.name,
      startTime: normalizeTime(shift.startTime),
      endTime: normalizeTime(shift.endTime),
    })),
  };
}

function cleanObject<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== "" && item !== null),
  ) as T;
}

function catalogPlaceToMeetingPlace(place: PlaceRecord): MeetingPlace {
  return {
    catalogPlaceId: place.id,
    name: place.name,
    description: place.description ?? "",
    requireLocation: Boolean(place.requireLocation),
    locationName: place.locationName ?? place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    radiusMeters: place.radiusMeters ?? 100,
  };
}

function catalogChairpersonToMeetingChairperson(
  chairperson: ChairpersonRecord,
): MeetingChairperson {
  return {
    catalogChairpersonId: chairperson.id,
    honorificTitleEn: chairperson.honorificTitleEn,
    honorificTitleKm: chairperson.honorificTitleKm,
    firstNameEn: chairperson.firstNameEn,
    firstNameKm: chairperson.firstNameKm,
    lastNameEn: chairperson.lastNameEn,
    lastNameKm: chairperson.lastNameKm,
    position: chairperson.position ?? "",
    organization: chairperson.organization ?? "",
  };
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toNumber(value: string | number | null | undefined, fallback?: number) {
  const parsed = Number(value ?? fallback ?? 0);
  return Number.isFinite(parsed) ? parsed : (fallback ?? 0);
}

function stripChairperson(chairperson: MeetingChairperson): MeetingChairperson {
  return {
    catalogChairpersonId: chairperson.catalogChairpersonId,
    honorificTitleEn: chairperson.honorificTitleEn,
    honorificTitleKm: chairperson.honorificTitleKm,
    firstNameEn: chairperson.firstNameEn,
    firstNameKm: chairperson.firstNameKm,
    lastNameEn: chairperson.lastNameEn,
    lastNameKm: chairperson.lastNameKm,
    position: chairperson.position ?? "",
    organization: chairperson.organization ?? "",
  };
}

function stripParticipant(participant: MeetingParticipant): MeetingParticipant {
  return {
    fullNameEn: participant.fullNameEn,
    fullNameKm: participant.fullNameKm ?? "",
    gender: participant.gender ?? null,
    position: participant.position ?? "",
    organization: participant.organization ?? "",
    email: participant.email ?? "",
    status: participant.status ?? "INVITED",
  };
}

function formatChairperson(chairperson?: MeetingChairperson) {
  if (!chairperson) return "No chairperson";
  return `${chairperson.honorificTitleEn} ${chairperson.firstNameEn} ${chairperson.lastNameEn}`.trim();
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

function meetingStatus(meeting: { startsAt: string; endsAt: string }) {
  const now = Date.now();
  if (new Date(meeting.startsAt).getTime() > now) return "Ready";
  if (new Date(meeting.endsAt).getTime() < now) return "Closed";
  return "Live";
}

function meetingTone(meeting: { startsAt: string; endsAt: string }) {
  const status = meetingStatus(meeting);
  if (status === "Live") return "green";
  if (status === "Ready") return "blue";
  return "amber";
}
