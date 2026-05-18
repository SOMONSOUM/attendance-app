import { ScanClient } from "./scan-client";
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
  mode: "PRE_REGISTERED" | "OPEN_REGISTRATION";
  locationName: string;
  startsAt: string;
  endsAt: string;
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
  return <ScanClient code={code} event={event} />;
}
