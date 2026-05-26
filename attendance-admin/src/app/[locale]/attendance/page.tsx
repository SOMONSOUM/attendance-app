"use client";

import { useMemo, useState } from "react";
import { Download, ListFilter, Users } from "lucide-react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  AdminShell,
  EmptyState,
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
  cancelAttendance,
  cancelMeetingParticipant,
  joinAttendeeByQrCode,
  joinMeetingParticipantByQrCode,
  listAttendance,
  listEvents,
  listMeetings,
  meetingKeys,
  type AttendanceRecord,
  type MeetingParticipant,
  type MeetingPlace,
} from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";

type SourceType = "ALL" | "EVENT" | "MEETING";

type AttendanceLog = {
  id: string;
  sourceKey: string;
  sourceType: Exclude<SourceType, "ALL">;
  sourceName: string;
  placeName: string;
  fullNameEn: string;
  fullNameKm?: string | null;
  department?: string | null;
  checkInAt: string;
  status: "JOINED" | "CANCELLED";
};

const ALL = "ALL";
const PAGE_SIZE = 10;
const todayInputValue = toDateInput(new Date());

export default function AttendancePage() {
  const common = useTranslations("common");
  const t = useTranslations("attendance");
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<SourceType>(ALL);
  const [sourceKey, setSourceKey] = useState(ALL);
  const [date, setDate] = useState(todayInputValue);
  const [scanCode, setScanCode] = useState("");
  const [search, setSearch] = useState("");
  const [scanType, setScanType] = useState<Exclude<SourceType, "ALL">>("EVENT");
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
  const scanMutation = useMutation<unknown, Error>({
    mutationFn: () =>
      scanType === "EVENT"
        ? joinAttendeeByQrCode(scanCode.trim())
        : joinMeetingParticipantByQrCode(scanCode.trim()),
    onSuccess: () => {
      setScanCode("");
      eventsQuery.refetch();
      meetingsQuery.refetch();
      attendanceQueries.forEach((query) => query.refetch());
    },
  });
  const cancelMutation = useMutation<unknown, Error, AttendanceLog>({
    mutationFn: (row: AttendanceLog) =>
      row.sourceType === "EVENT"
        ? cancelAttendance(row.id)
        : cancelMeetingParticipant(row.sourceKey.replace("MEETING:", ""), row.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      attendanceQueries.forEach((query) => query.refetch());
    },
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
          fullNameKm: row.fullNameKm,
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
      sameInputDate(row.checkInAt, date) &&
      matchesAttendanceSearch(row, search),
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
      title={t("title")}
      description={t("description")}
      action={
        <Button>
          <Download size={16} />
          {t("exportLogs")}
        </Button>
      }
    >
      <div className="space-y-5 pt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label={t("totalCheckIns")} value={filteredLogs.length} />
          <MetricCard label={t("eventCheckIns")} value={eventCount} />
          <MetricCard label={t("meetingCheckIns")} value={meetingCount} />
        </div>

        <TableShell>
        <div className="grid gap-4 border-b border-border bg-card p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">{t("liveLogs")}</h2>
              <p className="mt-1 text-sm text-muted-fg">
                {t("filterHint")}
              </p>
            </div>
            <Button variant="outline" className="h-9 w-fit">
              <Users size={14} />
              {t("checkedInCount", { count: filteredLogs.length })}
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-[160px_150px_minmax(240px,1fr)_minmax(220px,1fr)]">
            <Input
              className="h-9"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
            />
            <Select
              className="h-9"
              value={sourceType}
              onChange={(event) => changeSourceType(event.target.value as SourceType)}
            >
              <option value={ALL}>{t("allTypes")}</option>
              <option value="EVENT">{common("events")}</option>
              <option value="MEETING">{common("meetings")}</option>
            </Select>
            <Select
              className="h-9"
              value={sourceKey}
              onChange={(event) => {
                setSourceKey(event.target.value);
                setPage(1);
              }}
            >
              <option value={ALL}>{t("allSources")}</option>
              {sourceOptions.map((source) => (
                <option key={source.key} value={source.key}>
                  {source.type === "Event" ? common("event") : common("meeting")}: {source.label}
                </option>
              ))}
            </Select>
            <Input
              className="h-9"
              value={search}
              placeholder={t("searchPlaceholder")}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[150px_minmax(260px,1fr)_auto]">
          <Select
            className="h-10"
            value={scanType}
            onChange={(event) =>
              setScanType(event.target.value as Exclude<SourceType, "ALL">)
            }
          >
            <option value="EVENT">{t("eventQr")}</option>
            <option value="MEETING">{t("meetingQr")}</option>
          </Select>
          <Input
            className="h-10"
            value={scanCode}
            placeholder={t("scanPlaceholder")}
            onChange={(event) => setScanCode(event.target.value)}
          />
          <Button
            className="h-10"
            disabled={!scanCode.trim() || scanMutation.isPending}
            onClick={() => scanMutation.mutate()}
          >
            {scanMutation.isPending ? t("checking") : t("markJoined")}
          </Button>
          {scanMutation.error ? (
            <p className="text-sm text-destructive md:col-span-3">
              {scanMutation.error.message}
            </p>
          ) : null}
        </div>
        {isLoading ? (
          <div className="p-5 text-sm text-muted-fg">{t("loading")}</div>
        ) : filteredLogs.length ? (
          <>
          <Table>
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>{t("attendee")}</TableHead>
                <TableHead>{common("type")}</TableHead>
                <TableHead>{t("source")}</TableHead>
                <TableHead>{common("place")}</TableHead>
                <TableHead>{common("department")}</TableHead>
                <TableHead>{t("checkInTime")}</TableHead>
                <TableHead>{common("status")}</TableHead>
                <TableHead>{common("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageLogs.map((row) => (
                <TableRow key={`${row.sourceType}-${row.id}`}>
                  <TableCell className="font-medium">
                    <p>{row.fullNameEn}</p>
                    {row.fullNameKm ? (
                      <p className="text-xs text-muted-fg">{row.fullNameKm}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={row.sourceType === "MEETING" ? "purple" : "blue"}>
                      {row.sourceType === "MEETING" ? common("meeting") : common("event")}
                    </StatusPill>
                  </TableCell>
                  <TableCell>{row.sourceName}</TableCell>
                  <TableCell className="text-muted-fg">{row.placeName}</TableCell>
                  <TableCell className="text-muted-fg">
                    {row.department ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {formatDateTime(row.checkInAt)}
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      tone={row.status === "JOINED" ? "green" : "amber"}
                    >
                      {row.status === "JOINED" ? common("joined") : common("cancelled")}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      className="h-8"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(row)}
                    >
                      {t("cancelJoin")}
                    </Button>
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
            title={t("emptyTitle")}
            text={t("emptyText")}
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
    fullNameKm: participant.fullNameKm,
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

function matchesAttendanceSearch(row: AttendanceLog, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [row.fullNameEn, row.fullNameKm]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}
