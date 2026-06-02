"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Download,
  RotateCcw,
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
import { PageSkeleton, TableSkeleton } from "@/components/admin/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
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
  cancelAttendance,
  downloadEventAttendeeCard,
  eventKeys,
  getEventQr,
  joinRegisteredAttendee,
  listEventRoster,
  listEvents,
  registerAttendeeByEventQr,
  type EventShift,
  type EventRosterRecord,
  type RegistrationForm,
} from "@/lib/admin-data";
import { formatDateRange, formatDateTime, formatTime } from "@/lib/format";
import {
  EventDetailsCard,
  LocationRequirementBadge,
  MetricCard,
  PersonalQrButton,
  PlacesEmptyState,
  QrPlaceCard,
  SingleQrCard,
  buildCoordinates,
} from "./_components/event-detail-components";

const ALL = "all";
const DEFAULT_PAGE_SIZE = 10;

export default function EventDetailPage() {
  const t = useTranslations("details");
  const common = useTranslations("common");
  const params = useParams<{ locale: string; eventId: string }>();
  const searchParams = useSearchParams();
  const locale = params.locale ?? "en";
  const eventId = params.eventId;
  const selectedPlaceId = searchParams.get("placeId") ?? ALL;
  const queryClient = useQueryClient();
  const [organization, setOrganization] = useState(ALL);
  const [position, setPosition] = useState(ALL);
  const [gender, setGender] = useState(ALL);
  const [shift, setShift] = useState(ALL);
  const [joinStatus, setJoinStatus] = useState(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationForm>(emptyRegistrationForm);

  const eventsQuery = useQuery({
    queryKey: eventKeys.all,
    queryFn: () => listEvents({ pageSize: 100 }),
  });
  const rosterQuery = useQuery({
    queryKey: ["event-roster", eventId],
    queryFn: () => listEventRoster(eventId),
    enabled: Boolean(eventId),
  });
  const qrQuery = useQuery({
    queryKey: ["events", eventId, "qr"],
    queryFn: () => getEventQr(eventId),
    enabled: Boolean(eventId),
  });
  const joinMutation = useMutation({
    mutationFn: (registrationId: string) =>
      joinRegisteredAttendee(eventId, registrationId),
    onSuccess: () => refreshEventData(queryClient, eventId),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelAttendance,
    onSuccess: () => refreshEventData(queryClient, eventId),
  });
  const cardMutation = useMutation({
    mutationFn: ({
      registrationId,
      fileName,
    }: {
      registrationId: string;
      fileName: string;
    }) => downloadEventAttendeeCard(eventId, registrationId).then((blob) =>
      downloadBlob(blob, fileName),
    ),
  });
  const registerMutation = useMutation({
    mutationFn: (data: RegistrationForm) => {
      const code = selectedPlace
        ? qrQuery.data?.qrCodes?.find((item) => item.placeId === selectedPlace.id)
            ?.code
        : qrQuery.data?.code;
      if (!code) throw new Error("QR code is not ready yet.");
      return registerAttendeeByEventQr(code, data);
    },
    onSuccess: () => {
      refreshEventData(queryClient, eventId);
      setRegistrationForm(emptyRegistrationForm);
      setRegisterOpen(false);
    },
  });

  const event = eventsQuery.data?.items.find((item) => item.id === eventId);
  const roster = rosterQuery.data ?? [];
  const scopedRows = useMemo(
    () =>
      selectedPlaceId === ALL
        ? roster
        : roster.filter((row) => row.placeId === selectedPlaceId),
    [roster, selectedPlaceId],
  );
  const selectedPlace =
    selectedPlaceId === ALL
      ? null
      : event?.places?.find((place) => place.id === selectedPlaceId);
  const detailCoordinates = buildCoordinates(
    selectedPlace?.latitude ?? event?.latitude,
    selectedPlace?.longitude ?? event?.longitude,
  );
  const joinedRows = scopedRows.filter((row) => row.joined);
  const notYetRows = scopedRows.filter((row) => !row.joined);
  const filteredRows = useMemo(
    () =>
      scopedRows.filter(
        (row) =>
          matchesFilter(row.organization, organization) &&
          matchesFilter(row.position, position) &&
          matchesFilter(row.gender, gender) &&
          matchesFilter(row.shiftName, shift) &&
          matchesJoinStatus(row, joinStatus) &&
          matchesSearch(row, search),
      ),
    [scopedRows, organization, position, gender, shift, joinStatus, search],
  );
  const totalPages = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [organization, position, gender, shift, joinStatus, pageSize, selectedPlaceId, search]);

  const organizationOptions = useMemo(
    () => uniqueValues(scopedRows.map((row) => row.organization)),
    [scopedRows],
  );
  const positionOptions = useMemo(
    () => uniqueValues(scopedRows.map((row) => row.position)),
    [scopedRows],
  );
  const genderOptions = useMemo(
    () => uniqueValues(scopedRows.map((row) => row.gender)),
    [scopedRows],
  );
  const shiftOptions = useMemo(
    () => event?.shifts?.map((eventShift) => eventShift.name).sort() ?? [],
    [event?.shifts],
  );
  const joinRate = percentage(joinedRows.length, scopedRows.length);
  const placeRows = useMemo(
    () =>
      (event?.places ?? []).map((place) => {
        const rows = roster.filter((row) => row.placeId === place.id);
        const joined = rows.filter((row) => row.joined);

        return {
          ...place,
          coordinates: buildCoordinates(
            place.latitude ?? event?.latitude,
            place.longitude ?? event?.longitude,
          ),
          total: rows.length,
          joined: joined.length,
          rate: percentage(joined.length, rows.length),
          qr: qrQuery.data?.qrCodes?.find((item) => item.placeId === place.id),
        };
      }),
    [event?.places, event?.latitude, event?.longitude, roster, qrQuery.data?.qrCodes],
  );
  const canRegisterInCurrentScope =
    !event?.separateQrByPlace || Boolean(selectedPlace);

  return (
    <AdminShell
      active="Events"
      title={
        selectedPlace
          ? `${selectedPlace.name} overview`
          : event?.name ?? t("eventOverview")
      }
      description={
        event
          ? selectedPlace
            ? `${event.name}, ${selectedPlace.locationName || event.locationName}`
            : `${registrationModeLabel(event.mode, common)} ${common("event").toLowerCase()}, ${formatDateRange(event.startsAt, event.endsAt)}`
          : t("eventDescription")
      }
      action={
        <Button asChild variant="outline">
          <Link href={`/${locale}/events`}>
            <ArrowLeft size={16} />
            {t("backToEvents")}
          </Link>
        </Button>
      }
    >
      {eventsQuery.isLoading || rosterQuery.isLoading ? (
        <div className="space-y-5">
          <PageSkeleton />
          <TableShell>
            <TableSkeleton columns={8} />
          </TableShell>
        </div>
      ) : !event ? (
        <EmptyState
          title={t("eventNotFound")}
          text={t("eventNotFoundText")}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={event.separateQrByPlace ? "purple" : "blue"}>
              {event.separateQrByPlace ? t("byPlace") : t("singleQr")}
            </StatusPill>
            <StatusPill tone={eventTone(event)}>{eventStatus(event, common)}</StatusPill>
            <LocationRequirementBadge
              required={event.requireLocation}
              labels={{
                required: t("locationRequired"),
                notRequired: t("locationNotRequired"),
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={selectedPlace ? t("placeUsers") : t("allUsers")}
              value={String(scopedRows.length)}
              sub={t("notYetJoinedCount", { count: notYetRows.length })}
              icon={Users}
            />
            <MetricCard
              label={common("joined")}
              value={String(joinedRows.length)}
              sub={t("coverage", { rate: joinRate })}
              icon={UserCheck}
            />
            <MetricCard
              label={t("filteredUsers")}
              value={String(filteredRows.length)}
              sub={t("matchingTable")}
              icon={BarChart3}
            />
            <MetricCard
              label={t("latestJoin")}
              value={latestJoinTime(joinedRows)}
              sub={t("mostRecentCheckIn")}
              icon={Clock}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
            <EventDetailsCard
              name={selectedPlace?.name ?? event.name}
              description={event.description}
              locationName={selectedPlace?.locationName || event.locationName}
              requireLocation={
                selectedPlace ? selectedPlace.requireLocation : event.requireLocation
              }
              coordinates={detailCoordinates}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              shifts={event.shifts}
              labels={{
                title: t("eventDetails"),
                location: common("location"),
                description: common("description"),
                schedule: t("schedule"),
                shifts: t("shifts"),
                locationRequired: t("locationRequired"),
                locationNotRequired: t("locationNotRequired"),
                openMap: t("openMap"),
              }}
            />

            <Card>
              <SectionToolbar
                title={
                  event.separateQrByPlace
                    ? selectedPlace
                      ? t("qrAndStats", { name: selectedPlace.name })
                      : t("placesAndQr")
                    : t("eventQr")
                }
              >
                {selectedPlace ? (
                  <Button asChild variant="outline" className="h-8">
                    <Link href={`/${locale}/events/${event.id}`}>{t("allPlaces")}</Link>
                  </Button>
                ) : null}
              </SectionToolbar>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                {event.separateQrByPlace ? (
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
                          fileName={`${event.name}-${place.name}.png`}
                          href={`/${locale}/events/${event.id}?placeId=${place.id}`}
                          requireLocation={place.requireLocation}
                          coordinates={place.coordinates}
                          showView={!selectedPlace}
                          labels={placeCardLabels(t)}
                        />
                      ))
                  ) : (
                    <PlacesEmptyState
                      title={t("noPlacesConfigured")}
                      text={t("noEventPlacesText")}
                    />
                  )
                ) : (
                  <SingleQrCard
                    name={event.name}
                    code={qrQuery.data?.code}
                    qrUrl={qrQuery.data?.qrUrl}
                    qrImage={qrQuery.data?.qrImage}
                    labels={singleQrLabels(t, "event")}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="grid gap-3 p-4 xl:grid-cols-6">
              <FilterSelect
                label={common("organization")}
                value={organization}
                values={organizationOptions}
                onChange={setOrganization}
                allLabel={t("allOrganizations")}
              />
              <FilterSelect
                label={common("position")}
                value={position}
                values={positionOptions}
                onChange={setPosition}
                allLabel={t("allPositions")}
              />
              <FilterSelect
                label={common("gender")}
                value={gender}
                values={genderOptions}
                onChange={setGender}
                allLabel={t("allGenders")}
              />
              <FilterSelect
                label={t("shift")}
                value={shift}
                values={shiftOptions}
                onChange={setShift}
                allLabel={t("allShifts")}
              />
              <label className="grid gap-2 text-sm font-medium xl:col-span-2">
                {t("searchAttendee")}
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={search}
                  placeholder={t("searchAttendeePlaceholder")}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("joinedStatus")}
                <Select
                  value={joinStatus}
                  onChange={(event) => setJoinStatus(event.target.value)}
                >
                  <option value={ALL}>{t("allStatuses")}</option>
                  <option value="joined">{common("joined")}</option>
                  <option value="not-yet">{t("notYet")}</option>
                </Select>
              </label>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOrganization(ALL);
                    setPosition(ALL);
                    setGender(ALL);
                    setShift(ALL);
                    setJoinStatus(ALL);
                    setSearch("");
                  }}
                >
                  <RotateCcw size={14} />
                  {common("reset")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <TableShell>
            <SectionToolbar
              title={
                selectedPlace ? t("placeUsersTitle", { name: selectedPlace.name }) : t("allUsersInEvent")
              }
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-fg">
                  {t("userCount", { count: filteredRows.length })}
                </span>
                <Button
                  className="h-8"
                  onClick={() => setRegisterOpen(true)}
                  disabled={qrQuery.isLoading || !canRegisterInCurrentScope}
                >
                  <UserPlus size={14} />
                  {t("register")}
                </Button>
                <Select
                  className="h-8 w-28"
                  value={String(pageSize)}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value="10">{t("perPage", { count: 10 })}</option>
                  <option value="20">{t("perPage", { count: 20 })}</option>
                  <option value="50">{t("perPage", { count: 50 })}</option>
                </Select>
              </div>
            </SectionToolbar>
            {pageRows.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-t-0">
                      <TableHead>{common("user")}</TableHead>
                      <TableHead>{common("organization")}</TableHead>
                      <TableHead>{common("position")}</TableHead>
                      <TableHead>{common("gender")}</TableHead>
                      {event.separateQrByPlace ? <TableHead>{common("place")}</TableHead> : null}
                      <TableHead>{t("shift")}</TableHead>
                      <TableHead>{common("joined")}</TableHead>
                      <TableHead>{t("joinedTime")}</TableHead>
                      <TableHead className="text-right">{common("action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((row) => (
                      <TableRow key={`${row.registrationId ?? row.attendanceId}`}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{row.fullNameEn}</p>
                            {row.fullNameKm ? (
                              <p className="text-xs text-muted-fg">
                                {row.fullNameKm}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {row.organization ?? "-"}
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {row.position ?? "-"}
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {row.gender ?? "-"}
                        </TableCell>
                        {event.separateQrByPlace ? (
                          <TableCell className="text-muted-fg">
                            {row.placeName ?? "-"}
                          </TableCell>
                        ) : null}
                        <TableCell className="text-muted-fg">
                          {row.shiftName ?? "-"}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={row.joined ? "green" : "amber"}>
                            {row.joined ? common("joined") : t("notYet")}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {row.joinedAt
                            ? formatDateTime(row.joinedAt)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.registrationId ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              <PersonalQrButton
                                name={row.fullNameEn}
                                code={row.checkInCode}
                                fileName={`${event.name}-${row.fullNameEn}.png`}
                                cardPath={
                                  row.checkInCode
                                    ? `/api/attendance/registrations/qr/${encodeURIComponent(row.checkInCode)}/card`
                                    : undefined
                                }
                              />
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="shrink-0"
                                disabled={cardMutation.isPending}
                                onClick={() =>
                                  cardMutation.mutate({
                                    registrationId: row.registrationId!,
                                    fileName: `${event.name}-${row.fullNameEn}-card.png`,
                                  })
                                }
                                aria-label={`Download attendee card for ${row.fullNameEn}`}
                                title={`Download attendee card for ${row.fullNameEn}`}
                              >
                                <Download />
                              </Button>
                              {row.joined && row.attendanceId ? (
                                <Button
                                  variant="destructive"
                                  size="icon-sm"
                                  className="shrink-0"
                                  disabled={cancelMutation.isPending}
                                  onClick={() =>
                                    cancelMutation.mutate(row.attendanceId!)
                                  }
                                  aria-label={`Cancel check-in for ${row.fullNameEn}`}
                                  title={`Cancel check-in for ${row.fullNameEn}`}
                                >
                                  <X />
                                </Button>
                              ) : (
                                <Button
                                  size="icon-sm"
                                  className="shrink-0"
                                  disabled={joinMutation.isPending}
                                  onClick={() =>
                                    joinMutation.mutate(row.registrationId!)
                                  }
                                  aria-label={`Check in ${row.fullNameEn}`}
                                  title={`Check in ${row.fullNameEn}`}
                                >
                                  <Check />
                                </Button>
                              )}
                            </div>
                          ) : row.joined && row.attendanceId ? (
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              className="shrink-0"
                              disabled={cancelMutation.isPending}
                              onClick={() =>
                                cancelMutation.mutate(row.attendanceId!)
                              }
                              aria-label={`Cancel check-in for ${row.fullNameEn}`}
                              title={`Cancel check-in for ${row.fullNameEn}`}
                            >
                              <X />
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-fg">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-col justify-between gap-3 border-t border-border p-4 sm:flex-row sm:items-center">
                  <p className="text-sm text-muted-fg">
                    {t("pageOf", { page: currentPage, total: totalPages })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((value) => Math.max(value - 1, 1))}
                    >
                      {common("previous")}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((value) => Math.min(value + 1, totalPages))
                      }
                    >
                      {common("next")}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title={t("noUsersMatch")}
                text={t("noEventUsersText")}
              />
            )}
          </TableShell>
          <RegistrationDialog
            open={registerOpen}
            labels={registrationDialogLabels(t, "attendee")}
            values={registrationForm}
            shifts={event.shifts ?? []}
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

function FilterSelect({
  label,
  value,
  values,
  onChange,
  allLabel,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  allLabel: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={ALL}>{allLabel}</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
    </label>
  );
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => cleanValue(value)))).sort();
}

function cleanValue(value: string | null | undefined) {
  return value?.trim() || "Unspecified";
}

function matchesFilter(value: string | null | undefined, filter: string) {
  return filter === ALL || cleanValue(value) === filter;
}

function matchesJoinStatus(row: EventRosterRecord, filter: string) {
  if (filter === "joined") return row.joined;
  if (filter === "not-yet") return !row.joined;
  return true;
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function latestJoinTime(rows: EventRosterRecord[]) {
  const latest = rows
    .map((row) => row.joinedAt)
    .filter(Boolean)
    .sort(
      (a, b) => new Date(b!).getTime() - new Date(a!).getTime(),
    )[0];

  return latest ? formatTime(latest) : "-";
}

const emptyRegistrationForm: RegistrationForm = {
  fullNameEn: "",
  fullNameKm: "",
  gender: "",
  position: "",
  organization: "",
  phoneNumber: "",
  shiftId: "",
};

function RegistrationDialog({
  open,
  labels,
  values,
  isPending,
  error,
  shifts,
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
          <FormField label="Organization">
            <Input
              value={values.organization ?? ""}
              onChange={(event) =>
                onChange({ ...values, organization: event.target.value })
              }
            />
          </FormField>
          <FormField label="Phone number">
            <Input
              value={values.phoneNumber ?? ""}
              onChange={(event) =>
                onChange({ ...values, phoneNumber: event.target.value })
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
  organization: string;
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
    organization: t("organization"),
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

function refreshEventData(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["event-roster", eventId] });
  queryClient.invalidateQueries({ queryKey: eventKeys.all });
}

function registrationModeLabel(
  mode: string,
  t: ReturnType<typeof useTranslations<"common">>,
) {
  if (mode === "OPEN_REGISTRATION") return t("openRegistration");
  if (mode === "PRE_REGISTRATION") return t("preRegistration");
  return t("bulkRegistration");
}

function matchesSearch(row: EventRosterRecord, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [row.fullNameEn, row.fullNameKm]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function eventStatus(
  event: {
    scheduleStatus?: "LIVE" | "UPCOMING" | "ENDED";
    startsAt: string;
    endsAt: string;
    shifts?: EventShift[];
  },
  t: ReturnType<typeof useTranslations<"common">>,
) {
  return t(apiScheduleStatus(event.scheduleStatus));
}

function eventTone(event: {
  scheduleStatus?: "LIVE" | "UPCOMING" | "ENDED";
  startsAt: string;
  endsAt: string;
  shifts?: EventShift[];
}) {
  const status = apiScheduleStatus(event.scheduleStatus);
  if (status === "live") return "green";
  if (status === "ready") return "purple";
  return "amber";
}

function apiScheduleStatus(status?: "LIVE" | "UPCOMING" | "ENDED") {
  if (status === "LIVE") return "live";
  if (status === "ENDED") return "closed";
  return "ready";
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

function singleQrLabels(
  t: ReturnType<typeof useTranslations<"details">>,
  type: "event" | "meeting",
) {
  return {
    title: type === "event" ? t("singleEventQr") : t("singleMeetingQr"),
    generating: t("generatingQr"),
    loading: t("loadingQr"),
    download: t("downloadQr"),
  };
}
