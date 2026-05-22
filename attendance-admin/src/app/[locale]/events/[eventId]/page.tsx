"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  RotateCcw,
  UserCheck,
  Users,
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
  eventKeys,
  getEventQr,
  joinRegisteredAttendee,
  listEventRoster,
  listEvents,
  type EventRosterRecord,
} from "@/lib/admin-data";
import {
  EventDetailsCard,
  LocationRequirementBadge,
  MetricCard,
  PlacesEmptyState,
  QrPlaceCard,
  SingleQrCard,
  buildCoordinates,
} from "./_components/event-detail-components";

const ALL = "all";
const DEFAULT_PAGE_SIZE = 10;

export default function EventDetailPage() {
  const params = useParams<{ locale: string; eventId: string }>();
  const searchParams = useSearchParams();
  const locale = params.locale ?? "en";
  const eventId = params.eventId;
  const selectedPlaceId = searchParams.get("placeId") ?? ALL;
  const queryClient = useQueryClient();
  const [department, setDepartment] = useState(ALL);
  const [position, setPosition] = useState(ALL);
  const [gender, setGender] = useState(ALL);
  const [shift, setShift] = useState(ALL);
  const [joinStatus, setJoinStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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
          matchesFilter(row.department, department) &&
          matchesFilter(row.position, position) &&
          matchesFilter(row.gender, gender) &&
          matchesFilter(row.shiftName, shift) &&
          matchesJoinStatus(row, joinStatus),
      ),
    [scopedRows, department, position, gender, shift, joinStatus],
  );
  const totalPages = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [department, position, gender, shift, joinStatus, pageSize, selectedPlaceId]);

  const departmentOptions = useMemo(
    () => uniqueValues(scopedRows.map((row) => row.department)),
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

  return (
    <AdminShell
      active="Events"
      title={
        selectedPlace
          ? `${selectedPlace.name} overview`
          : event?.name ?? "Event overview"
      }
      description={
        event
          ? selectedPlace
            ? `${event.name}, ${selectedPlace.locationName || event.locationName}`
            : `${event.mode.replace("_", " ")} event, ${formatDateRange(event.startsAt, event.endsAt)}`
          : "Event attendance overview and check-in breakdown."
      }
      action={
        <Button asChild variant="outline">
          <Link href={`/${locale}/events`}>
            <ArrowLeft size={16} />
            Back to events
          </Link>
        </Button>
      }
    >
      {eventsQuery.isLoading || rosterQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-fg">
          Loading event overview...
        </div>
      ) : !event ? (
        <EmptyState
          title="Event not found"
          text="This event may have been deleted or you may not have access."
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={event.separateQrByPlace ? "purple" : "blue"}>
              {event.separateQrByPlace ? "By place" : "Single QR"}
            </StatusPill>
            <StatusPill tone={eventTone(event)}>{eventStatus(event)}</StatusPill>
            <LocationRequirementBadge required={event.requireLocation} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={selectedPlace ? "Place users" : "All users"}
              value={String(scopedRows.length)}
              sub={`${notYetRows.length} not yet joined`}
              icon={Users}
            />
            <MetricCard
              label="Joined"
              value={String(joinedRows.length)}
              sub={`${joinRate}% coverage`}
              icon={UserCheck}
            />
            <MetricCard
              label="Filtered users"
              value={String(filteredRows.length)}
              sub="Matching the current table"
              icon={BarChart3}
            />
            <MetricCard
              label="Latest join"
              value={latestJoinTime(joinedRows)}
              sub="Most recent check-in"
              icon={Clock}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
            <EventDetailsCard
              name={selectedPlace?.name ?? event.name}
              description={event.description}
              locationName={selectedPlace?.locationName || event.locationName}
              requireLocation={event.requireLocation}
              coordinates={detailCoordinates}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              shifts={event.shifts}
            />

            <Card>
              <SectionToolbar
                title={
                  event.separateQrByPlace
                    ? selectedPlace
                      ? `${selectedPlace.name} QR and stats`
                      : "Places and QR codes"
                    : "Event QR"
                }
              >
                {selectedPlace ? (
                  <Button asChild variant="outline" className="h-8">
                    <Link href={`/${locale}/events/${event.id}`}>All places</Link>
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
                          qrImage={place.qr?.qrImage}
                          fileName={`${event.name}-${place.name}.png`}
                          href={`/${locale}/events/${event.id}?placeId=${place.id}`}
                          requireLocation={event.requireLocation}
                          coordinates={place.coordinates}
                          showView={!selectedPlace}
                        />
                      ))
                  ) : (
                    <PlacesEmptyState />
                  )
                ) : (
                  <SingleQrCard
                    name={event.name}
                    code={qrQuery.data?.code}
                    qrImage={qrQuery.data?.qrImage}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="grid gap-3 p-4 xl:grid-cols-6">
              <FilterSelect
                label="Department"
                value={department}
                values={departmentOptions}
                onChange={setDepartment}
              />
              <FilterSelect
                label="Position"
                value={position}
                values={positionOptions}
                onChange={setPosition}
              />
              <FilterSelect
                label="Gender"
                value={gender}
                values={genderOptions}
                onChange={setGender}
              />
              <FilterSelect
                label="Shift"
                value={shift}
                values={shiftOptions}
                onChange={setShift}
              />
              <label className="grid gap-2 text-sm font-medium">
                Joined status
                <Select
                  value={joinStatus}
                  onChange={(event) => setJoinStatus(event.target.value)}
                >
                  <option value={ALL}>All statuses</option>
                  <option value="joined">Joined</option>
                  <option value="not-yet">Not yet</option>
                </Select>
              </label>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setDepartment(ALL);
                    setPosition(ALL);
                    setGender(ALL);
                    setShift(ALL);
                    setJoinStatus(ALL);
                  }}
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <TableShell>
            <SectionToolbar
              title={
                selectedPlace ? `${selectedPlace.name} users` : "All users in this event"
              }
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-fg">
                  {filteredRows.length} users
                </span>
                <Select
                  className="h-8 w-28"
                  value={String(pageSize)}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </Select>
              </div>
            </SectionToolbar>
            {pageRows.length ? (
              <>
                <Table className="min-w-230">
                  <TableHeader>
                    <TableRow className="border-t-0">
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Gender</TableHead>
                      {event.separateQrByPlace ? <TableHead>Place</TableHead> : null}
                      <TableHead>Shift</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Joined time</TableHead>
                      <TableHead>Action</TableHead>
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
                          {row.department ?? "-"}
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
                            {row.joined ? "Joined" : "Not yet"}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-muted-fg">
                          {row.joinedAt
                            ? new Date(row.joinedAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {row.joined && row.attendanceId ? (
                            <Button
                              variant="outline"
                              className="h-8"
                              disabled={cancelMutation.isPending}
                              onClick={() =>
                                cancelMutation.mutate(row.attendanceId!)
                              }
                            >
                              Cancel join
                            </Button>
                          ) : row.registrationId ? (
                            <Button
                              className="h-8"
                              disabled={joinMutation.isPending}
                              onClick={() =>
                                joinMutation.mutate(row.registrationId!)
                              }
                            >
                              Join event
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
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((value) => Math.max(value - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((value) => Math.min(value + 1, totalPages))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="No users match"
                text="Change the filters or add registrations for this event."
              />
            )}
          </TableShell>
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
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={ALL}>All {label.toLowerCase()}</option>
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

  return latest
    ? new Date(latest).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
}

function refreshEventData(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["event-roster", eventId] });
  queryClient.invalidateQueries({ queryKey: eventKeys.all });
}

function formatDateRange(startsAt: string, endsAt: string) {
  return `${new Date(startsAt).toLocaleString()} - ${new Date(endsAt).toLocaleString()}`;
}

function eventStatus(event: { startsAt: string; endsAt: string }) {
  const now = Date.now();
  if (new Date(event.startsAt).getTime() > now) return "Ready";
  if (new Date(event.endsAt).getTime() < now) return "Closed";
  return "Live";
}

function eventTone(event: { startsAt: string; endsAt: string }) {
  const status = eventStatus(event);
  if (status === "Live") return "green";
  if (status === "Ready") return "purple";
  return "amber";
}
