"use client";

import { useEffect, useState } from "react";
import { Download, LocateFixed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { eventKeys, listAttendance, listEvents } from "@/lib/admin-data";

export default function AttendancePage() {
  const eventsQuery = useQuery({
    queryKey: eventKeys.all,
    queryFn: listEvents,
  });
  const events = eventsQuery.data ?? [];
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    if (!eventId && events[0]) setEventId(events[0].id);
  }, [eventId, events]);

  const attendanceQuery = useQuery({
    queryKey: ["attendance", eventId],
    queryFn: () => listAttendance(eventId),
    enabled: Boolean(eventId),
  });
  const selectedEvent = events.find((event) => event.id === eventId);
  const rows = attendanceQuery.data ?? [];

  return (
    <AdminShell
      active="Attendance"
      title="Attendance"
      description="Audit check-ins, location distance, scan time, and attendee status from the database."
      action={
        <Button>
          <Download size={16} />
          Export logs
        </Button>
      }
    >
      <TableShell>
        <SectionToolbar title="Live attendance logs">
          <Select
            className="h-8"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" className="h-8">
            <LocateFixed size={14} />
            {selectedEvent ? `${selectedEvent.radiusMeters}m range` : "Range"}
          </Button>
        </SectionToolbar>
        {attendanceQuery.isLoading ? (
          <div className="p-5 text-sm text-muted-fg">Loading attendance...</div>
        ) : rows.length ? (
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>Attendee</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Check-in time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.fullNameEn}</TableCell>
                  <TableCell>
                    {selectedEvent?.name ?? row.eventId}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {row.department ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {row.distanceMeters}m
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      tone={row.status === "JOINED" ? "green" : "amber"}
                    >
                      {row.status}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No attendance yet"
            text="Check-ins for the selected event will appear here."
          />
        )}
      </TableShell>
    </AdminShell>
  );
}
