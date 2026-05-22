"use client";

import { useMemo, useState } from "react";
import { Download, ListFilter, Users } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { PaginationFooter, paginate } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  eventKeys,
  listAttendance,
  listEvents,
  listMeetings,
  meetingKeys,
  type AttendanceRecord,
  type MeetingParticipant,
  type MeetingPlace,
} from "@/lib/admin-data";

type SourceType = "ALL" | "EVENT" | "MEETING";

type AttendanceLog = {
  id: string;
  sourceKey: string;
  sourceType: Exclude<SourceType, "ALL">;
  sourceName: string;
  placeName: string;
  fullNameEn: string;
  department?: string | null;
  checkInAt: string;
  status: "JOINED" | "CANCELLED";
};

const ALL = "ALL";
const PAGE_SIZE = 10;
const todayInputValue = toDateInput(new Date());

export default function AttendancePage() {
  const [sourceType, setSourceType] = useState<SourceType>(ALL);
  const [sourceKey, setSourceKey] = useState(ALL);
  const [date, setDate] = useState(todayInputValue);
  const [page, setPage] = useState(1);
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
  const attendanceQueries = useQueries({
    queries: events.map((event) => ({
      queryKey: ["attendance", event.id],
      queryFn: () => listAttendance(event.id, { pageSize: 100 }),
      enabled: Boolean(event.id),
    })),
  });

  const eventLogs = useMemo(
    () =>
      events.flatMap((event, index) =>
        (attendanceQueries[index]?.data?.items ?? []).map((row) => ({
          id: row.id,
          sourceKey: sourceOptionKey("EVENT", event.id),
          sourceType: "EVENT" as const,
          sourceName: event.name,
          placeName: row.placeName ?? placeName(event.places, row.placeId),
          fullNameEn: row.fullNameEn,
          department: row.department,
          checkInAt: row.createdAt,
          status: row.status,
        })),
      ),
    [attendanceQueries, events],
  );
  const meetingLogs = useMemo(
    () =>
      meetings.flatMap((meeting) =>
        meeting.participants
          .filter((participant) => participant.status === "JOINED" && participant.joinedAt)
          .map((participant) =>
            meetingLogFromParticipant(
              participant,
              meeting.id,
              meeting.name,
              meeting.places,
            ),
          ),
      ),
    [meetings],
  );
  const logs = useMemo(
    () =>
      [...eventLogs, ...meetingLogs].sort(
        (a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime(),
      ),
    [eventLogs, meetingLogs],
  );
  const sourceOptions = useMemo(
    () => [
      ...events
        .filter(() => sourceType === ALL || sourceType === "EVENT")
        .map((event) => ({
          key: sourceOptionKey("EVENT", event.id),
          label: event.name,
          type: "Event",
        })),
      ...meetings
        .filter(() => sourceType === ALL || sourceType === "MEETING")
        .map((meeting) => ({
          key: sourceOptionKey("MEETING", meeting.id),
          label: meeting.name,
          type: "Meeting",
        })),
    ],
    [events, meetings, sourceType],
  );
  const filteredLogs = logs.filter(
    (row) =>
      (sourceType === ALL || row.sourceType === sourceType) &&
      (sourceKey === ALL || row.sourceKey === sourceKey) &&
      sameInputDate(row.checkInAt, date),
  );
  const isLoading =
    eventsQuery.isLoading ||
    meetingsQuery.isLoading ||
    attendanceQueries.some((query) => query.isLoading);
  const eventCount = filteredLogs.filter((row) => row.sourceType === "EVENT").length;
  const meetingCount = filteredLogs.filter((row) => row.sourceType === "MEETING").length;
  const pageLogs = paginate(filteredLogs, page, PAGE_SIZE);

  function changeSourceType(nextType: SourceType) {
    setSourceType(nextType);
    setSourceKey(ALL);
    setPage(1);
  }

  return (
    <AdminShell
      active="Attendance"
      title="Attendance"
      description="Audit event and meeting check-ins, scan time, and attendee status."
      action={
        <Button>
          <Download size={16} />
          Export logs
        </Button>
      }
    >
      <div className="space-y-5 pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total check-ins" value={filteredLogs.length} />
          <MetricCard label="Event check-ins" value={eventCount} />
          <MetricCard label="Meeting check-ins" value={meetingCount} />
        </div>

        <TableShell>
        <SectionToolbar title="Live attendance logs">
          <Input
            className="h-8 w-40"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
          />
          <Select
            className="h-8 w-36"
            value={sourceType}
            onChange={(event) => changeSourceType(event.target.value as SourceType)}
          >
            <option value={ALL}>All types</option>
            <option value="EVENT">Events</option>
            <option value="MEETING">Meetings</option>
          </Select>
          <Select
            className="h-8 min-w-60"
            value={sourceKey}
            onChange={(event) => {
              setSourceKey(event.target.value);
              setPage(1);
            }}
          >
            <option value={ALL}>All sources</option>
            {sourceOptions.map((source) => (
              <option key={source.key} value={source.key}>
                {source.type}: {source.label}
              </option>
            ))}
          </Select>
          <Button variant="outline" className="h-8">
            <Users size={14} />
            {filteredLogs.length} checked in
          </Button>
        </SectionToolbar>
        {isLoading ? (
          <div className="p-5 text-sm text-muted-fg">Loading attendance...</div>
        ) : filteredLogs.length ? (
          <>
          <Table className="min-w-245">
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>Attendee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Place</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Check-in time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageLogs.map((row) => (
                <TableRow key={`${row.sourceType}-${row.id}`}>
                  <TableCell className="font-medium">{row.fullNameEn}</TableCell>
                  <TableCell>
                    <StatusPill tone={row.sourceType === "MEETING" ? "purple" : "blue"}>
                      {row.sourceType === "MEETING" ? "Meeting" : "Event"}
                    </StatusPill>
                  </TableCell>
                  <TableCell>{row.sourceName}</TableCell>
                  <TableCell className="text-muted-fg">{row.placeName}</TableCell>
                  <TableCell className="text-muted-fg">
                    {row.department ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {new Date(row.checkInAt).toLocaleString()}
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
          <PaginationFooter
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={filteredLogs.length}
            onPageChange={setPage}
          />
          </>
        ) : (
          <EmptyState
            title="No attendance yet"
            text="Check-ins for the selected date, event, or meeting will appear here."
          />
        )}
        </TableShell>
      </div>
    </AdminShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span className="grid size-7 place-items-center rounded-md border border-border text-muted-fg">
          <ListFilter size={14} />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function meetingLogFromParticipant(
  participant: MeetingParticipant,
  meetingId: string,
  meetingName: string,
  places?: MeetingPlace[],
): AttendanceLog {
  return {
    id: participant.id ?? `${meetingId}-${participant.fullNameEn}`,
    sourceKey: sourceOptionKey("MEETING", meetingId),
    sourceType: "MEETING",
    sourceName: meetingName,
    placeName: placeName(places, participant.placeId),
    fullNameEn: participant.fullNameEn,
    department: participant.department,
    checkInAt: participant.joinedAt!,
    status: participant.status === "CANCELLED" ? "CANCELLED" : "JOINED",
  };
}

function sourceOptionKey(type: Exclude<SourceType, "ALL">, id: string) {
  return `${type}:${id}`;
}

function sameInputDate(value: string, inputDate: string) {
  return toDateInput(new Date(value)) === inputDate;
}

function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function placeName(
  places: Array<{ id?: string; name: string }> | undefined,
  placeId?: string | null,
) {
  if (!placeId) return "All places";
  return places?.find((place) => place.id === placeId)?.name ?? "Unknown place";
}
