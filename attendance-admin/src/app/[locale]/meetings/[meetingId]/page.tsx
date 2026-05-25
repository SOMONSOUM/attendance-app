"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
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
import { Card, CardContent } from "@/components/ui/card";
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
  type MeetingParticipant,
} from "@/lib/admin-data";
import {
  LocationRequirementBadge,
  MeetingDetailsCard,
  MetricCard,
  PlacesEmptyState,
  QrPlaceCard,
  SingleQrCard,
  buildCoordinates,
  formatChairperson,
} from "./_components/meeting-detail-components";

export default function MeetingDetailPage() {
  const params = useParams<{ locale: string; meetingId: string }>();
  const searchParams = useSearchParams();
  const locale = params.locale ?? "en";
  const meetingId = params.meetingId;
  const selectedPlaceId = searchParams.get("placeId");
  const queryClient = useQueryClient();

  const meetingsQuery = useQuery({
    queryKey: meetingKeys.all,
    queryFn: () => listMeetings({ pageSize: 100 }),
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

  const meeting = meetingsQuery.data?.items.find((item) => item.id === meetingId);
  const participants = meeting?.participants ?? [];
  const selectedPlace = selectedPlaceId
    ? meeting?.places?.find((place) => place.id === selectedPlaceId) ?? null
    : null;
  const detailCoordinates = buildCoordinates(
    selectedPlace?.latitude ?? meeting?.latitude,
    selectedPlace?.longitude ?? meeting?.longitude,
  );
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
          coordinates: buildCoordinates(
            place.latitude ?? meeting?.latitude,
            place.longitude ?? meeting?.longitude,
          ),
          total: rows.length,
          joined: joined.length,
          rate: percentage(joined.length, rows.length),
          qr: qrQuery.data?.qrCodes?.find((item) => item.placeId === place.id),
        };
      }),
    [
      meeting?.places,
      meeting?.latitude,
      meeting?.longitude,
      participants,
      qrQuery.data?.qrCodes,
    ],
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
            : `${registrationModeLabel(meeting.mode)} meeting, ${formatDateRange(
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
            <LocationRequirementBadge required={meeting.requireLocation} />
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
            <MeetingDetailsCard
              name={selectedPlace?.name ?? meeting.name}
              description={meeting.description}
              locationName={selectedPlace?.locationName || meeting.locationName}
              requireLocation={
                selectedPlace
                  ? selectedPlace.requireLocation
                  : meeting.requireLocation
              }
              coordinates={detailCoordinates}
              chairpersons={meeting.chairpersons}
            />

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
                        requireLocation={place.requireLocation}
                        coordinates={place.coordinates}
                        showView={!selectedPlace}
                      />
                    ))
                  ) : (
                    <PlacesEmptyState />
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
              <Table>
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

function registrationModeLabel(mode: string) {
  if (mode === "OPEN_REGISTRATION") return "Open registration";
  if (mode === "PRE_REGISTRATION") return "Pre-registration";
  return "Bulk registration";
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
