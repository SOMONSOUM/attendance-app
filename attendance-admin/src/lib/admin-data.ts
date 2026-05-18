import { api } from "@/lib/api";

export type EventRecord = {
  id: string;
  name: string;
  description?: string | null;
  mode: "PRE_REGISTERED" | "OPEN_REGISTRATION";
  locationName: string;
  latitude: string | number;
  longitude: string | number;
  radiusMeters: number;
  startsAt: string;
  endsAt: string;
  theme?: EventTheme | null;
  qrCodes?: { id: string; code: string; active: boolean }[];
  _count?: { attendances: number; registrations: number };
};

export type EventTheme = {
  primaryColor: string;
  backgroundColor: string;
  backgroundImageUrl?: string | null;
  fontFamily: string;
  fontSize: number;
  radius: number;
  appearance: "light" | "dark" | "system";
};

export type EventForm = {
  name: string;
  description?: string;
  mode: "PRE_REGISTERED" | "OPEN_REGISTRATION";
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  startsAt: string;
  endsAt: string;
  theme: EventTheme;
};

export type UserRecord = {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameKm?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  position?: string | null;
  department?: string | null;
  roles: { role: { id: string; name: string } }[];
  createdAt: string;
};

export type CurrentUser = {
  id: string;
  email: string | null;
  fullNameEn: string;
  permissions: string[];
};

export type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  permissions: { permission: { id: string; resource: string; action: string } }[];
  _count: { users: number };
};

export type RoleForm = {
  name: string;
  description?: string;
  permissions: string[];
};

export type UserForm = {
  email: string;
  password?: string;
  fullNameEn: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  position?: string;
  department?: string;
  roleName?: string;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  fullNameEn: string;
  gender?: string | null;
  position?: string | null;
  department?: string | null;
  distanceMeters: number;
  status: "JOINED" | "CANCELLED";
  createdAt: string;
};

export const eventKeys = {
  all: ["events"] as const,
};

export const userKeys = {
  all: ["users"] as const,
};

export const authKeys = {
  me: ["auth", "me"] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
};

export function listEvents() {
  return api<EventRecord[]>("/events");
}

export function getCurrentUser() {
  return api<CurrentUser>("/auth/me");
}

export function createEvent(data: EventForm) {
  return api<EventRecord>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvent(id: string, data: Partial<EventForm>) {
  return api<EventRecord>(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteEvent(id: string) {
  return api<{ deleted: true }>(`/events/${id}`, { method: "DELETE" });
}

export function getEventQr(id: string) {
  return api<{ code: string; qrImage: string }>(`/events/${id}/qr`);
}

export function listUsers() {
  return api<UserRecord[]>("/users");
}

export function listRoles() {
  return api<RoleRecord[]>("/users/roles");
}

export function createRole(data: RoleForm) {
  return api<RoleRecord>("/users/roles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateRole(id: string, data: Partial<RoleForm>) {
  return api<RoleRecord>(`/users/roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteRole(id: string) {
  return api<{ deleted: true }>(`/users/roles/${id}`, { method: "DELETE" });
}

export function createUser(data: UserForm & { password: string }) {
  return api<UserRecord>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: string, data: UserForm) {
  return api<UserRecord>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string) {
  return api<{ deleted: true }>(`/users/${id}`, { method: "DELETE" });
}

export function assignUserRole(id: string, roleName: string) {
  return api<UserRecord>(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ roleName }),
  });
}

export function listAttendance(eventId: string) {
  return api<AttendanceRecord[]>(`/attendance/events/${eventId}`);
}

export function hasPermission(
  user: CurrentUser | undefined,
  permission: string,
) {
  return Boolean(user?.permissions.includes(permission));
}
