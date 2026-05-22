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
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  meetingKeys,
  type MeetingChairperson,
  type MeetingForm,
  type MeetingParticipant,
  type MeetingPlace,
  type MeetingRecord,
  listMeetings,
  updateMeeting,
  uploadMeetingRegistrationImport,
} from "@/lib/admin-data";

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
  locationName: "",
};

const initialForm: MeetingForm = {
  name: "",
  description: "",
  mode: "PRE_REGISTERED",
  separateQrByPlace: false,
  locationName: "",
  startsAt: "2026-06-01",
  endsAt: "2026-06-01",
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
  const currentUser = currentUserQuery.data;
  const canCreate = hasPermission(currentUser, "meetings:create");
  const canUpdate = hasPermission(currentUser, "meetings:update");
  const canDelete = hasPermission(currentUser, "meetings:delete");
  const meetings = meetingsQuery.data?.items ?? [];
  const meetingImports = importsQuery.data?.items ?? [];
  const activeCount = useMemo(
    () => meetings.filter((meeting) => new Date(meeting.endsAt) >= new Date()).length,
    [meetings],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const savedMeeting = editing
        ? updateMeeting(editing.id, normalizeForm(form))
        : createMeeting(normalizeForm(form));
      const meeting = await savedMeeting;

      if (form.mode === "PRE_REGISTERED") {
        if (sourceImportId) {
          await copyMeetingRegistrationImport(meeting.id, sourceImportId);
        } else if (participantFile) {
          const uploaded = await uploadMeetingRegistrationImport(participantFile);
          await copyMeetingRegistrationImport(meeting.id, uploaded.id);
        }
      }

      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["registration-imports", "meetings"] });
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
    setStep(0);
  }

  function startEdit(meeting: MeetingRecord) {
    setEditing(meeting);
    setForm({
      name: meeting.name,
      description: meeting.description ?? "",
      mode: meeting.mode,
      separateQrByPlace: Boolean(meeting.separateQrByPlace),
      locationName: meeting.locationName ?? "",
      startsAt: toDateInput(meeting.startsAt),
      endsAt: toDateInput(meeting.endsAt),
      chairpersons: meeting.chairpersons.length
        ? meeting.chairpersons.map(stripChairperson)
        : [{ ...emptyChairperson }],
      places: meeting.places?.map((place) => ({
        id: place.id,
        name: place.name,
        description: place.description ?? "",
        locationName: place.locationName ?? "",
      })) ?? [],
      participants: meeting.participants.map(stripParticipant),
    });
    setParticipantFile(null);
    setSourceImportId("");
    setStep(0);
  }

  function updateChairperson(index: number, patch: Partial<MeetingChairperson>) {
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
            <div className="p-5 text-sm text-muted-fg">Loading meetings...</div>
          ) : meetings.length ? (
            <>
            <Table className="min-w-180">
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
                    onClick={() => router.push(`/${locale}/meetings/${meeting.id}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="hover:text-primary">{meeting.name}</span>
                      <p className="mt-1 text-xs font-normal text-muted-fg">
                        {meeting.locationName}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {meeting.mode.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={meeting.separateQrByPlace ? "purple" : "blue"}>
                        {meeting.separateQrByPlace ? "By place" : "Single QR"}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{formatChairperson(meeting.chairpersons[0])}</TableCell>
                    <TableCell className="text-muted-fg">
                      {meeting._count?.participants ?? meeting.participants.length}
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
                <CardTitle>{editing ? "Update meeting" : "Create meeting"}</CardTitle>
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
                  setStep((value) => Math.min(value + 1, wizardSteps.length - 1));
                  return;
                }
                saveMutation.mutate();
              }}
            >
              <div className="border-b border-border p-4">
                <WizardSteps step={step} onStepChange={setStep} />
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
                      <Input
                        type="date"
                        value={form.startsAt}
                        onChange={(event) =>
                          setForm({ ...form, startsAt: event.target.value })
                        }
                        required
                      />
                    </Field>
                    <Field label="End date">
                      <Input
                        type="date"
                        value={form.endsAt}
                        onChange={(event) =>
                          setForm({ ...form, endsAt: event.target.value })
                        }
                        required
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
                        setForm({
                          ...form,
                          mode: event.target.value as MeetingForm["mode"],
                        })
                      }
                    >
                      <option value="PRE_REGISTERED">Pre-registered participants</option>
                      <option value="OPEN_REGISTRATION">Open registration by QR</option>
                    </Select>
                  </Field>

                  <Field label="QR mode">
                    <Select
                      value={form.separateQrByPlace ? "separate" : "single"}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          separateQrByPlace: event.target.value === "separate",
                          places:
                            event.target.value === "separate" && !form.places?.length
                              ? [{ ...emptyPlace }]
                              : form.places,
                        })
                      }
                    >
                      <option value="single">One QR code for the meeting</option>
                      <option value="separate">Separate QR codes by place</option>
                    </Select>
                  </Field>

                  {form.separateQrByPlace ? (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">Meeting places</h3>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-3"
                          onClick={() =>
                            setForm({
                              ...form,
                              places: [...(form.places ?? []), { ...emptyPlace }],
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
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Place name"
                              value={place.name}
                              onChange={(event) =>
                                updatePlace(index, { name: event.target.value })
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
                              updatePlace(index, { locationName: event.target.value })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}

              {step === 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Meeting chairpersons</h3>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3"
                    onClick={() =>
                      setForm({
                        ...form,
                        chairpersons: [...form.chairpersons, { ...emptyChairperson }],
                      })
                    }
                  >
                    <Plus size={14} />
                    Add
                  </Button>
                </div>
                {form.chairpersons.map((chairperson, index) => (
                  <div key={index} className="grid gap-3 rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-medium">Chairperson {index + 1}</p>
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
                                    (_, chairpersonIndex) => chairpersonIndex !== index,
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
                          updateChairperson(index, { honorificTitleEn: event.target.value })
                        }
                        required
                      />
                      <Input
                        placeholder="Honorific KM"
                        value={chairperson.honorificTitleKm}
                        onChange={(event) =>
                          updateChairperson(index, { honorificTitleKm: event.target.value })
                        }
                        required
                      />
                      <Input
                        placeholder="First name EN"
                        value={chairperson.firstNameEn}
                        onChange={(event) =>
                          updateChairperson(index, { firstNameEn: event.target.value })
                        }
                        required
                      />
                      <Input
                        placeholder="First name KM"
                        value={chairperson.firstNameKm}
                        onChange={(event) =>
                          updateChairperson(index, { firstNameKm: event.target.value })
                        }
                        required
                      />
                      <Input
                        placeholder="Last name EN"
                        value={chairperson.lastNameEn}
                        onChange={(event) =>
                          updateChairperson(index, { lastNameEn: event.target.value })
                        }
                        required
                      />
                      <Input
                        placeholder="Last name KM"
                        value={chairperson.lastNameKm}
                        onChange={(event) =>
                          updateChairperson(index, { lastNameKm: event.target.value })
                        }
                        required
                      />
                      <Input
                        placeholder="Position"
                        value={chairperson.position ?? ""}
                        onChange={(event) =>
                          updateChairperson(index, { position: event.target.value })
                        }
                      />
                      <Input
                        placeholder="Organization"
                        value={chairperson.organization ?? ""}
                        onChange={(event) =>
                          updateChairperson(index, { organization: event.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              ) : null}

              {step === 2 ? (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold">Participants</h3>
                {form.mode === "PRE_REGISTERED" ? (
                  <div className="grid gap-2 rounded-md border border-dashed border-border p-3">
                    <Label>Reusable meeting participants</Label>
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
                          setParticipantFile(event.target.files?.[0] ?? null)
                        }
                      />
                      <Button type="button" variant="outline" disabled>
                        <FileSpreadsheet size={15} />
                        On save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-fg">
                    Participants will register after scanning the meeting QR code.
                  </p>
                )}
              </div>
              ) : null}

              {saveMutation.error ? (
                <p className="text-sm text-destructive">
                  {saveMutation.error.message}
                </p>
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
                      setStep((value) =>
                        Math.min(value + 1, wizardSteps.length - 1),
                      );
                      return;
                    }
                    saveMutation.mutate();
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
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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

function normalizeForm(form: MeetingForm): MeetingForm {
  return {
    ...form,
    locationName: form.locationName?.trim() || "Not required",
    places: form.separateQrByPlace
      ? (form.places ?? [])
          .filter((place) => place.name.trim())
          .map((place) => cleanObject(place))
      : [],
    chairpersons: form.chairpersons.map((chairperson) => cleanObject(chairperson)),
    participants: (form.participants ?? [])
      .filter((participant) => participant.fullNameEn.trim())
      .map((participant) => cleanObject(participant)),
  };
}

function cleanObject<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== "" && item !== null),
  ) as T;
}

function stripChairperson(
  chairperson: MeetingChairperson,
): MeetingChairperson {
  return {
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
    department: participant.department ?? "",
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
