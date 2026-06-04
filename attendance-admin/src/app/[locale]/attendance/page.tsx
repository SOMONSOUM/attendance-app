"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit3, ListFilter, Users } from "lucide-react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  AdminShell,
  EmptyState,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { TableSkeleton } from "@/components/admin/loading-skeletons";
import { PaginationFooter, paginate } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
  eventKeys,
  cancelAttendance,
  cancelMeetingParticipant,
  joinAttendeeByQrCode,
  joinMeetingParticipantByQrCode,
  listAttendance,
  listEvents,
  listMeetings,
  meetingKeys,
  updateEventRegistration,
  updateMeetingParticipant,
  type AttendanceRecord,
  type MeetingParticipant,
  type MeetingPlace,
  type RegistrationForm,
} from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";

type SourceType = "ALL" | "EVENT" | "MEETING";

type AttendanceLog = {
  id: string;
  eventId?: string;
  registrationId?: string | null;
  sourceKey: string;
  sourceType: Exclude<SourceType, "ALL">;
  sourceName: string;
  placeName: string;
  fullNameEn: string;
  fullNameKm?: string | null;
  gender?: string | null;
  title?: string | null;
  position?: string | null;
  organization?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
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
  const [scanNotice, setScanNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [scanType, setScanType] = useState<Exclude<SourceType, "ALL">>("EVENT");
  const [page, setPage] = useState(1);
  const [viewingLog, setViewingLog] = useState<AttendanceLog | null>(null);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [attendanceForm, setAttendanceForm] =
    useState<RegistrationForm>(emptyRegistrationForm);
  const scanInputRef = useRef<HTMLInputElement>(null);
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
        ? joinAttendeeByQrCode(cleanScannedCode(scanCode))
        : joinMeetingParticipantByQrCode(cleanScannedCode(scanCode)),
    onSuccess: () => {
      setScanNotice({
        tone: "success",
        message: t("scanSuccess"),
      });
      setScanCode("");
      eventsQuery.refetch();
      meetingsQuery.refetch();
      attendanceQueries.forEach((query) => query.refetch());
    },
    onError: (error) => {
      setScanNotice({
        tone: "error",
        message: alreadyJoinedMessage(error.message) ?? error.message,
      });
      setScanCode("");
      scanInputRef.current?.focus();
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
  const updateLogMutation = useMutation<unknown, Error>({
    mutationFn: () => {
      if (!editingLog) throw new Error("No attendee selected");
      if (editingLog.sourceType === "EVENT") {
        if (!editingLog.eventId || !editingLog.registrationId) {
          throw new Error("Only registered event attendees can be edited here.");
        }
        return updateEventRegistration(
          editingLog.eventId,
          editingLog.registrationId,
          attendanceForm,
        );
      }
      return updateMeetingParticipant(
        editingLog.sourceKey.replace("MEETING:", ""),
        editingLog.id,
        attendanceForm,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      attendanceQueries.forEach((query) => query.refetch());
      setEditingLog(null);
      setAttendanceForm(emptyRegistrationForm);
    },
  });

  const eventLogs = useMemo(
    () =>
      events.flatMap((event, index) =>
        (attendanceQueries[index]?.data?.items ?? []).map((row) => ({
          id: row.id,
          eventId: event.id,
          registrationId: row.registrationId,
          sourceKey: sourceOptionKey("EVENT", event.id),
          sourceType: "EVENT" as const,
          sourceName: event.name,
          placeName: row.placeName ?? placeName(event.places, row.placeId),
          fullNameEn: row.fullNameEn,
          fullNameKm: row.fullNameKm,
          gender: row.gender,
          title: row.title,
          position: row.position,
          organization: row.organization,
          phoneNumber: row.phoneNumber,
          email: row.email,
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

  useEffect(() => {
    scanInputRef.current?.focus();
  }, [scanMutation.isPending, scanType]);

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
          <div className="grid gap-2 md:grid-cols-[170px_150px_minmax(240px,1fr)_minmax(220px,1fr)]">
            <DatePicker
              className="h-9"
              value={date}
              onChange={(value) => {
                setDate(value);
                setPage(1);
              }}
              placeholder="Filter date"
              ariaLabel="Filter date"
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

        <form
          className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[150px_minmax(260px,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (cleanScannedCode(scanCode) && !scanMutation.isPending) {
              scanMutation.mutate();
            }
          }}
        >
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
            ref={scanInputRef}
            className="h-10"
            value={scanCode}
            placeholder={t("scanPlaceholder")}
            onChange={(event) => {
              setScanCode(event.target.value.replace(/[\r\n]+/g, ""));
              setScanNotice(null);
            }}
            autoComplete="off"
            autoFocus
          />
          <Button
            type="submit"
            className="h-10"
            disabled={!cleanScannedCode(scanCode) || scanMutation.isPending}
          >
            {scanMutation.isPending ? t("checking") : t("markJoined")}
          </Button>
          {scanNotice ? (
            <p
              className={`text-sm md:col-span-3 ${
                scanNotice.tone === "success" ? "text-success" : "text-destructive"
              }`}
              role="status"
            >
              {scanNotice.message}
            </p>
          ) : null}
        </form>
        {isLoading ? (
          <TableSkeleton columns={8} />
        ) : filteredLogs.length ? (
          <>
          <Table>
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>{t("attendee")}</TableHead>
                <TableHead>{common("type")}</TableHead>
                <TableHead>{t("source")}</TableHead>
                <TableHead>{common("place")}</TableHead>
                <TableHead>{common("organization")}</TableHead>
                <TableHead>{t("checkInTime")}</TableHead>
                <TableHead>{common("status")}</TableHead>
                <TableHead>{common("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageLogs.map((row) => (
                <TableRow
                  key={`${row.sourceType}-${row.id}`}
                  className="cursor-pointer"
                  onClick={() => setViewingLog(row)}
                >
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
                    {row.organization ?? "-"}
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
                    <div
                      className="flex flex-wrap gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        className="size-8 px-0"
                        disabled={
                          row.sourceType === "EVENT" && !row.registrationId
                        }
                        onClick={() => {
                          setViewingLog(null);
                          setEditingLog(row);
                          setAttendanceForm(formFromLog(row));
                        }}
                        aria-label={`Edit ${row.fullNameEn}`}
                        title={`Edit ${row.fullNameEn}`}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(row)}
                      >
                        {t("cancelJoin")}
                      </Button>
                    </div>
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
        <AttendanceDetailDialog
          open={Boolean(viewingLog)}
          row={viewingLog}
          onOpenChange={(open) => {
            if (!open) setViewingLog(null);
          }}
        />
        <AttendanceEditDialog
          open={Boolean(editingLog)}
          row={editingLog}
          values={attendanceForm}
          isPending={updateLogMutation.isPending}
          error={updateLogMutation.error?.message}
          onOpenChange={(open) => {
            if (!open) {
              setEditingLog(null);
              setAttendanceForm(emptyRegistrationForm);
            }
          }}
          onChange={setAttendanceForm}
          onSubmit={() => updateLogMutation.mutate()}
        />
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
    gender: participant.gender,
    title: participant.title,
    position: participant.position,
    organization: participant.organization,
    phoneNumber: participant.phoneNumber,
    email: participant.email,
    checkInAt: participant.joinedAt!,
    status: participant.status === "CANCELLED" ? "CANCELLED" : "JOINED",
  };
}

const emptyRegistrationForm: RegistrationForm = {
  fullNameEn: "",
  fullNameKm: "",
  gender: "",
  title: "",
  position: "",
  organization: "",
  phoneNumber: "",
  email: "",
  shiftId: "",
};

function formFromLog(row: AttendanceLog): RegistrationForm {
  return {
    fullNameEn: row.fullNameEn,
    fullNameKm: row.fullNameKm ?? "",
    gender: (row.gender as RegistrationForm["gender"]) ?? "",
    title: row.title ?? "",
    position: row.position ?? "",
    organization: row.organization ?? "",
    phoneNumber: row.phoneNumber ?? "",
    email: row.email ?? "",
  };
}

function AttendanceDetailDialog({
  open,
  row,
  onOpenChange,
}: {
  open: boolean;
  row: AttendanceLog | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={row?.fullNameEn ?? "Attendee"}
      description={row?.sourceName ?? undefined}
    >
      <dl className="grid gap-2 text-sm">
        {[
          ["Khmer name", row?.fullNameKm],
          ["Type", row?.sourceType],
          ["Place", row?.placeName],
          ["Title", row?.title],
          ["Gender", row?.gender],
          ["Position", row?.position],
          ["Organization", row?.organization],
          ["Phone", row?.phoneNumber],
          ["Email", row?.email],
          ["Status", row?.status],
          ["Check-in time", row ? formatDateTime(row.checkInAt) : null],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="grid gap-1 rounded-md border border-border p-3 sm:grid-cols-[140px_1fr]"
          >
            <dt className="font-medium text-muted-fg">{label}</dt>
            <dd className="font-semibold">{value || "-"}</dd>
          </div>
        ))}
      </dl>
      <DialogFooter showCloseButton />
    </Dialog>
  );
}

function AttendanceEditDialog({
  open,
  row,
  values,
  isPending,
  error,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  row: AttendanceLog | null;
  values: RegistrationForm;
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
      title={row ? `Edit ${row.fullNameEn}` : "Edit attendee"}
      description={row?.sourceName}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Full name in English" className="sm:col-span-2">
            <Input
              value={values.fullNameEn}
              onChange={(event) =>
                onChange({ ...values, fullNameEn: event.target.value })
              }
              required
            />
          </FormField>
          <FormField label="Full name in Khmer" className="sm:col-span-2">
            <Input
              value={values.fullNameKm ?? ""}
              onChange={(event) =>
                onChange({ ...values, fullNameKm: event.target.value })
              }
            />
          </FormField>
          <FormField label="Gender">
            <Select
              value={values.gender ?? ""}
              onChange={(event) =>
                onChange({
                  ...values,
                  gender: event.target.value as RegistrationForm["gender"],
                })
              }
            >
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
          <FormField label="Title">
            <Select
              value={values.title ?? ""}
              onChange={(event) =>
                onChange({ ...values, title: event.target.value })
              }
            >
              <option value="">Not specified</option>
              {["Dr.", "H.E.", "Mr.", "Mrs.", "Ms.", "Miss", "Prof."].map(
                (title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ),
              )}
            </Select>
          </FormField>
          <FormField label="Position">
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
          <FormField label="Email">
            <Input
              type="email"
              value={values.email ?? ""}
              onChange={(event) =>
                onChange({ ...values, email: event.target.value })
              }
            />
          </FormField>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !values.fullNameEn.trim()}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function FormField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-2 text-sm font-medium ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
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

function cleanScannedCode(value: string) {
  return value.trim().replace(/^https?:\/\/\S+\/([^/?#]+)[/?#]?$/i, "$1");
}

function alreadyJoinedMessage(message: string) {
  return /already joined/i.test(message)
    ? "This personal QR code is already checked in."
    : null;
}
