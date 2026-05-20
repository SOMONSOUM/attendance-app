"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChartPie,
  Clock,
  Download,
  MapPin,
  QrCode,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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

const ALL = "all";
const DEFAULT_PAGE_SIZE = 10;

const attendanceConfig = {
  joined: {
    label: "Joined",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const barConfig = {
  value: {
    label: "Attendees",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const splitConfig = {
  joined: {
    label: "Joined",
    color: "var(--primary)",
  },
  notYet: {
    label: "Not yet",
    color: "var(--info)",
  },
} satisfies ChartConfig;

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
    queryFn: listEvents,
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

  const event = eventsQuery.data?.find((item) => item.id === eventId);
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
  const departmentGroups = useMemo(
    () => groupCounts(filteredRows, "department"),
    [filteredRows],
  );
  const positionGroups = useMemo(
    () => groupCounts(filteredRows, "position"),
    [filteredRows],
  );
  const genderGroups = useMemo(
    () => groupCounts(filteredRows, "gender"),
    [filteredRows],
  );
  const trendRows = useMemo(() => buildTrend(joinedRows), [joinedRows]);
  const splitRows = [
    {
      name: "Joined",
      key: "joined",
      value: joinedRows.length,
      fill: "var(--color-joined)",
    },
    {
      name: "Not yet",
      key: "notYet",
      value: notYetRows.length,
      fill: "var(--color-notYet)",
    },
  ];
  const joinRate = percentage(joinedRows.length, scopedRows.length);

  return (
    <AdminShell
      active="Events"
      title={event?.name ?? "Event overview"}
      description={
        event
          ? `${event.mode.replace("_", " ")} event, ${formatDateRange(event.startsAt, event.endsAt)}`
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

          {event.separateQrByPlace ? (
            <Card>
              <SectionToolbar
                title={
                  selectedPlace
                    ? `${selectedPlace.name} overview`
                    : "Places and QR codes"
                }
              >
                {selectedPlace ? (
                  <Button asChild variant="outline" className="h-8">
                    <Link href={`/${locale}/events/${event.id}`}>All places</Link>
                  </Button>
                ) : null}
              </SectionToolbar>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {event.places?.length ? (
                  event.places.map((place) => {
                    const placeRows = roster.filter(
                      (row) => row.placeId === place.id,
                    );
                    const joinedCount = placeRows.filter((row) => row.joined).length;
                    const qr = qrQuery.data?.qrCodes?.find(
                      (item) => item.placeId === place.id,
                    );

                    return (
                      <div
                        className="grid gap-3 rounded-md border border-border bg-background p-4"
                        key={place.id ?? place.name}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{place.name}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-fg">
                              <MapPin size={12} />
                              {place.locationName || "Location not set"}
                            </p>
                          </div>
                          <span className="grid size-8 place-items-center rounded-md border border-border text-muted-fg">
                            <QrCode size={16} />
                          </span>
                        </div>
                        {place.description ? (
                          <p className="line-clamp-2 text-sm text-muted-fg">
                            {place.description}
                          </p>
                        ) : null}
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <Stat label="Users" value={placeRows.length} />
                          <Stat label="Joined" value={joinedCount} />
                          <Stat
                            label="Rate"
                            value={`${percentage(joinedCount, placeRows.length)}%`}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild className="h-8">
                            <Link
                              href={`/${locale}/events/${event.id}?placeId=${place.id}`}
                            >
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8"
                            disabled={!qr?.qrImage}
                            onClick={() =>
                              qr?.qrImage
                                ? downloadDataUrl(
                                    qr.qrImage,
                                    `${event.name}-${place.name}.png`,
                                  )
                                : undefined
                            }
                          >
                            <Download size={14} />
                            QR
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    title="No places configured"
                    text="Add places to this event to generate room-specific QR codes."
                  />
                )}
              </CardContent>
            </Card>
          ) : null}

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

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
            <Card className="min-w-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Join activity</CardTitle>
                <Button variant="outline" className="h-8">
                  <CalendarDays size={14} />
                  Timeline
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={attendanceConfig}
                  className="h-72 w-full"
                >
                  <AreaChart data={trendRows} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Area
                      dataKey="joined"
                      type="natural"
                      fill="var(--color-joined)"
                      fillOpacity={0.28}
                      stroke="var(--color-joined)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Joined split</CardTitle>
                <StatusPill tone={eventTone(event)}>{eventStatus(event)}</StatusPill>
              </CardHeader>
              <CardContent>
                <ChartContainer config={splitConfig} className="mx-auto h-72">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={splitRows}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {splitRows.map((row) => (
                        <Cell key={row.key} fill={row.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="outside"
                        className="fill-muted-fg"
                        fontSize={12}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <BreakdownChart title="Departments" rows={departmentGroups} />
            <BreakdownChart title="Positions" rows={positionGroups} />
            <BreakdownChart title="Gender" rows={genderGroups} />
          </div>

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

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Users;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="p-4">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <span className="grid size-7 place-items-center rounded-md border border-border bg-background text-muted-fg">
            <Icon size={14} />
          </span>
        </div>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-fg">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="text-xs text-muted-fg">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
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

function BreakdownChart({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  const data = rows.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={barConfig} className="h-64 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={86}
              />
              <XAxis dataKey="value" type="number" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  className="fill-muted-fg"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-fg">
            No data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => cleanValue(value)))).sort();
}

function groupCounts(
  rows: EventRosterRecord[],
  key: "department" | "position" | "gender",
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = cleanValue(row[key]);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function buildTrend(rows: EventRosterRecord[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.joinedAt) continue;
    const date = new Date(row.joinedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const data = Array.from(counts.entries()).map(([date, joined]) => ({
    date,
    joined,
  }));

  return data.length ? data : [{ date: "No joins", joined: 0 }];
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

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^\w.-]+/g, "-").toLowerCase();
  link.click();
}
