import { ScanClient } from "./scan-client";
import { AppearanceProvider } from "@/components/appearance-provider";
import { api } from "@/lib/api";

type EventTheme = {
  primaryColor: string;
  backgroundColor: string;
  backgroundImageUrl?: string | null;
  fontFamily: string;
  fontSize: number;
  radius: number;
  appearance: "light" | "dark" | "system";
};

type Event = {
  id: string;
  name: string;
  description?: string | null;
  mode:
    | "BULK_REGISTRATION"
    | "PRE_REGISTRATION"
    | "OPEN_REGISTRATION";
  locationName?: string;
  requireLocation?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  radiusMeters?: number;
  startsAt: string;
  endsAt: string;
  shifts: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  }[];
  scanPlace?: {
    id: string;
    name: string;
    description?: string | null;
    locationName?: string | null;
  } | null;
  theme?: EventTheme | null;
};

async function getEvent(code: string): Promise<Event> {
  return api<Event>(`/events/qr/${code}`);
}

export default async function ScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = await getEvent(code);
  return (
    <AppearanceProvider defaultTheme={event.theme?.appearance ?? "system"}>
      <ScanClient code={code} event={event} />
    </AppearanceProvider>
  );
}
