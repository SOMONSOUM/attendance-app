import { api } from "@/lib/api";

export type RegistrationMode =
  | "BULK_REGISTRATION"
  | "OPEN_REGISTRATION"
  | "PRE_REGISTRATION";

export type EventRecord = {
  id: string;
  name: string;
  description?: string | null;
  mode: RegistrationMode;
  locationName: string;
  requireLocation?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  radiusMeters?: number;
  startsAt: string;
  endsAt: string;
  separateQrByPlace?: boolean;
  places?: EventPlace[];
  theme?: EventTheme | null;
  shifts?: EventShift[];
  qrCodes?: { id: string; code: string; active: boolean }[];
  _count?: { attendances: number; registrations: number };
  summary?: EventSummary;
  recentAttendances?: AttendanceRecord[];
};

export type EventSummary = {
  totalUsers: number;
  registrations: number;
  checkedIn: number;
  joinRate: number;
  remaining: number;
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

export type EventShift = {
  id?: string;
  name: string;
  startTime: string;
  endTime: string;
};

export type EventPlace = {
  id?: string;
  name: string;
  description?: string | null;
  requireLocation?: boolean;
  locationName?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  radiusMeters?: number;
  qrCodes?: { id: string; code: string; active: boolean }[];
};

export type EventForm = {
  name: string;
  description?: string;
  mode: RegistrationMode;
  separateQrByPlace?: boolean;
  requireLocation?: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  places?: EventPlace[];
  startsAt: string;
  endsAt: string;
  shifts?: EventShift[];
  theme: EventTheme;
};

export type MeetingChairperson = {
  id?: string;
  honorificTitleEn: string;
  honorificTitleKm: string;
  firstNameEn: string;
  firstNameKm: string;
  lastNameEn: string;
  lastNameKm: string;
  position?: string | null;
  organization?: string | null;
};

export type MeetingPlace = {
  id?: string;
  name: string;
  description?: string | null;
  requireLocation?: boolean;
  locationName?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  radiusMeters?: number;
  qrCodes?: { id: string; code: string; active: boolean }[];
};

export type MeetingParticipant = {
  id?: string;
  fullNameEn: string;
  fullNameKm?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  position?: string | null;
  department?: string | null;
  email?: string | null;
  status?: "INVITED" | "JOINED" | "CANCELLED";
  joinedAt?: string | null;
  placeId?: string | null;
  shiftId?: string | null;
};

export type MeetingRecord = {
  id: string;
  name: string;
  description?: string | null;
  mode: RegistrationMode;
  separateQrByPlace?: boolean;
  locationName: string;
  requireLocation?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  radiusMeters?: number;
  startsAt: string;
  endsAt: string;
  chairpersons: MeetingChairperson[];
  places?: MeetingPlace[];
  shifts?: EventShift[];
  qrCodes?: { id: string; code: string; active: boolean }[];
  participants: MeetingParticipant[];
  _count?: { chairpersons: number; participants: number };
};

export type MeetingForm = {
  name: string;
  description?: string;
  mode: RegistrationMode;
  separateQrByPlace?: boolean;
  locationName?: string;
  requireLocation?: boolean;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  startsAt: string;
  endsAt: string;
  chairpersons: MeetingChairperson[];
  places?: MeetingPlace[];
  shifts?: EventShift[];
  participants?: MeetingParticipant[];
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
  tenantId: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
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
  placeId?: string | null;
  placeName?: string | null;
  fullNameEn: string;
  gender?: string | null;
  position?: string | null;
  department?: string | null;
  distanceMeters?: number;
  fullNameKm?: string | null;
  status: "JOINED" | "CANCELLED";
  createdAt: string;
};

export type RegistrationForm = {
  fullNameEn: string;
  fullNameKm?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "";
  position?: string;
  department?: string;
  shiftId?: string;
  placeId?: string;
};

export type EventRosterRecord = {
  id: string;
  eventId: string;
  registrationId: string | null;
  attendanceId: string | null;
  placeId?: string | null;
  placeName?: string | null;
  shiftId?: string | null;
  shiftName?: string | null;
  fullNameEn: string;
  fullNameKm?: string | null;
  gender?: string | null;
  position?: string | null;
  department?: string | null;
  joined: boolean;
  status: "JOINED" | "CANCELLED" | "NOT_YET";
  joinedAt?: string | null;
};

export type RegistrationImportRecord = {
  id: string;
  fileName: string;
  originalName: string;
  rowCount: number;
  target: "EVENT" | "MEETING";
  status: "IMPORTED" | "VALIDATING" | string;
  uploadedBy?: {
    id: string;
    fullNameEn: string;
    email?: string | null;
  } | null;
  createdAt: string;
};

export type RegistrationTemplate = {
  filename: string;
  mimeType: string;
  contentBase64: string;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export const eventKeys = {
  all: ["events"] as const,
};

export const meetingKeys = {
  all: ["meetings"] as const,
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

export function listEvents(params?: PaginationParams) {
  return api<Paginated<EventRecord>>(`/events${paginationQuery(params)}`);
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

export function listMeetings(params?: PaginationParams) {
  return api<Paginated<MeetingRecord>>(`/meetings${paginationQuery(params)}`);
}

export function createMeeting(data: MeetingForm) {
  return api<MeetingRecord>("/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMeeting(id: string, data: Partial<MeetingForm>) {
  return api<MeetingRecord>(`/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMeeting(id: string) {
  return api<{ deleted: true }>(`/meetings/${id}`, { method: "DELETE" });
}

export function getMeetingQr(id: string) {
  return api<{
    code: string;
    qrImage: string;
    qrCodes?: Array<{
      id: string;
      code: string;
      placeId?: string | null;
      placeName?: string | null;
      qrImage: string;
    }>;
  }>(`/meetings/${id}/qr`);
}

export function uploadMeetingParticipants(
  meetingId: string,
  file: File,
  placeId?: string,
) {
  const formData = new FormData();
  formData.append("file", file);
  if (placeId) formData.append("placeId", placeId);

  return api<{ count: number }>(`/meetings/${meetingId}/participants/upload`, {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function joinMeetingParticipant(meetingId: string, participantId: string) {
  return api<MeetingParticipant>(
    `/meetings/${meetingId}/participants/${participantId}/join`,
    { method: "POST" },
  );
}

export function cancelMeetingParticipant(
  meetingId: string,
  participantId: string,
) {
  return api<MeetingParticipant>(
    `/meetings/${meetingId}/participants/${participantId}/join`,
    { method: "DELETE" },
  );
}

export function getEventQr(id: string) {
  return api<{
    code: string;
    qrImage: string;
    qrCodes?: Array<{
      id: string;
      code: string;
      placeId?: string | null;
      placeName?: string | null;
      qrImage: string;
    }>;
  }>(`/events/${id}/qr`);
}

export function uploadRegistrations(eventId: string, file: File, placeId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (placeId) formData.append("placeId", placeId);

  return api<{ count: number }>(`/events/${eventId}/registrations/upload`, {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function listRegistrationImports(
  params?: PaginationParams & { target?: "EVENT" | "MEETING" },
) {
  return api<Paginated<RegistrationImportRecord>>(
    `/registration-imports${paginationQuery(params)}`,
  );
}

export function listMeetingRegistrationImports(params?: PaginationParams) {
  return api<Paginated<RegistrationImportRecord>>(
    `/registration-imports${paginationQuery({ ...params, target: "MEETING" })}`,
  );
}

export function uploadRegistrationImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api<RegistrationImportRecord>("/registration-imports/upload", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function uploadMeetingRegistrationImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api<RegistrationImportRecord>("/registration-imports/meetings/upload", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export function getRegistrationTemplate() {
  return api<RegistrationTemplate>("/registration-imports/template");
}

export function downloadRegistrationImport(importId: string) {
  return api<RegistrationTemplate>(`/registration-imports/${importId}/download`);
}

export function deleteRegistrationImport(importId: string) {
  return api<{ deleted: true }>(`/registration-imports/${importId}`, {
    method: "DELETE",
  });
}

export function copyRegistrationImport(
  eventId: string,
  importId: string,
  placeId?: string,
) {
  return api<{ count: number }>(
    `/events/${eventId}/registrations/import/${importId}`,
    {
      method: "POST",
      body: JSON.stringify(placeId ? { placeId } : {}),
    },
  );
}

export function copyRegistrations(eventId: string, sourceEventId: string) {
  return api<{ count: number }>(
    `/events/${eventId}/registrations/copy/${sourceEventId}`,
    { method: "POST" },
  );
}

export function copyMeetingRegistrationImport(
  meetingId: string,
  importId: string,
  placeId?: string,
) {
  return api<{ count: number }>(
    `/meetings/${meetingId}/participants/import/${importId}`,
    {
      method: "POST",
      body: JSON.stringify(placeId ? { placeId } : {}),
    },
  );
}

export function listUsers(params?: PaginationParams) {
  return api<Paginated<UserRecord>>(`/users${paginationQuery(params)}`);
}

export function listRoles(params?: PaginationParams) {
  return api<Paginated<RoleRecord>>(`/users/roles${paginationQuery(params)}`);
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

export function listAttendance(eventId: string, params?: PaginationParams) {
  return api<Paginated<AttendanceRecord>>(
    `/attendance/events/${eventId}${paginationQuery(params)}`,
  );
}

export function listEventRoster(eventId: string) {
  return api<EventRosterRecord[]>(`/attendance/events/${eventId}/roster`);
}

export function joinRegisteredAttendee(
  eventId: string,
  registrationId: string,
) {
  return api<AttendanceRecord>(
    `/attendance/events/${eventId}/registrations/${registrationId}/join`,
    { method: "POST" },
  );
}

export function joinAttendeeByQrCode(checkInCode: string) {
  return api<AttendanceRecord>(
    `/attendance/registrations/qr/${checkInCode}/join`,
    { method: "POST" },
  );
}

export function registerAttendeeByEventQr(
  code: string,
  data: RegistrationForm,
) {
  return api<EventRosterRecord & { qrImage?: string }>(
    `/attendance/qr/${code}/register`,
    {
      method: "POST",
      body: JSON.stringify(cleanRegistrationForm(data)),
    },
  );
}

export function registerMeetingParticipantByQr(
  code: string,
  data: RegistrationForm,
) {
  return api<MeetingParticipant & { qrImage?: string }>(
    `/meetings/qr/${code}/join`,
    {
      method: "POST",
      body: JSON.stringify(cleanRegistrationForm(data)),
    },
  );
}

export function registerMeetingParticipant(
  meetingId: string,
  data: RegistrationForm,
) {
  return api<MeetingParticipant>(`/meetings/${meetingId}/participants`, {
    method: "POST",
    body: JSON.stringify(cleanRegistrationForm(data)),
  });
}

export function joinMeetingParticipantByQrCode(checkInCode: string) {
  return api<MeetingParticipant>(
    `/meetings/participants/qr/${checkInCode}/join`,
    { method: "POST" },
  );
}

export function cancelAttendance(attendanceId: string) {
  return api<{ cancelled: true }>(`/attendance/${attendanceId}`, {
    method: "DELETE",
  });
}

export function hasPermission(
  user: CurrentUser | undefined,
  permission: string,
) {
  return Boolean(user?.permissions.includes(permission));
}

function paginationQuery(
  params?: PaginationParams & { target?: "EVENT" | "MEETING" },
) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.pageSize) search.set("pageSize", String(params.pageSize));
  if (params?.target) search.set("target", params.target);
  const query = search.toString();
  return query ? `?${query}` : "";
}

function cleanRegistrationForm(data: RegistrationForm) {
  return {
    fullNameEn: data.fullNameEn.trim(),
    fullNameKm: data.fullNameKm?.trim() || undefined,
    gender: data.gender || undefined,
    position: data.position?.trim() || undefined,
    department: data.department?.trim() || undefined,
    shiftId: data.shiftId || undefined,
    placeId: data.placeId || undefined,
  };
}
