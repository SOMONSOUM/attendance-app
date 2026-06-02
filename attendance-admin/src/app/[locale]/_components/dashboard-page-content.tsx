"use client";

import {
  Activity,
  CalendarPlus,
  CheckCircle2,
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
import { PageSkeleton, TableSkeleton } from "@/components/admin/loading-skeletons";
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
  listMeetings,
  meetingKeys,
  type EventRecord,
  type MeetingRecord,
} from "@/lib/admin-data";
import { formatDate } from "@/lib/format";

type DashboardSession = {
  id: string;
  kind: "event" | "meeting";
  name: string;
  mode: string;
  startsAt: string;
  endsAt: string;
  totalUsers: number;
  checkedIn: number;
  hasQr: boolean;
};

export function DashboardPageContent() {
  const t = useTranslations("dashboard");
  const common = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const eventsQuery = useQuery({
    queryKey: eventKeys.all,
    queryFn: () => listEvents({ pageSize: 100 }),
  });
  const meetingsQuery = useQuery({
    queryKey: meetingKeys.all,
    queryFn: () => listMeetings({ pageSize: 100 }),
  });
  const events = eventsQuery.data?.items ?? [];
  const meetings = meetingsQuery.data?.items ?? [];
  const sessions = [
    ...events.map((event) => eventSession(event)),
    ...meetings.map((meeting) => meetingSession(meeting)),
  ].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );
  const liveSessions = sessions.filter((session) => sessionPhase(session) === "live");
  const upcomingSessions = sessions.filter(
    (session) => sessionPhase(session) === "ready",
  );
  const totalExpected = sessions.reduce(
    (sum, session) => sum + session.totalUsers,
    0,
  );
  const checkedIn = sessions.reduce(
    (sum, session) => sum + session.checkedIn,
    0,
  );
  const remaining = Math.max(totalExpected - checkedIn, 0);
  const joinRate = totalExpected ? Math.round((checkedIn / totalExpected) * 100) : 0;
  const nextSessions = [...liveSessions, ...upcomingSessions]
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .slice(0, 5);
  const isLoading = eventsQuery.isLoading || meetingsQuery.isLoading;

  return (
    <AdminShell
      active="Dashboard"
      title={t("title")}
      description={t("description")}
      action={
        <>
          <Button asChild>
            <a href={`/${locale}/events`}>
              <CalendarPlus size={16} />
              {t("createEvent")}
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/${locale}/meetings`}>
              <Users size={16} />
              Create meeting
            </a>
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-5">
          <PageSkeleton />
          <TableShell>
            <TableSkeleton columns={6} rows={8} />
          </TableShell>
        </div>
      ) : (
      <div className="space-y-5">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
          <Card>
            <CardHeader className="border-b border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Attendance overview</CardTitle>
                  <p className="mt-1 text-sm text-muted-fg">
                    Live progress across event and meeting workflows.
                  </p>
                </div>
                <StatusPill tone={liveSessions.length ? "green" : "blue"}>
                  {liveSessions.length} live
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
                  detail={`${events.length} events / ${meetings.length} meetings`}
                  icon={Users}
                />
                <OverviewMetric
                  label="Join rate"
                  value={`${joinRate}%`}
                  detail={`${sessions.length} total sessions`}
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
              <MixRow label="Live sessions" value={liveSessions.length} icon={Activity} />
              <MixRow label="Events" value={events.length} icon={CalendarPlus} />
              <MixRow label="Meetings" value={meetings.length} icon={Users} />
              <MixRow
                label="Sessions with QR"
                value={sessions.filter((session) => session.hasQr).length}
                icon={QrCode}
              />
            </CardContent>
          </Card>
        </section>

        <section>
          <TableShell>
            <SectionToolbar title="Events and meetings needing attention" />
            {nextSessions.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nextSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="font-medium">{session.name}</div>
                        <div className="text-xs text-muted-fg">
                          {registrationModeLabel(session.mode, common)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={session.kind === "meeting" ? "blue" : "purple"}>
                          {session.kind === "meeting" ? "Meeting" : "Event"}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {formatDate(session.startsAt)}
                      </TableCell>
                      <TableCell>
                        <ProgressText session={session} />
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={sessionTone(session)}>
                          {sessionStatus(session, common)}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No active schedule"
                text="Create or schedule an event or meeting to start tracking attendance."
              />
            )}
          </TableShell>
        </section>

        <TableShell>
          <SectionToolbar title="Recent events and meetings" />
          <Table>
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{t("registrationMode")}</TableHead>
                <TableHead>{t("schedule")}</TableHead>
                <TableHead>{t("attendance")}</TableHead>
                <TableHead>{common("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 8).map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>
                    <StatusPill tone={session.kind === "meeting" ? "blue" : "purple"}>
                      {session.kind === "meeting" ? "Meeting" : "Event"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {registrationModeLabel(session.mode, common)}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {formatDate(session.startsAt)}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {session.checkedIn}/{session.totalUsers}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={sessionTone(session)}>
                      {sessionStatus(session, common)}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!sessions.length ? (
            <EmptyState
              title="No schedule yet"
              text="Create your first event or meeting to see dashboard activity."
            />
          ) : null}
        </TableShell>
      </div>
      )}
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

function ProgressText({ session }: { session: DashboardSession }) {
  const total = session.totalUsers;
  const checkedIn = session.checkedIn;
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

function sessionStatus(
  session: { startsAt: string; endsAt: string },
  t: ReturnType<typeof useTranslations<"common">>,
) {
  const now = Date.now();
  if (new Date(session.startsAt).getTime() > now) return t("ready");
  if (new Date(session.endsAt).getTime() < now) return t("closed");
  return t("live");
}

function sessionTone(session: { startsAt: string; endsAt: string }) {
  const status = sessionPhase(session);
  if (status === "live") return "green";
  if (status === "ready") return "purple";
  return "amber";
}

function sessionPhase(session: { startsAt: string; endsAt: string }) {
  const now = Date.now();
  if (new Date(session.startsAt).getTime() > now) return "ready";
  if (new Date(session.endsAt).getTime() < now) return "closed";
  return "live";
}

function eventSession(event: EventRecord): DashboardSession {
  return {
    id: `event-${event.id}`,
    kind: "event",
    name: event.name,
    mode: event.mode,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    totalUsers: event.summary?.totalUsers ?? event._count?.registrations ?? 0,
    checkedIn: event.summary?.checkedIn ?? event._count?.attendances ?? 0,
    hasQr:
      Boolean(event.qrCodes?.length) ||
      Boolean(event.places?.some((place) => place.qrCodes?.length)),
  };
}

function meetingSession(meeting: MeetingRecord): DashboardSession {
  const participants = meeting.participants ?? [];
  return {
    id: `meeting-${meeting.id}`,
    kind: "meeting",
    name: meeting.name,
    mode: meeting.mode,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    totalUsers: meeting._count?.participants ?? participants.length,
    checkedIn: participants.filter((participant) => participant.status === "JOINED")
      .length,
    hasQr:
      Boolean(meeting.qrCodes?.length) ||
      Boolean(meeting.places?.some((place) => place.qrCodes?.length)),
  };
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
