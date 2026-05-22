"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  MapPin,
  QrCode,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMeetingQr,
  joinMeetingParticipant,
  listMeetings,
  meetingKeys,
  type MeetingChairperson,
  type MeetingParticipant,
} from "@/lib/admin-data";

export default function MeetingDetailPage() {
  const params = useParams<{ locale: string; meetingId: string }>();
  const searchParams = useSearchParams();
  const locale = params.locale ?? "en";
  const meetingId = params.meetingId;
  const selectedPlaceId = searchParams.get("placeId");
  const queryClient = useQueryClient();

  const meetingsQuery = useQuery({
    queryKey: meetingKeys.all,
    queryFn: listMeetings,
  });
  const qrQuery = useQuery({
    queryKey: ["meetings", meetingId, "qr"],
    queryFn: () => getMeetingQr(meetingId),
    enabled: Boolean(meetingId),
  });
  const joinMutation = useMutation({
    mutationFn: (participantId: string) =>
      joinMeetingParticipant(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });

  const meeting = meetingsQuery.data?.find((item) => item.id === meetingId);
  const participants = meeting?.participants ?? [];
  const selectedPlace = selectedPlaceId
    ? meeting?.places?.find((place) => place.id === selectedPlaceId) ?? null
    : null;
  const scopedParticipants = selectedPlace
    ? participants.filter((participant) => participant.placeId === selectedPlace.id)
    : participants;
  const joinedParticipants = scopedParticipants.filter(
    (participant) => participant.status === "JOINED",
  );
  const invitedParticipants = scopedParticipants.filter(
    (participant) => participant.status !== "JOINED",
  );
  const joinRate = percentage(joinedParticipants.length, scopedParticipants.length);
  const placeRows = useMemo(
    () =>
      (meeting?.places ?? []).map((place) => {
        const rows = participants.filter((participant) => participant.placeId === place.id);
        const joined = rows.filter((participant) => participant.status === "JOINED");

        return {
          ...place,
          total: rows.length,
          joined: joined.length,
          rate: percentage(joined.length, rows.length),
          qr: qrQuery.data?.qrCodes?.find((item) => item.placeId === place.id),
        };
      }),
    [meeting?.places, participants, qrQuery.data?.qrCodes],
  );

  return (
    <AdminShell
      active="Meetings"
      title={
        selectedPlace
          ? `${selectedPlace.name} overview`
          : meeting?.name ?? "Meeting overview"
      }
      description={
        meeting
          ? selectedPlace
            ? `${meeting.name}, ${selectedPlace.locationName || meeting.locationName}`
            : `${meeting.mode.replace("_", " ")} meeting, ${formatDateRange(
                meeting.startsAt,
                meeting.endsAt,
              )}`
          : "Meeting overview and participant breakdown."
      }
      action={
        <Button asChild variant="outline">
          <Link href={`/${locale}/meetings`}>
            <ArrowLeft size={16} />
            Back to meetings
          </Link>
        </Button>
      }
    >
      {meetingsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-fg">
          Loading meeting overview...
        </div>
      ) : !meeting ? (
        <EmptyState
          title="Meeting not found"
          text="This meeting may have been deleted or you may not have access."
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={meeting.separateQrByPlace ? "purple" : "blue"}>
              {meeting.separateQrByPlace ? "By place" : "Single QR"}
            </StatusPill>
            <StatusPill tone={meetingTone(meeting)}>
              {meetingStatus(meeting)}
            </StatusPill>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={selectedPlace ? "Place users" : "Participants"}
              value={String(scopedParticipants.length)}
              sub={`${invitedParticipants.length} not yet joined`}
              icon={Users}
            />
            <MetricCard
              label="Joined"
              value={String(joinedParticipants.length)}
              sub={`${joinRate}% coverage`}
              icon={UserCheck}
            />
            <MetricCard
              label="Chairpersons"
              value={String(meeting.chairpersons.length)}
              sub={formatChairperson(meeting.chairpersons[0])}
              icon={Users}
            />
            <MetricCard
              label="Schedule"
              value={new Date(meeting.startsAt).toLocaleDateString()}
              sub={new Date(meeting.startsAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              icon={CalendarDays}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
            <Card>
              <CardHeader>
                <CardTitle>Meeting details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-fg">
                    <MapPin size={14} />
                    {meeting.locationName}
                  </p>
                </div>
                {meeting.description ? (
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="mt-1 text-sm text-muted-fg">
                      {meeting.description}
                    </p>
                  </div>
                ) : null}
                <div className="grid gap-3">
                  <p className="text-sm font-medium">Chairpersons</p>
                  {meeting.chairpersons.map((chairperson) => (
                    <ChairpersonCard
                      key={chairperson.id ?? formatChairperson(chairperson)}
                      chairperson={chairperson}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <SectionToolbar
                title={
                  meeting.separateQrByPlace
                    ? selectedPlace
                      ? `${selectedPlace.name} QR and stats`
                      : "Places and QR codes"
                    : "Meeting QR"
                }
              >
                {selectedPlace ? (
                  <Button asChild variant="outline" className="h-8">
                    <Link href={`/${locale}/meetings/${meeting.id}`}>All places</Link>
                  </Button>
                ) : null}
              </SectionToolbar>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                {meeting.separateQrByPlace ? (
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
                        fileName={`${meeting.name}-${place.name}.png`}
                        href={`/${locale}/meetings/${meeting.id}?placeId=${place.id}`}
                        showView={!selectedPlace}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No places configured"
                      text="Add places to this meeting to generate room-specific QR codes."
                    />
                  )
                ) : (
                  <SingleQrCard
                    name={meeting.name}
                    code={qrQuery.data?.code}
                    qrImage={qrQuery.data?.qrImage}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <TableShell>
            <SectionToolbar
              title={selectedPlace ? `${selectedPlace.name} participants` : "Participants"}
            >
              <StatusPill tone="blue">{scopedParticipants.length} total</StatusPill>
            </SectionToolbar>
            {scopedParticipants.length ? (
              <Table className="min-w-160">
                <TableHeader>
                  <TableRow className="border-t-0">
                    <TableHead>Name</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedParticipants.map((participant) => (
                    <TableRow key={participant.id ?? participant.fullNameEn}>
                      <TableCell>
                        <p className="font-medium">{participant.fullNameEn}</p>
                        {participant.fullNameKm ? (
                          <p className="text-xs text-muted-fg">
                            {participant.fullNameKm}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {placeName(meeting.places, participant.placeId)}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {participant.position || "-"}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {participant.department || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={participant.status === "JOINED" ? "green" : "amber"}
                        >
                          {participant.status ?? "INVITED"}
                        </StatusPill>
                      </TableCell>
                      <TableCell>
                        {participant.status === "JOINED" || !participant.id ? (
                          <span className="text-sm text-muted-fg">
                            {participant.joinedAt
                              ? new Date(participant.joinedAt).toLocaleString()
                              : "Joined"}
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            className="h-8"
                            disabled={joinMutation.isPending}
                            onClick={() => joinMutation.mutate(participant.id!)}
                          >
                            <UserCheck size={14} />
                            Join
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No participants yet"
                text="Participants will appear after upload, import, or open registration."
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
        <p className="mt-1 truncate text-xs text-muted-fg">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ChairpersonCard({
  chairperson,
}: {
  chairperson: MeetingChairperson;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="font-medium">{formatChairperson(chairperson)}</p>
      <p className="mt-1 text-sm text-muted-fg">
        {[chairperson.position, chairperson.organization].filter(Boolean).join(", ") ||
          "No position"}
      </p>
      <p className="mt-1 text-sm text-muted-fg">
        {[
          chairperson.honorificTitleKm,
          chairperson.firstNameKm,
          chairperson.lastNameKm,
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
    </div>
  );
}

function QrPlaceCard({
  name,
  locationName,
  description,
  total,
  joined,
  rate,
  qrImage,
  fileName,
  href,
  showView,
}: {
  name: string;
  locationName?: string | null;
  description?: string | null;
  total: number;
  joined: number;
  rate: number;
  qrImage?: string;
  fileName: string;
  href: string;
  showView: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-fg">
            <MapPin size={12} />
            {locationName || "Location not set"}
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-md border border-border text-muted-fg">
          <QrCode size={16} />
        </span>
      </div>
      {description ? (
        <p className="line-clamp-2 text-sm text-muted-fg">{description}</p>
      ) : null}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Users" value={total} />
        <Stat label="Joined" value={joined} />
        <Stat label="Rate" value={`${rate}%`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {showView ? (
          <Button asChild className="h-8">
            <Link href={href}>View</Link>
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="h-8"
          disabled={!qrImage}
          onClick={() => (qrImage ? downloadDataUrl(qrImage, fileName) : undefined)}
        >
          <Download size={14} />
          QR
        </Button>
      </div>
    </div>
  );
}

function SingleQrCard({
  name,
  code,
  qrImage,
}: {
  name: string;
  code?: string;
  qrImage?: string;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-4 md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Single meeting QR</p>
          <p className="mt-1 text-xs text-muted-fg">{code ?? "Generating QR"}</p>
        </div>
        <span className="grid size-8 place-items-center rounded-md border border-border text-muted-fg">
          <QrCode size={16} />
        </span>
      </div>
      {qrImage ? (
        <img
          src={qrImage}
          alt={`${name} QR code`}
          className="size-48 rounded-md border border-border bg-white p-2"
        />
      ) : (
        <div className="grid size-48 place-items-center rounded-md border border-dashed border-border text-sm text-muted-fg">
          Loading QR
        </div>
      )}
      <Button
        variant="outline"
        className="h-8 justify-self-start"
        disabled={!qrImage}
        onClick={() => (qrImage ? downloadDataUrl(qrImage, `${name}.png`) : undefined)}
      >
        <Download size={14} />
        Download QR
      </Button>
    </div>
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

function formatChairperson(chairperson?: MeetingChairperson) {
  if (!chairperson) return "No chairperson";
  return `${chairperson.honorificTitleEn} ${chairperson.firstNameEn} ${chairperson.lastNameEn}`.trim();
}

function placeName(
  places: Array<{ id?: string; name: string }> | undefined,
  placeId?: string | null,
) {
  if (!placeId) return "All places";
  return places?.find((place) => place.id === placeId)?.name ?? "Unknown place";
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function formatDateRange(startsAt: string, endsAt: string) {
  return `${new Date(startsAt).toLocaleString()} - ${new Date(endsAt).toLocaleString()}`;
}

function meetingStatus(meeting: { startsAt: string; endsAt: string }) {
  const now = Date.now();
  if (new Date(meeting.startsAt).getTime() > now) return "Ready";
  if (new Date(meeting.endsAt).getTime() < now) return "Closed";
  return "Live";
}

function meetingTone(meeting: { startsAt: string; endsAt: string }) {
  const status = meetingStatus(meeting);
  if (status === "Live") return "green";
  if (status === "Ready") return "blue";
  return "amber";
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^\w.-]+/g, "-").toLowerCase();
  link.click();
}
