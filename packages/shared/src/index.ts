export const locales = ["en", "km"] as const;
export type Locale = (typeof locales)[number];

export type EventMode = "PRE_REGISTERED" | "OPEN_REGISTRATION";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage";

export interface Permission {
  resource: string;
  action: PermissionAction;
}

export interface PublicEventTheme {
  primaryColor: string;
  backgroundColor: string;
  backgroundImageUrl?: string;
  fontFamily: string;
  fontSize: number;
  radius: number;
  appearance: "light" | "dark" | "system";
}

export interface PublicEvent {
  id: string;
  name: string;
  description?: string;
  locationName: string;
  startsAt: string;
  endsAt: string;
  mode: EventMode;
  theme: PublicEventTheme;
}
