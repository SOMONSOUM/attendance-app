"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  UserCheck,
  UserPlus,
  Users,
  X,
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
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PaginationFooter, paginate } from "@/components/admin/pagination-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelMeetingParticipant,
  getMeetingQr,
  joinMeetingParticipant,
  listMeetings,
  meetingKeys,
  registerMeetingParticipant,
  type EventShift,
  type MeetingParticipant,
  type RegistrationForm,
} from "@/lib/admin-data";
import { formatDate, formatDateRange, formatDateTime, formatTime } from "@/lib/format";
import {
  LocationRequirementBadge,
  MeetingDetailsCard,
  MetricCard,
  PersonalQrButton,
  PlacesEmptyState,
  QrPlaceCard,
  SingleQrCard,
  buildCoordinates,
  formatChairperson,
} from "./_components/meeting-detail-components";

export default function MeetingDetailPage() {
  const t = useTranslations("details");
  const common = useTranslations("common");
  const params = useParams<{ locale: string; meetingId: string }>();
  const searchParams = useSearchParams();
  const locale = params.locale ?? "en";
  const meetingId = params.meetingId;
  const selectedPlaceId = searchParams.get("placeId");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [participantStatus, setParticipantStatus] = useState("ALL");
  const [participantShift, setParticipantShift] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationForm>(emptyRegistrationForm);

  const meetingsQuery = useQuery({
    queryKey: meetingKeys.all,
    queryFn: () => listMeetings({ pageSize: 100 }),
  });
  const qrQuery = useQuery({
    queryKey: ["meetings", meetingId, "qr"],
    queryFn: () => getMeetingQr(meetingId),
    enabled: Boolean(meetingId),
  });
  const joinMutation = useMutation({
    mutationFn: (participantId: string) =>
      joinMeetingParticipant(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
  const cancelMutation = useMutation({
    mutationFn: (participantId: string) =>
      cancelMeetingParticipant(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
  const registerMutation = useMutation({
    mutationFn: (data: RegistrationForm) => {
      return registerMeetingParticipant(meetingId, {
        ...data,
        placeId: selectedPlace?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      setRegistrationForm(emptyRegistrationForm);
      setRegisterOpen(false);
    },
  });

  const meeting = meetingsQuery.data?.items.find((item) => item.id === meetingId);
  const participants = meeting?.participants ?? [];
  const selectedPlace = selectedPlaceId
    ? meeting?.places?.find((place) => place.id === selectedPlaceId) ?? null
    : null;
  const detailCoordinates = buildCoordinates(
    selectedPlace?.latitude ?? meeting?.latitude,
    selectedPlace?.longitude ?? meeting?.longitude,
  );
  const scopedParticipants = selectedPlace
    ? participants.filter((participant) => participant.placeId === selectedPlace.id)
    : participants;
  const filteredParticipants = scopedParticipants.filter(
    (participant) =>
      matchesParticipantSearch(participant, search) &&
      matchesParticipantStatus(participant, participantStatus) &&
      matchesParticipantShift(participant, participantShift),
  );
  const pagedParticipants = paginate(filteredParticipants, page, pageSize);
  const joinedParticipants = scopedParticipants.filter(
    (participant) => participant.status === "JOINED",
  );
  const invitedParticipants = scopedParticipants.filter(
    (participant) => participant.status !== "JOINED",
  );
  const joinRate = percentage(joinedParticipants.length, scopedParticipants.length);
  const placeRows = useMemo(
    () =>
      (meeting?.places ?? []).map((place) => {
        const rows = participants.filter((participant) => participant.placeId === place.id);
        const joined = rows.filter((participant) => participant.status === "JOINED");

        return {
          ...place,
          coordinates: buildCoordinates(
            place.latitude ?? meeting?.latitude,
            place.longitude ?? meeting?.longitude,
          ),
          total: rows.length,
          joined: joined.length,
          rate: percentage(joined.length, rows.length),
          qr: qrQuery.data?.qrCodes?.find((item) => item.placeId === place.id),
        };
      }),
    [
      meeting?.places,
      meeting?.latitude,
      meeting?.longitude,
      participants,
      qrQuery.data?.qrCodes,
    ],
  );
  const canRegisterInCurrentScope =
    !meeting?.separateQrByPlace || Boolean(selectedPlace);

  return (
    <AdminShell
      active="Meetings"
      title={
        selectedPlace
          ? `${selectedPlace.name} overview`
          : meeting?.name ?? t("meetingOverview")
      }
      description={
        meeting
          ? selectedPlace
            ? `${meeting.name}, ${selectedPlace.locationName || meeting.locationName}`
            : `${registrationModeLabel(meeting.mode, common)} ${common("meeting").toLowerCase()}, ${formatDateRange(
                meeting.startsAt,
                meeting.endsAt,
              )}`
          : t("meetingDescription")
      }
      action={
        <Button asChild variant="outline">
          <Link href={`/${locale}/meetings`}>
            <ArrowLeft size={16} />
            {t("backToMeetings")}
          </Link>
        </Button>
      }
    >
      {meetingsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-fg">
          {t("loadingMeeting")}
        </div>
      ) : !meeting ? (
        <EmptyState
          title={t("meetingNotFound")}
          text={t("meetingNotFoundText")}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={meeting.separateQrByPlace ? "purple" : "blue"}>
              {meeting.separateQrByPlace ? t("byPlace") : t("singleQr")}
            </StatusPill>
            <StatusPill tone={meetingTone(meeting)}>
              {meetingStatus(meeting, common)}
            </StatusPill>
            <LocationRequirementBadge
              required={meeting.requireLocation}
              labels={{
                required: t("locationRequired"),
                notRequired: t("locationNotRequired"),
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={selectedPlace ? t("placeUsers") : t("participants")}
              value={String(scopedParticipants.length)}
              sub={t("notYetJoinedCount", { count: invitedParticipants.length })}
              icon={Users}
            />
            <MetricCard
              label={common("joined")}
              value={String(joinedParticipants.length)}
              sub={t("coverage", { rate: joinRate })}
              icon={UserCheck}
            />
            <MetricCard
              label={t("chairpersons")}
              value={String(meeting.chairpersons.length)}
              sub={
                meeting.chairpersons[0]
                  ? formatChairperson(meeting.chairpersons[0])
                  : t("noChairperson")
              }
              icon={Users}
            />
            <MetricCard
              label={t("schedule")}
              value={formatDate(meeting.startsAt)}
              sub={formatTime(meeting.startsAt)}
              icon={CalendarDays}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
            <MeetingDetailsCard
              name={selectedPlace?.name ?? meeting.name}
              description={meeting.description}
              locationName={selectedPlace?.locationName || meeting.locationName}
              requireLocation={
                selectedPlace
                  ? selectedPlace.requireLocation
                  : meeting.requireLocation
              }
              coordinates={detailCoordinates}
              chairpersons={meeting.chairpersons}
              shifts={meeting.shifts}
              labels={{
                title: t("meetingDetails"),
                location: common("location"),
                description: common("description"),
                chairpersons: t("chairpersons"),
                shifts: t("shifts"),
                noPosition: t("noPosition"),
                locationRequired: t("locationRequired"),
                locationNotRequired: t("locationNotRequired"),
                openMap: t("openMap"),
              }}
            />

            <Card>
              <SectionToolbar
                title={
                  meeting.separateQrByPlace
                    ? selectedPlace
                      ? t("qrAndStats", { name: selectedPlace.name })
                      : t("placesAndQr")
                    : t("meetingQr")
                }
              >
                {selectedPlace ? (
                  <Button asChild variant="outline" className="h-8">
                    <Link href={`/${locale}/meetings/${meeting.id}`}>{t("allPlaces")}</Link>
                  </Button>
                ) : null}
              </SectionToolbar>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                {meeting.separateQrByPlace ? (
                  placeRows.length ? (
                    placeRows
                      .filter((place) =>
                        selectedPlace ? place.id === selectedPlace.id : true,
                      )
                      .map((place) => (
                      <QrPlaceCard
                        key={place.id ?? place.name}
                        name={place.name}
                        locationName={place.locationName}
                        description={place.description}
                        total={place.total}
                        joined={place.joined}
                        rate={place.rate}
                        code={place.qr?.code}
                        qrUrl={place.qr?.qrUrl}
                        qrImage={place.qr?.qrImage}
                        fileName={`${meeting.name}-${place.name}.png`}
                        href={`/${locale}/meetings/${meeting.id}?placeId=${place.id}`}
                        requireLocation={place.requireLocation}
                        coordinates={place.coordinates}
                        showView={!selectedPlace}
                        labels={placeCardLabels(t)}
                      />
                    ))
                  ) : (
                    <PlacesEmptyState
                      title={t("noPlacesConfigured")}
                      text={t("noMeetingPlacesText")}
                    />
                  )
                ) : (
                  <SingleQrCard
                    name={meeting.name}
                    code={qrQuery.data?.code}
                    qrUrl={qrQuery.data?.qrUrl}
                    qrImage={qrQuery.data?.qrImage}
                    labels={singleQrLabels(t)}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <TableShell>
            <SectionToolbar
              title={selectedPlace ? t("placeParticipantsTitle", { name: selectedPlace.name }) : t("participants")}
            >
              <div className="flex items-center gap-2">
                <StatusPill tone="blue">
                  {t("totalCount", { count: filteredParticipants.length })}
                </StatusPill>
                <Button
                  className="h-8"
                  onClick={() => setRegisterOpen(true)}
                  disabled={!canRegisterInCurrentScope}
                >
                  <UserPlus size={14} />
                  {t("register")}
                </Button>
              </div>
            </SectionToolbar>
            <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(220px,1fr)_160px_160px_120px]">
              <Input
                value={search}
                placeholder={t("searchAttendeePlaceholder")}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <Select
                value={participantStatus}
                onChange={(event) => {
                  setParticipantStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">{t("allStatuses")}</option>
                <option value="JOINED">{common("joined")}</option>
                <option value="INVITED">{common("invited")}</option>
                <option value="CANCELLED">{common("cancelled")}</option>
              </Select>
              <Select
                value={participantShift}
                onChange={(event) => {
                  setParticipantShift(event.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All shifts</option>
                {(meeting.shifts ?? []).map((shift) => (
                  <option key={shift.id ?? shift.name} value={shift.id ?? ""}>
                    {shift.name}
                  </option>
                ))}
              </Select>
              <Select
                value={String(pageSize)}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value="10">{t("perPage", { count: 10 })}</option>
                <option value="20">{t("perPage", { count: 20 })}</option>
                <option value="50">{t("perPage", { count: 50 })}</option>
              </Select>
            </div>
            {pagedParticipants.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-t-0">
                      <TableHead>{common("name")}</TableHead>
                      <TableHead>{common("place")}</TableHead>
                      <TableHead>{t("shift")}</TableHead>
                      <TableHead>{common("position")}</TableHead>
                      <TableHead>{common("department")}</TableHead>
                      <TableHead>{common("status")}</TableHead>
                      <TableHead>{t("joinedTime")}</TableHead>
                      <TableHead className="text-right">{common("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedParticipants.map((participant) => (
                      <TableRow key={participant.id ?? participant.fullNameEn}>
                        <TableCell>
                          <p className="font-medium">{participant.fullNameEn}</p>
                          {participant.fullNameKm ? (
                            <p className="text-xs text-muted-fg">
                              {participant.fullNameKm}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {placeName(meeting.places, participant.placeId, t)}
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {shiftName(meeting.shifts, participant.shiftId)}
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {participant.position || "-"}
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {participant.department || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            tone={participant.status === "JOINED" ? "green" : "amber"}
                          >
                            {participantStatusLabel(participant.status, common)}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {participant.joinedAt
                            ? formatDateTime(participant.joinedAt)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {participant.id ? (
                              <>
                                <PersonalQrButton
                                  name={participant.fullNameEn}
                                  code={participant.checkInCode}
                                  fileName={`${meeting.name}-${participant.fullNameEn}.png`}
                                />
                                {participant.status === "JOINED" ? (
                                  <Button
                                    variant="destructive"
                                    size="icon-sm"
                                    className="shrink-0"
                                    disabled={cancelMutation.isPending}
                                    onClick={() =>
                                      cancelMutation.mutate(participant.id!)
                                    }
                                    aria-label={`Cancel check-in for ${participant.fullNameEn}`}
                                    title={`Cancel check-in for ${participant.fullNameEn}`}
                                  >
                                    <X />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon-sm"
                                    className="shrink-0"
                                    disabled={joinMutation.isPending}
                                    onClick={() =>
                                      joinMutation.mutate(participant.id!)
                                    }
                                    aria-label={`Check in ${participant.fullNameEn}`}
                                    title={`Check in ${participant.fullNameEn}`}
                                  >
                                    <Check />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-fg">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationFooter
                  page={page}
                  pageSize={pageSize}
                  totalItems={filteredParticipants.length}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <EmptyState
                title={t("noParticipants")}
                text={t("noParticipantsText")}
              />
            )}
          </TableShell>
          <RegistrationDialog
            open={registerOpen}
            labels={registrationDialogLabels(t, "participant")}
            values={registrationForm}
            shifts={meeting.shifts ?? []}
            isPending={registerMutation.isPending}
            error={registerMutation.error?.message}
            onOpenChange={setRegisterOpen}
            onChange={setRegistrationForm}
            onSubmit={() => registerMutation.mutate(registrationForm)}
          />
        </div>
      )}
    </AdminShell>
  );
}

function placeName(
  places: Array<{ id?: string; name: string }> | undefined,
  placeId?: string | null,
  t?: ReturnType<typeof useTranslations<"details">>,
) {
  if (!placeId) return t ? t("allPlaces") : "All places";
  return places?.find((place) => place.id === placeId)?.name ?? (t ? t("unknownPlace") : "Unknown place");
}

function shiftName(shifts: EventShift[] | undefined, shiftId?: string | null) {
  if (!shiftId) return "-";
  return shifts?.find((shift) => shift.id === shiftId)?.name ?? "-";
}

const emptyRegistrationForm: RegistrationForm = {
  fullNameEn: "",
  fullNameKm: "",
  gender: "",
  position: "",
  department: "",
  shiftId: "",
};

function RegistrationDialog({
  open,
  labels,
  values,
  shifts,
  isPending,
  error,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  labels: RegistrationDialogLabels;
  values: RegistrationForm;
  shifts: EventShift[];
  isPending: boolean;
  error?: string;
  onOpenChange: (open: boolean) => void;
  onChange: (values: RegistrationForm) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={labels.title}
      description={labels.description}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={labels.fullNameEn} className="sm:col-span-2">
            <Input
              value={values.fullNameEn}
              onChange={(event) =>
                onChange({ ...values, fullNameEn: event.target.value })
              }
              required
            />
          </FormField>
          <FormField label={labels.fullNameKm} className="sm:col-span-2">
            <Input
              value={values.fullNameKm ?? ""}
              onChange={(event) =>
                onChange({ ...values, fullNameKm: event.target.value })
              }
            />
          </FormField>
          <FormField label={labels.gender}>
            <Select
              value={values.gender ?? ""}
              onChange={(event) =>
                onChange({
                  ...values,
                  gender: event.target.value as RegistrationForm["gender"],
                })
              }
            >
              <option value="">{labels.notSpecified}</option>
              <option value="MALE">{labels.male}</option>
              <option value="FEMALE">{labels.female}</option>
              <option value="OTHER">{labels.other}</option>
            </Select>
          </FormField>
          {shifts.length ? (
            <FormField label={labels.shift} className="sm:col-span-2">
              <Select
                value={values.shiftId ?? ""}
                onChange={(event) =>
                  onChange({ ...values, shiftId: event.target.value })
                }
              >
                <option value="">{labels.noShift}</option>
                {shifts.map((shift) => (
                  <option key={shift.id ?? shift.name} value={shift.id ?? ""}>
                    {shift.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
          <FormField label={labels.position}>
            <Input
              value={values.position ?? ""}
              onChange={(event) =>
                onChange({ ...values, position: event.target.value })
              }
            />
          </FormField>
          <FormField label={labels.department} className="sm:col-span-2">
            <Input
              value={values.department ?? ""}
              onChange={(event) =>
                onChange({ ...values, department: event.target.value })
              }
            />
          </FormField>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button type="submit" disabled={isPending || !values.fullNameEn.trim()}>
            <UserPlus size={14} />
            {isPending ? labels.registering : labels.register}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

type RegistrationDialogLabels = {
  title: string;
  description: string;
  fullNameEn: string;
  fullNameKm: string;
  gender: string;
  notSpecified: string;
  male: string;
  female: string;
  other: string;
  shift: string;
  noShift: string;
  position: string;
  department: string;
  cancel: string;
  register: string;
  registering: string;
};

function registrationDialogLabels(
  t: ReturnType<typeof useTranslations<"details">>,
  noun: "attendee" | "participant",
): RegistrationDialogLabels {
  return {
    title: t(noun === "attendee" ? "registerAttendee" : "registerParticipant"),
    description: t(
      noun === "attendee"
        ? "registerAttendeeDescription"
        : "registerParticipantDescription",
    ),
    fullNameEn: t("fullNameEn"),
    fullNameKm: t("fullNameKm"),
    gender: t("gender"),
    notSpecified: t("notSpecified"),
    male: t("male"),
    female: t("female"),
    other: t("other"),
    shift: t("shift"),
    noShift: t("noShiftSelected"),
    position: t("position"),
    department: t("department"),
    cancel: t("cancel"),
    register: t("register"),
    registering: t("registering"),
  };
}

function FormField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`grid gap-2 text-sm font-medium ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function registrationModeLabel(
  mode: string,
  t: ReturnType<typeof useTranslations<"common">>,
) {
  if (mode === "OPEN_REGISTRATION") return t("openRegistration");
  if (mode === "PRE_REGISTRATION") return t("preRegistration");
  return t("bulkRegistration");
}

function matchesParticipantSearch(
  participant: MeetingParticipant,
  search: string,
) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [participant.fullNameEn, participant.fullNameKm]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

function matchesParticipantStatus(
  participant: MeetingParticipant,
  status: string,
) {
  return status === "ALL" || (participant.status ?? "INVITED") === status;
}

function matchesParticipantShift(
  participant: MeetingParticipant,
  shiftId: string,
) {
  return shiftId === "ALL" || participant.shiftId === shiftId;
}

function meetingStatus(
  meeting: { startsAt: string; endsAt: string },
  t: ReturnType<typeof useTranslations<"common">>,
) {
  const now = Date.now();
  if (new Date(meeting.startsAt).getTime() > now) return t("ready");
  if (new Date(meeting.endsAt).getTime() < now) return t("closed");
  return t("live");
}

function meetingTone(meeting: { startsAt: string; endsAt: string }) {
  const now = Date.now();
  if (new Date(meeting.startsAt).getTime() <= now && new Date(meeting.endsAt).getTime() >= now) return "green";
  if (new Date(meeting.startsAt).getTime() > now) return "blue";
  return "amber";
}

function placeCardLabels(t: ReturnType<typeof useTranslations<"details">>) {
  return {
    locationNotSet: t("locationNotSet"),
    users: t("users"),
    joined: t("joinedShort"),
    rate: t("rate"),
    view: t("view"),
    map: t("map"),
    qr: t("qr"),
    locationRequired: t("locationRequired"),
    locationNotRequired: t("locationNotRequired"),
    openMap: t("openMap"),
  };
}

function singleQrLabels(t: ReturnType<typeof useTranslations<"details">>) {
  return {
    title: t("singleMeetingQr"),
    generating: t("generatingQr"),
    loading: t("loadingQr"),
    download: t("downloadQr"),
  };
}

function participantStatusLabel(
  status: MeetingParticipant["status"],
  t: ReturnType<typeof useTranslations<"common">>,
) {
  if (status === "JOINED") return t("joined");
  if (status === "CANCELLED") return t("cancelled");
  return t("invited");
}
