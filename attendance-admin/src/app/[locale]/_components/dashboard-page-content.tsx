"use client";

import { CalendarPlus, Download, QrCode, RefreshCw } from "lucide-react";
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
    queryFn: listEvents,
  });
  const usersQuery = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: listUsers,
  });
  const events = eventsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const registrations = events.reduce(
    (sum, event) => sum + (event._count?.registrations ?? 0),
    0,
  );
  const checkedIn = events.reduce(
    (sum, event) => sum + (event._count?.attendances ?? 0),
    0,
  );
  const joinRate = registrations
    ? Math.round((checkedIn / registrations) * 100)
    : 0;

  const metrics = [
    { label: "Events", value: String(events.length), sub: "Loaded from MySQL" },
    { label: "Users", value: String(users.length), sub: "Login accounts" },
    { label: "Checked in", value: String(checkedIn), sub: "Attendance rows" },
    {
      label: "Join rate",
      value: `${joinRate}%`,
      sub: `${registrations} registrations`,
    },
  ];

  return (
    <AdminShell
      active="Dashboard"
      title="Good morning, Admin"
      description="Live database overview for events, users, registrations, and attendance."
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
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <span className="grid size-7 place-items-center rounded-md border border-border bg-background text-muted-fg">
                    <QrCode size={14} />
                  </span>
                </div>
                <p className="text-3xl font-semibold tracking-tight">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-muted-fg">{metric.sub}</p>
              </CardContent>
            </Card>
          ))}
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
                    const total = event._count?.registrations ?? 0;
                    const joined = event._count?.attendances ?? 0;
                    const height = total
                      ? Math.max((joined / total) * 100, 8)
                      : 8;
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
              <CardTitle>Database health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MixRow
                label="Events with QR"
                value={events.filter((event) => event.qrCodes?.length).length}
              />
              <MixRow label="Registrations" value={registrations} />
              <MixRow label="Attendance rows" value={checkedIn} />
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

        <TableShell>
          <SectionToolbar title="Recent events">
            <Button variant="outline" className="h-8">
              <Download size={14} />
              Export
            </Button>
          </SectionToolbar>
          <Table className="min-w-190">
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
                    {event.mode.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {new Date(event.startsAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {event._count?.attendances ?? 0}/
                    {event._count?.registrations ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone="green">Synced</StatusPill>
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

function MixRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
      <span className="size-2 rounded-full bg-primary" />
      <span className="flex-1 text-muted-fg">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
