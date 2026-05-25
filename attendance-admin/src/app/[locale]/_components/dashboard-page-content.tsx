"use client";

import { CalendarPlus, Clock, Download, QrCode, RefreshCw, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AdminShell,
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
import { eventKeys, listEvents, listUsers } from "@/lib/admin-data";

export function DashboardPageContent() {
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
  const totalUsers = events.reduce(
    (sum, event) => sum + (event.summary?.totalUsers ?? 0),
    0,
  );
  const checkedIn = events.reduce(
    (sum, event) => sum + (event.summary?.checkedIn ?? 0),
    0,
  );
  const activeEvents = events.filter((event) => eventStatus(event) === "Live");
  const upcomingEvents = events.filter((event) => eventStatus(event) === "Ready");
  const averageJoinRate = events.length
    ? Math.round(
        events.reduce((sum, event) => sum + (event.summary?.joinRate ?? 0), 0) /
          events.length,
      )
    : 0;
  const needsAttention = events
    .filter((event) => eventStatus(event) === "Live" && (event.summary?.checkedIn ?? 0) === 0)
    .length;
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

  const metrics = [
    {
      label: "Live events",
      value: String(activeEvents.length),
      sub: `${upcomingEvents.length} upcoming`,
      icon: Clock,
    },
    {
      label: "Expected people",
      value: String(totalUsers),
      sub: "Registered or joined",
      icon: Users,
    },
    {
      label: "Recent check-ins",
      value: String(recentAttendances.length),
      sub: `${checkedIn} all-time check-ins`,
      icon: QrCode,
    },
    {
      label: "Avg join rate",
      value: `${averageJoinRate}%`,
      sub: needsAttention ? `${needsAttention} live event needs activity` : "All live events active",
      icon: RefreshCw,
    },
  ];

  return (
    <AdminShell
      active="Dashboard"
      title="Good morning, Admin"
      description="Operational overview for live events, check-ins, and attendee progress."
      action={
        <Button asChild>
          <a href="/en/events">
            <CalendarPlus size={16} />
            Create event
          </a>
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <CardContent className="p-4">
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm font-medium">{metric.label}</p>
                    <span className="grid size-7 place-items-center rounded-md border border-border bg-background text-muted-fg">
                      <Icon size={14} />
                    </span>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">{metric.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance coverage</CardTitle>
              <Button variant="outline" className="h-8">
                <RefreshCw size={14} />
                Live
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid h-64 grid-cols-[42px_1fr] gap-4">
                <div className="flex flex-col justify-between py-2 text-xs text-muted-fg">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                <div className="flex items-end justify-between gap-3 border-l border-border pl-4">
                  {events.slice(0, 6).map((event) => {
                    const height = Math.max(event.summary?.joinRate ?? 0, 8);
                    return (
                      <div
                        key={event.id}
                        className="flex min-w-16 flex-1 flex-col items-center gap-3"
                      >
                        <div
                          className="w-full rounded-t-lg bg-primary shadow-soft"
                          style={{ height: `${height}%` }}
                        />
                        <span className="max-w-24 truncate text-xs text-muted-fg">
                          {event.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MixRow
                label="Events with QR"
                value={events.filter((event) => event.qrCodes?.length).length}
              />
              <MixRow label="Expected people" value={totalUsers} />
              <MixRow label="Checked in" value={checkedIn} />
              <MixRow
                label="Admin users"
                value={
                  users.filter((user) =>
                    user.roles.some((item) => item.role.name === "admin"),
                  ).length
                }
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent check-ins</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
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
                    {new Date(attendance.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-fg">
                No recent check-ins yet.
              </p>
            )}
          </CardContent>
        </Card>

        <TableShell>
          <SectionToolbar title="Recent events">
            <Button variant="outline" className="h-8">
              <Download size={14} />
              Export
            </Button>
          </SectionToolbar>
          <Table>
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>Event name</TableHead>
                <TableHead>Registration mode</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell className="text-muted-fg">
                    {registrationModeLabel(event.mode)}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {new Date(event.startsAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {event.summary?.checkedIn ?? 0}/{event.summary?.totalUsers ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={eventTone(event)}>
                      {eventStatus(event)}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </div>
    </AdminShell>
  );
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

function registrationModeLabel(mode: string) {
  if (mode === "OPEN_REGISTRATION") return "Open registration";
  if (mode === "PRE_REGISTRATION") return "Pre-registration";
  return "Bulk registration";
}


function MixRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
      <span className="size-2 rounded-full bg-primary" />
      <span className="flex-1 text-muted-fg">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
