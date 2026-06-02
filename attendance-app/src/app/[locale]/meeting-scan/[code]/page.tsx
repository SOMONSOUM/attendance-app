import { AppearanceProvider } from "@/components/appearance-provider";
import { api } from "@/lib/api";
import { MeetingScanClient } from "./scan-client";

export type PublicMeeting = {
  id: string;
  name: string;
  description?: string | null;
  mode:
    | "BULK_REGISTRATION"
    | "PRE_REGISTRATION"
    | "OPEN_REGISTRATION";
  requireLocation?: boolean;
  locationName?: string | null;
  latitude?: string | number;
  longitude?: string | number;
  radiusMeters?: number;
  startsAt: string;
  endsAt: string;
  scanPlace?: {
    id: string;
    name: string;
    description?: string | null;
    locationName?: string | null;
  } | null;
  participants: Array<{
    id: string;
    fullNameEn: string;
    fullNameKm?: string | null;
    gender?: "MALE" | "FEMALE" | "OTHER" | null;
    position?: string | null;
    organization?: string | null;
    phoneNumber?: string | null;
    status?: "INVITED" | "JOINED" | "CANCELLED";
    placeId?: string | null;
  }>;
};

async function getMeeting(code: string) {
  return api<PublicMeeting>(`/meetings/qr/${code}`);
}

export default async function MeetingScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const meeting = await getMeeting(code);

  return (
    <AppearanceProvider defaultTheme="system">
      <MeetingScanClient code={code} meeting={meeting} />
    </AppearanceProvider>
  );
}
