"use client";

import {
  Activity,
  CalendarPlus,
  CheckCircle2,
  Clock,
  QrCode,
  TrendingUp,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  eventKeys,
  listEvents,
  listUsers,
  type EventRecord,
  type UserRecord,
} from "@/lib/admin-data";
import { formatDate, formatTime } from "@/lib/format";

export function DashboardPageContent() {
  const t = useTranslations("dashboard");
  const common = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const eventsQuery = useQuery({
    queryKey: eventKeys.all,
    queryFn: () => listEvents({ pageSize: 100 }),
  });
  const usersQuery = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => listUsers({ pageSize: 100 }),
  });
  const events = eventsQuery.data?.items ?? [];
  const users = usersQuery.data?.items ?? [];
  const liveEvents = events.filter((event) => eventPhase(event) === "live");
  const upcomingEvents = events.filter((event) => eventPhase(event) === "ready");
  const closedEvents = events.filter((event) => eventPhase(event) === "closed");
  const totalExpected = events.reduce(
    (sum, event) => sum + (event.summary?.totalUsers ?? 0),
    0,
  );
  const checkedIn = events.reduce(
    (sum, event) => sum + (event.summary?.checkedIn ?? 0),
    0,
  );
  const remaining = Math.max(totalExpected - checkedIn, 0);
  const joinRate = totalExpected ? Math.round((checkedIn / totalExpected) * 100) : 0;
  const recentAttendances = events
    .flatMap((event) =>
      (event.recentAttendances ?? []).map((attendance) => ({
        ...attendance,
        eventName: event.name,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);
  const nextEvents = [...liveEvents, ...upcomingEvents]
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .slice(0, 5);

  return (
    <AdminShell
      active="Dashboard"
      title={t("title")}
      description={t("description")}
      action={
        <Button asChild>
          <a href={`/${locale}/events`}>
            <CalendarPlus size={16} />
            {t("createEvent")}
          </a>
        </Button>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
          <Card>
            <CardHeader className="border-b border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Attendance overview</CardTitle>
                  <p className="mt-1 text-sm text-muted-fg">
                    Live progress across active and recent event workflows.
                  </p>
                </div>
                <StatusPill tone={liveEvents.length ? "green" : "blue"}>
                  {liveEvents.length} live
                </StatusPill>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <OverviewMetric
                  label="Checked in"
                  value={checkedIn}
                  detail={`${remaining} remaining`}
                  icon={CheckCircle2}
                />
                <OverviewMetric
                  label="Expected"
                  value={totalExpected}
                  detail={`${users.length} admin users`}
                  icon={Users}
                />
                <OverviewMetric
                  label="Join rate"
                  value={`${joinRate}%`}
                  detail={`${events.length} total events`}
                  icon={TrendingUp}
                />
              </div>
              <div className="grid gap-2">
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(joinRate, 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-fg">
                  <span>{checkedIn} joined</span>
                  <span>{totalExpected} expected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border p-4">
              <CardTitle>Operations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4">
              <MixRow label="Live events" value={liveEvents.length} icon={Activity} />
              <MixRow label="Upcoming events" value={upcomingEvents.length} icon={Clock} />
              <MixRow label="Closed events" value={closedEvents.length} icon={CheckCircle2} />
              <MixRow
                label="Events with QR"
                value={events.filter((event) => event.qrCodes?.length).length}
                icon={QrCode}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <TableShell>
            <SectionToolbar title="Events needing attention" />
            {nextEvents.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nextEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-xs text-muted-fg">
                          {registrationModeLabel(event.mode, common)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {formatDate(event.startsAt)}
                      </TableCell>
                      <TableCell>
                        <ProgressText event={event} />
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={eventTone(event)}>
                          {eventStatus(event, common)}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No active schedule"
                text="Create or schedule an event to start tracking attendance."
              />
            )}
          </TableShell>

          <Card>
            <CardHeader className="border-b border-border p-4">
              <CardTitle>{t("recentCheckIns")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 p-4">
              {recentAttendances.length ? (
                recentAttendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{attendance.fullNameEn}</p>
                      <p className="truncate text-xs text-muted-fg">
                        {attendance.eventName}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-fg">
                      {formatTime(attendance.createdAt)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-fg">
                  {t("noRecentCheckIns")}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <TableShell>
          <SectionToolbar title={t("recentEvents")} />
          <Table>
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>{t("eventName")}</TableHead>
                <TableHead>{t("registrationMode")}</TableHead>
                <TableHead>{t("schedule")}</TableHead>
                <TableHead>{t("attendance")}</TableHead>
                <TableHead>{common("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 8).map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell className="text-muted-fg">
                    {registrationModeLabel(event.mode, common)}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {formatDate(event.startsAt)}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {event.summary?.checkedIn ?? 0}/{event.summary?.totalUsers ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={eventTone(event)}>
                      {eventStatus(event, common)}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!events.length ? (
            <EmptyState
              title="No events yet"
              text="Create your first event to see dashboard activity."
            />
          ) : null}
        </TableShell>
      </div>
    </AdminShell>
  );
}

function OverviewMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-fg">{label}</span>
        <Icon size={16} className="text-muted-fg" />
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-fg">{detail}</div>
    </div>
  );
}

function ProgressText({ event }: { event: EventRecord }) {
  const total = event.summary?.totalUsers ?? 0;
  const checkedIn = event.summary?.checkedIn ?? 0;
  const rate = total ? Math.round((checkedIn / total) * 100) : 0;
  return (
    <div className="min-w-28">
      <div className="text-sm font-medium">
        {checkedIn}/{total}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

function eventStatus(
  event: { startsAt: string; endsAt: string },
  t: ReturnType<typeof useTranslations<"common">>,
) {
  const now = Date.now();
  if (new Date(event.startsAt).getTime() > now) return t("ready");
  if (new Date(event.endsAt).getTime() < now) return t("closed");
  return t("live");
}

function eventTone(event: { startsAt: string; endsAt: string }) {
  const status = eventPhase(event);
  if (status === "live") return "green";
  if (status === "ready") return "purple";
  return "amber";
}

function eventPhase(event: { startsAt: string; endsAt: string }) {
  const now = Date.now();
  if (new Date(event.startsAt).getTime() > now) return "ready";
  if (new Date(event.endsAt).getTime() < now) return "closed";
  return "live";
}

function registrationModeLabel(
  mode: string,
  t: ReturnType<typeof useTranslations<"common">>,
) {
  if (mode === "OPEN_REGISTRATION") return t("openRegistration");
  if (mode === "PRE_REGISTRATION") return t("preRegistration");
  return t("bulkRegistration");
}

function MixRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
      <span className="grid size-8 place-items-center rounded-md border border-border text-muted-fg">
        <Icon size={15} />
      </span>
      <span className="flex-1 text-sm text-muted-fg">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
