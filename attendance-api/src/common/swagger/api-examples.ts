export const apiSuccess = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message,
  timestamp: "2026-05-18T03:00:00.000Z",
  path: "/api/example",
});

export const apiError = {
  success: false,
  error: {
    code: "BAD_REQUEST",
    message: "Validation failed",
    details: ["name must be a string"],
  },
  statusCode: 400,
  timestamp: "2026-05-18T03:00:00.000Z",
  path: "/api/example",
};

export const alreadyJoinedError = {
  success: false,
  error: {
    code: "ALREADY_JOINED",
    message: "This user already joined the event.",
  },
  statusCode: 409,
  timestamp: "2026-05-18T03:00:00.000Z",
  path: "/api/attendance/qr/QR-CODE-EXAMPLE-123/join",
};

export const authSessionExample = apiSuccess({
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh",
  user: {
    id: "clxuser001",
    email: "admin@example.com",
    fullNameEn: "System Admin",
    permissions: ["events:create", "events:read", "attendance:read"],
  },
});

export const eventExample = {
  id: "clxevent001",
  name: "Khmer Tech Summit 2026",
  description: "Annual product and engineering attendance event.",
  mode: "BULK_REGISTRATION",
  locationName: "Not required",
  latitude: "0.0000000",
  longitude: "0.0000000",
  radiusMeters: 0,
  startsAt: "2026-06-01T01:30:00.000Z",
  endsAt: "2026-06-01T10:30:00.000Z",
  createdAt: "2026-05-18T03:00:00.000Z",
  updatedAt: "2026-05-18T03:00:00.000Z",
};

export const eventWithQrExample = apiSuccess({
  ...eventExample,
  qrCodes: [
    {
      id: "clxqr001",
      code: "QR-CODE-EXAMPLE-123",
      active: true,
      expiresAt: null,
      createdAt: "2026-05-18T03:00:00.000Z",
    },
  ],
  theme: {
    eventId: "clxevent001",
    primaryColor: "#2563eb",
    backgroundColor: "#f8fafc",
    backgroundImageUrl: null,
    fontFamily: "Inter",
    fontSize: 16,
    radius: 8,
    appearance: "system",
  },
  qrImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
});

export const registrationExample = {
  id: "clxregistration001",
  eventId: "clxevent001",
  fullNameEn: "Sok Dara",
  fullNameKm: "សុខ ដារ៉ា",
  gender: "MALE",
  position: "Engineering Manager",
  department: "Technology",
  source: "UPLOAD",
  createdAt: "2026-05-18T03:00:00.000Z",
};

export const attendanceExample = {
  id: "clxattendance001",
  eventId: "clxevent001",
  userId: null,
  registrationId: "clxregistration001",
  fullNameEn: "Sok Dara",
  fullNameKm: "សុខ ដារ៉ា",
  gender: "MALE",
  position: "Engineering Manager",
  department: "Technology",
  latitude: "0.0000000",
  longitude: "0.0000000",
  distanceMeters: 0,
  status: "JOINED",
  createdAt: "2026-05-18T03:00:00.000Z",
};

export const themeExample = apiSuccess({
  eventId: "clxevent001",
  primaryColor: "#2563eb",
  backgroundColor: "#f8fafc",
  backgroundImageUrl: "https://cdn.example.com/event-bg.jpg",
  fontFamily: "Inter",
  fontSize: 16,
  radius: 8,
  appearance: "system",
  createdAt: "2026-05-18T03:00:00.000Z",
  updatedAt: "2026-05-18T03:00:00.000Z",
});
