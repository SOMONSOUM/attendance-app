import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  AttendanceStatus,
  EventMode,
  Gender,
  MeetingParticipantStatus,
  PrismaClient,
  RegistrationTarget,
  ThemeAppearance,
} from "@prisma/client";
import { hash } from "bcryptjs";

type PermissionSeed = [resource: string, action: string];

type RoleSeed = {
  name: string;
  description: string;
  permissions: string[];
};

type UserSeed = {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameKm: string | null;
  gender: Gender;
  position: string;
  organization: string;
  role: string;
};

type RegistrationSeed = {
  id: string;
  fullNameEn: string;
  fullNameKm: string | null;
  gender: Gender;
  position: string;
  organization: string;
};

type ShiftSeed = {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
};

type PlaceSeed = {
  id: string;
  name: string;
  description: string;
  requireLocation: boolean;
  locationName: string;
  latitude: string;
  longitude: string;
  radiusMeters: number;
  code: string;
  registrations: RegistrationSeed[];
};

type TenantSeed = {
  id: string;
  name: string;
  slug: string;
  owner: UserSeed;
  users: UserSeed[];
};

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const prisma = new PrismaClient({ adapter });

const demoPassword = "password123";

const permissions: PermissionSeed[] = [
  ["events", "create"],
  ["events", "read"],
  ["events", "update"],
  ["events", "delete"],
  ["meetings", "create"],
  ["meetings", "read"],
  ["meetings", "update"],
  ["meetings", "delete"],
  ["places", "create"],
  ["places", "read"],
  ["places", "update"],
  ["places", "delete"],
  ["chairpersons", "create"],
  ["chairpersons", "read"],
  ["chairpersons", "update"],
  ["chairpersons", "delete"],
  ["registrations", "create"],
  ["registrations", "read"],
  ["attendance", "create"],
  ["attendance", "read"],
  ["users", "create"],
  ["users", "read"],
  ["users", "update"],
  ["users", "delete"],
  ["roles", "read"],
  ["roles", "create"],
  ["roles", "update"],
  ["roles", "delete"],
  ["theme", "update"],
  ["tenants", "read"],
  ["tenants", "update"],
];

const roles: RoleSeed[] = [
  {
    name: "admin",
    description: "Full application access for managing events and users.",
    permissions: permissions
      .filter(([resource]) => resource !== "tenants")
      .map(([resource, action]) => `${resource}:${action}`),
  },
  {
    name: "operator",
    description: "Can manage event check-in and view attendance records.",
    permissions: [
      "meetings:create",
      "meetings:read",
      "meetings:update",
      "places:create",
      "places:read",
      "places:update",
      "chairpersons:create",
      "chairpersons:read",
      "chairpersons:update",
      "events:read",
      "registrations:create",
      "registrations:read",
      "attendance:create",
      "attendance:read",
      "users:read",
      "roles:read",
    ],
  },
  {
    name: "viewer",
    description: "Read-only access for events and attendance.",
    permissions: [
      "events:read",
      "meetings:read",
      "places:read",
      "chairpersons:read",
      "registrations:read",
      "attendance:read",
    ],
  },
];

const users: UserSeed[] = [
  {
    id: "seed-user-admin",
    email: "admin@example.com",
    fullNameEn: "Admin User",
    fullNameKm: null,
    gender: Gender.OTHER,
    position: "System Administrator",
    organization: "Information Technology",
    role: "admin",
  },
  {
    id: "seed-user-operator",
    email: "operator@example.com",
    fullNameEn: "Event Operator",
    fullNameKm: null,
    gender: Gender.FEMALE,
    position: "Event Coordinator",
    organization: "Operations",
    role: "operator",
  },
  {
    id: "seed-user-viewer",
    email: "viewer@example.com",
    fullNameEn: "Attendance Viewer",
    fullNameKm: null,
    gender: Gender.MALE,
    position: "HR Officer",
    organization: "Human Resources",
    role: "viewer",
  },
];

const extraTenants: TenantSeed[] = [
  {
    id: "seed-tenant-ministry",
    name: "Ministry of Public Works",
    slug: "ministry-public-works",
    owner: {
      id: "seed-user-ministry-owner",
      email: "owner@mpw.gov.kh",
      fullNameEn: "Ministry Owner",
      fullNameKm: null,
      gender: Gender.OTHER,
      position: "Organization Director",
      organization: "Administration",
      role: "admin",
    },
    users: [
      {
        id: "seed-user-ministry-officer",
        email: "officer@mpw.gov.kh",
        fullNameEn: "Ministry Officer",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Event Officer",
        organization: "Operations",
        role: "operator",
      },
    ],
  },
  {
    id: "seed-tenant-university",
    name: "Cambodia Digital University",
    slug: "cambodia-digital-university",
    owner: {
      id: "seed-user-university-owner",
      email: "owner@cdu.edu.kh",
      fullNameEn: "University Owner",
      fullNameKm: null,
      gender: Gender.MALE,
      position: "Campus Administrator",
      organization: "Student Affairs",
      role: "admin",
    },
    users: [
      {
        id: "seed-user-university-viewer",
        email: "viewer@cdu.edu.kh",
        fullNameEn: "University Viewer",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "HR Assistant",
        organization: "Human Resources",
        role: "viewer",
      },
    ],
  },
];

const sampleEvent = {
  id: "seed-event-tech-summit-2026",
  tenantId: "default-tenant",
  name: "Khmer Tech Summit 2026",
  description:
    "Demo event with QR check-in, registrations, attendance, and theme data.",
  mode: EventMode.BULK_REGISTRATION,
  separateQrByPlace: false,
  requireLocation: true,
  locationName: "Phnom Penh Convention Center",
  latitude: "11.5564000",
  longitude: "104.9282000",
  radiusMeters: 250,
  startsAt: new Date("2026-06-01T01:30:00.000Z"),
  endsAt: new Date("2026-06-01T10:30:00.000Z"),
  createdById: "seed-user-admin",
};

const placeEvent = {
  id: "seed-event-product-expo-2026",
  tenantId: "default-tenant",
  name: "Product Expo 2026",
  description: "Demo event with separate QR codes for each hall and room.",
  mode: EventMode.BULK_REGISTRATION,
  separateQrByPlace: true,
  requireLocation: true,
  locationName: "Phnom Penh Exhibition Center",
  latitude: "11.5622000",
  longitude: "104.9160000",
  radiusMeters: 300,
  startsAt: new Date("2026-06-02T01:30:00.000Z"),
  endsAt: new Date("2026-06-02T10:30:00.000Z"),
  createdById: "seed-user-admin",
};

const openEvent = {
  id: "seed-event-community-open-day-2026",
  tenantId: "default-tenant",
  name: "Community Open Day 2026",
  description:
    "Demo open-registration event where attendees can scan and register at the door.",
  mode: EventMode.OPEN_REGISTRATION,
  separateQrByPlace: false,
  requireLocation: false,
  locationName: "Community Innovation Hub",
  latitude: "11.5681000",
  longitude: "104.9223000",
  radiusMeters: 180,
  startsAt: new Date("2026-06-03T01:30:00.000Z"),
  endsAt: new Date("2026-06-03T10:30:00.000Z"),
  createdById: "seed-user-admin",
};

const preRegistrationEvent = {
  id: "seed-event-developer-clinic-2026",
  tenantId: "default-tenant",
  name: "Developer Clinic 2026",
  description:
    "Demo pre-registration event where attendees register before arrival.",
  mode: EventMode.PRE_REGISTRATION,
  separateQrByPlace: false,
  requireLocation: false,
  locationName: "Online pre-registration desk",
  latitude: "0.0000000",
  longitude: "0.0000000",
  radiusMeters: 0,
  startsAt: new Date("2026-06-07T01:30:00.000Z"),
  endsAt: new Date("2026-06-07T05:30:00.000Z"),
  createdById: "seed-user-admin",
};

const sampleTheme = {
  primaryColor: "#2563eb",
  backgroundColor: "#f8fafc",
  backgroundImageUrl: null,
  fontFamily: "Google Sans",
  fontSize: 16,
  radius: 8,
  appearance: ThemeAppearance.system,
};

const placeEventTheme = {
  primaryColor: "#0f766e",
  backgroundColor: "#f7fbf9",
  backgroundImageUrl: null,
  fontFamily: "Google Sans",
  fontSize: 16,
  radius: 8,
  appearance: ThemeAppearance.system,
};

const openEventTheme = {
  primaryColor: "#7c3aed",
  backgroundColor: "#fbf8ff",
  backgroundImageUrl: null,
  fontFamily: "Google Sans",
  fontSize: 16,
  radius: 10,
  appearance: ThemeAppearance.system,
};

const preRegistrationEventTheme = {
  primaryColor: "#be123c",
  backgroundColor: "#fff8fa",
  backgroundImageUrl: null,
  fontFamily: "Google Sans",
  fontSize: 16,
  radius: 8,
  appearance: ThemeAppearance.system,
};

const sampleShifts: ShiftSeed[] = [
  {
    id: "seed-shift-morning",
    name: "Morning shift",
    startTime: new Date("1970-01-01T07:00:00.000Z"),
    endTime: new Date("1970-01-01T12:00:00.000Z"),
  },
  {
    id: "seed-shift-afternoon",
    name: "Afternoon shift",
    startTime: new Date("1970-01-01T14:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
];

const placeEventShifts: ShiftSeed[] = [
  {
    id: "seed-shift-expo-morning",
    name: "Morning shift",
    startTime: new Date("1970-01-01T07:00:00.000Z"),
    endTime: new Date("1970-01-01T12:00:00.000Z"),
  },
  {
    id: "seed-shift-expo-afternoon",
    name: "Afternoon shift",
    startTime: new Date("1970-01-01T14:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
];

const openEventShifts: ShiftSeed[] = [
  {
    id: "seed-shift-open-day-morning",
    name: "Morning entry",
    startTime: new Date("1970-01-01T08:00:00.000Z"),
    endTime: new Date("1970-01-01T12:00:00.000Z"),
  },
  {
    id: "seed-shift-open-day-afternoon",
    name: "Afternoon entry",
    startTime: new Date("1970-01-01T13:30:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  },
];

const openEventAttendances = [
  {
    id: "seed-attendance-open-day-dina",
    shiftId: "seed-shift-open-day-morning",
    fullNameEn: "Dina Pov",
    fullNameKm: null,
    gender: Gender.FEMALE,
    position: "Student",
    organization: "Open Visitor",
  },
  {
    id: "seed-attendance-open-day-mony",
    shiftId: "seed-shift-open-day-afternoon",
    fullNameEn: "Mony Keo",
    fullNameKm: null,
    gender: Gender.MALE,
    position: "Founder",
    organization: "Startup Community",
  },
];

const registrations: RegistrationSeed[] = [
  {
    id: "seed-registration-sok-dara",
    fullNameEn: "Sok Dara",
    fullNameKm: "សុខ ដារ៉ា",
    gender: Gender.MALE,
    position: "Software Engineer",
    organization: "Engineering",
  },
  {
    id: "seed-registration-chan-sophea",
    fullNameEn: "Chan Sophea",
    fullNameKm: "ចាន សុភា",
    gender: Gender.FEMALE,
    position: "Product Manager",
    organization: "Product",
  },
  {
    id: "seed-registration-kim-sovann",
    fullNameEn: "Kim Sovann",
    fullNameKm: "គីម សុវណ្ណ",
    gender: Gender.OTHER,
    position: "Designer",
    organization: "Creative",
  },
];

const placeSeeds: PlaceSeed[] = [
  {
    id: "seed-place-expo-main-hall",
    name: "Main Hall",
    description: "Main product showcase and partner booths.",
    requireLocation: true,
    locationName: "Hall A",
    latitude: "11.5622100",
    longitude: "104.9160500",
    radiusMeters: 120,
    code: "DEMO-EXPO-MAIN-HALL",
    registrations: [
      {
        id: "seed-registration-expo-sreynich",
        fullNameEn: "Sreynich Mao",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Marketing Lead",
        organization: "Marketing",
      },
      {
        id: "seed-registration-expo-vuthy",
        fullNameEn: "Vuthy Long",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Sales Manager",
        organization: "Sales",
      },
    ],
  },
  {
    id: "seed-place-expo-workshop-room",
    name: "Workshop Room",
    description: "Hands-on product demos and customer workshops.",
    requireLocation: false,
    locationName: "Room 204",
    latitude: "0.0000000",
    longitude: "0.0000000",
    radiusMeters: 0,
    code: "DEMO-EXPO-WORKSHOP",
    registrations: [
      {
        id: "seed-registration-expo-rithy",
        fullNameEn: "Rithy Chan",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Solutions Engineer",
        organization: "Engineering",
      },
      {
        id: "seed-registration-expo-sophea",
        fullNameEn: "Sophea Lim",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Customer Success",
        organization: "Customer Success",
      },
    ],
  },
];

const boardMeeting = {
  id: "seed-meeting-board-briefing-2026",
  tenantId: "default-tenant",
  name: "Board Briefing 2026",
  description:
    "Demo pre-registration meeting with chairpersons and invited participants.",
  mode: EventMode.BULK_REGISTRATION,
  separateQrByPlace: false,
  requireLocation: true,
  locationName: "Executive Meeting Room",
  latitude: "11.5564000",
  longitude: "104.9282000",
  radiusMeters: 120,
  startsAt: new Date("2026-06-04T02:00:00.000Z"),
  endsAt: new Date("2026-06-04T04:30:00.000Z"),
  createdById: "seed-user-admin",
};

const boardMeetingChairpersons = [
  {
    id: "seed-chairperson-board-sokha",
    honorificTitleEn: "Dr.",
    honorificTitleKm: "បណ្ឌិត",
    firstNameEn: "Sokha",
    firstNameKm: "សុខា",
    lastNameEn: "Mao",
    lastNameKm: "ម៉ៅ",
    position: "Chairperson",
    organization: "Default Tenant",
  },
];

const boardMeetingParticipants: RegistrationSeed[] = [
  {
    id: "seed-meeting-participant-board-sopheak",
    fullNameEn: "Sopheak Vann",
    fullNameKm: null,
    gender: Gender.MALE,
    position: "Finance Manager",
    organization: "Finance",
  },
  {
    id: "seed-meeting-participant-board-davy",
    fullNameEn: "Davy Chhem",
    fullNameKm: null,
    gender: Gender.FEMALE,
    position: "Legal Advisor",
    organization: "Legal",
  },
];

const boardMeetingShifts: ShiftSeed[] = [
  {
    id: "seed-meeting-shift-board-session",
    name: "Board session",
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T11:30:00.000Z"),
  },
];

const placeMeeting = {
  id: "seed-meeting-committee-workshops-2026",
  tenantId: "default-tenant",
  name: "Committee Workshops 2026",
  description: "Demo meeting with separate QR codes for each workshop room.",
  mode: EventMode.BULK_REGISTRATION,
  separateQrByPlace: true,
  requireLocation: false,
  locationName: "Administration Building",
  latitude: "0.0000000",
  longitude: "0.0000000",
  radiusMeters: 0,
  startsAt: new Date("2026-06-05T02:00:00.000Z"),
  endsAt: new Date("2026-06-05T07:00:00.000Z"),
  createdById: "seed-user-admin",
};

const placeMeetingChairpersons = [
  {
    id: "seed-chairperson-committee-sreyneang",
    honorificTitleEn: "H.E.",
    honorificTitleKm: "ឯកឧត្តម",
    firstNameEn: "Sreyneang",
    firstNameKm: "ស្រីនាង",
    lastNameEn: "Keo",
    lastNameKm: "កែវ",
    position: "Committee Chairperson",
    organization: "Default Tenant",
  },
];

const meetingPlaceSeeds = [
  {
    id: "seed-meeting-place-policy-room",
    name: "Policy Room",
    description: "Policy review and planning discussion.",
    requireLocation: true,
    locationName: "Room 301",
    latitude: "11.5564300",
    longitude: "104.9282400",
    radiusMeters: 80,
    code: "DEMO-MEETING-POLICY-ROOM",
    participants: [
      {
        id: "seed-meeting-participant-policy-rina",
        fullNameEn: "Rina Hul",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Policy Analyst",
        organization: "Planning",
      },
      {
        id: "seed-meeting-participant-policy-vireak",
        fullNameEn: "Vireak Touch",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Project Lead",
        organization: "Programs",
      },
    ],
  },
  {
    id: "seed-meeting-place-budget-room",
    name: "Budget Room",
    description: "Budget planning and procurement discussion.",
    requireLocation: false,
    locationName: "Room 302",
    latitude: "0.0000000",
    longitude: "0.0000000",
    radiusMeters: 0,
    code: "DEMO-MEETING-BUDGET-ROOM",
    participants: [
      {
        id: "seed-meeting-participant-budget-malis",
        fullNameEn: "Malis Sim",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Procurement Officer",
        organization: "Procurement",
      },
      {
        id: "seed-meeting-participant-budget-bora",
        fullNameEn: "Bora Seng",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Accountant",
        organization: "Finance",
      },
    ],
  },
];

const committeeMeetingShifts: ShiftSeed[] = [
  {
    id: "seed-meeting-shift-policy-workshop",
    name: "Policy workshop",
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T11:30:00.000Z"),
  },
  {
    id: "seed-meeting-shift-budget-workshop",
    name: "Budget workshop",
    startTime: new Date("1970-01-01T13:00:00.000Z"),
    endTime: new Date("1970-01-01T15:30:00.000Z"),
  },
];

const openMeeting = {
  id: "seed-meeting-public-townhall-2026",
  tenantId: "default-tenant",
  name: "Public Townhall 2026",
  description:
    "Demo open-registration meeting that requires location during QR check-in.",
  mode: EventMode.OPEN_REGISTRATION,
  separateQrByPlace: false,
  requireLocation: true,
  locationName: "Community Innovation Hub",
  latitude: "11.5681000",
  longitude: "104.9223000",
  radiusMeters: 180,
  startsAt: new Date("2026-06-06T02:00:00.000Z"),
  endsAt: new Date("2026-06-06T05:00:00.000Z"),
  createdById: "seed-user-admin",
};

const preRegistrationMeeting = {
  id: "seed-meeting-research-roundtable-2026",
  tenantId: "default-tenant",
  name: "Research Roundtable 2026",
  description:
    "Demo pre-registration meeting where participants sign up before arrival.",
  mode: EventMode.PRE_REGISTRATION,
  separateQrByPlace: false,
  requireLocation: false,
  locationName: "Roundtable registration desk",
  latitude: "0.0000000",
  longitude: "0.0000000",
  radiusMeters: 0,
  startsAt: new Date("2026-06-08T02:00:00.000Z"),
  endsAt: new Date("2026-06-08T04:00:00.000Z"),
  createdById: "seed-user-admin",
};

const preRegistrationMeetingChairpersons = [
  {
    id: "seed-chairperson-roundtable-sovann",
    honorificTitleEn: "Ms.",
    honorificTitleKm: "លោកស្រី",
    firstNameEn: "Sovann",
    firstNameKm: "សុវណ្ណ",
    lastNameEn: "Kim",
    lastNameKm: "គីម",
    position: "Research Lead",
    organization: "Default Tenant",
  },
];

const openMeetingChairpersons = [
  {
    id: "seed-chairperson-townhall-dara",
    honorificTitleEn: "Mr.",
    honorificTitleKm: "លោក",
    firstNameEn: "Dara",
    firstNameKm: "ដារ៉ា",
    lastNameEn: "Sok",
    lastNameKm: "សុខ",
    position: "Community Lead",
    organization: "Default Tenant",
  },
];

const openMeetingParticipants = [
  {
    id: "seed-meeting-participant-townhall-vicheka",
    fullNameEn: "Vicheka Nuon",
    fullNameKm: null,
    gender: Gender.FEMALE,
    position: "Community Visitor",
    organization: "Public",
    latitude: "11.5681300",
    longitude: "104.9223500",
    distanceMeters: 10,
  },
];

const openMeetingShifts: ShiftSeed[] = [
  {
    id: "seed-meeting-shift-townhall-main",
    name: "Townhall session",
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T12:00:00.000Z"),
  },
];

const preRegistrationMeetingShifts: ShiftSeed[] = [
  {
    id: "seed-meeting-shift-roundtable-main",
    name: "Roundtable session",
    startTime: new Date("1970-01-01T09:00:00.000Z"),
    endTime: new Date("1970-01-01T11:00:00.000Z"),
  },
];

async function resetDatabase() {
  await prisma.attendance.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.eventQrCode.deleteMany();
  await prisma.meetingQrCode.deleteMany();
  await prisma.eventPlace.deleteMany();
  await prisma.meetingPlace.deleteMany();
  await prisma.meetingShift.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.registrationImportRow.deleteMany();
  await prisma.registrationImport.deleteMany();
  await prisma.eventTheme.deleteMany();
  await prisma.eventShift.deleteMany();
  await prisma.event.deleteMany();
  await prisma.place.deleteMany();
  await prisma.chairperson.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tenant.deleteMany();
}

function eventDataFrom<T extends { id: string } & Record<string, unknown>>(seed: T) {
  const {
    id,
    requireLocation,
    locationName,
    latitude,
    longitude,
    radiusMeters,
    ...data
  } = seed;
  return data;
}

function meetingDataFrom<T extends { id: string } & Record<string, unknown>>(seed: T) {
  const {
    id,
    requireLocation,
    locationName,
    latitude,
    longitude,
    radiusMeters,
    ...data
  } = seed;
  return data;
}

async function seedDefaultEventPlace(event: {
  id: string;
  requireLocation: boolean;
  locationName: string;
  latitude: string;
  longitude: string;
  radiusMeters: number;
}) {
  return prisma.eventPlace.upsert({
    where: { id: `${event.id}-place` },
    update: {
      eventId: event.id,
      name: event.locationName,
      requireLocation: event.requireLocation,
      locationName: event.locationName,
      latitude: event.requireLocation ? event.latitude : null,
      longitude: event.requireLocation ? event.longitude : null,
      radiusMeters: event.requireLocation ? event.radiusMeters : 0,
    },
    create: {
      id: `${event.id}-place`,
      eventId: event.id,
      name: event.locationName,
      requireLocation: event.requireLocation,
      locationName: event.locationName,
      latitude: event.requireLocation ? event.latitude : null,
      longitude: event.requireLocation ? event.longitude : null,
      radiusMeters: event.requireLocation ? event.radiusMeters : 0,
    },
  });
}

async function seedDefaultMeetingPlace(meeting: {
  id: string;
  requireLocation: boolean;
  locationName: string;
  latitude: string;
  longitude: string;
  radiusMeters: number;
}) {
  return prisma.meetingPlace.upsert({
    where: { id: `${meeting.id}-place` },
    update: {
      meetingId: meeting.id,
      name: meeting.locationName,
      requireLocation: meeting.requireLocation,
      locationName: meeting.locationName,
      latitude: meeting.requireLocation ? meeting.latitude : null,
      longitude: meeting.requireLocation ? meeting.longitude : null,
      radiusMeters: meeting.requireLocation ? meeting.radiusMeters : 0,
    },
    create: {
      id: `${meeting.id}-place`,
      meetingId: meeting.id,
      name: meeting.locationName,
      requireLocation: meeting.requireLocation,
      locationName: meeting.locationName,
      latitude: meeting.requireLocation ? meeting.latitude : null,
      longitude: meeting.requireLocation ? meeting.longitude : null,
      radiusMeters: meeting.requireLocation ? meeting.radiusMeters : 0,
    },
  });
}

async function seedTenant() {
  return prisma.tenant.upsert({
    where: { slug: "default" },
    update: { name: "Default Tenant" },
    create: {
      id: "default-tenant",
      name: "Default Tenant",
      slug: "default",
    },
  });
}

async function seedExtraTenants(
  permissionByKey: Map<string, { id: string }>,
  passwordHash: string,
) {
  for (const tenantSeed of extraTenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSeed.slug },
      update: { name: tenantSeed.name },
      create: {
        id: tenantSeed.id,
        name: tenantSeed.name,
        slug: tenantSeed.slug,
      },
    });
    const roleByName = await seedRoles(tenant.id, permissionByKey);
    await seedUsers(tenant.id, roleByName, passwordHash, [
      tenantSeed.owner,
      ...tenantSeed.users,
    ]);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { ownerUserId: tenantSeed.owner.id },
    });
  }
}

async function seedPermissions() {
  const created = new Map<string, { id: string }>();

  for (const [resource, action] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
    created.set(`${resource}:${action}`, permission);
  }

  return created;
}

async function seedRoles(
  tenantId: string,
  permissionByKey: Map<string, { id: string }>,
  includePlatformPermissions = false,
) {
  const created = new Map<string, { id: string; name: string }>();

  for (const roleSeed of roles) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: roleSeed.name } },
      update: { description: roleSeed.description },
      create: {
        tenantId,
        name: roleSeed.name,
        description: roleSeed.description,
      },
    });

    const rolePermissions =
      includePlatformPermissions && roleSeed.name === "admin"
        ? [...roleSeed.permissions, "tenants:read", "tenants:update"]
        : roleSeed.permissions;

    for (const permissionKey of rolePermissions) {
      const permission = permissionByKey.get(permissionKey);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    created.set(role.name, role);
  }

  return created;
}

async function seedUsers(
  tenantId: string,
  roleByName: Map<string, { id: string; name: string }>,
  passwordHash: string,
  userSeeds = users,
) {
  for (const userSeed of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        passwordHash,
        tenantId,
        fullNameEn: userSeed.fullNameEn,
        fullNameKm: userSeed.fullNameKm,
        gender: userSeed.gender,
        position: userSeed.position,
        organization: userSeed.organization,
      },
      create: {
        id: userSeed.id,
        email: userSeed.email,
        tenantId,
        passwordHash,
        fullNameEn: userSeed.fullNameEn,
        fullNameKm: userSeed.fullNameKm,
        gender: userSeed.gender,
        position: userSeed.position,
        organization: userSeed.organization,
      },
    });

    const role = roleByName.get(userSeed.role);
    if (!role) continue;

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }
}

async function seedRegistrationImports() {
  const imports = [
    {
      id: "seed-import-tech-summit",
      fileName: "tech-summit-guests.xlsx",
      originalName: "tech-summit-guests.xlsx",
      target: RegistrationTarget.EVENT,
      uploadedById: "seed-user-admin",
      registrations,
    },
    {
      id: "seed-import-product-expo-main-hall",
      fileName: "product-expo-main-hall.xlsx",
      originalName: "product-expo-main-hall.xlsx",
      target: RegistrationTarget.EVENT,
      uploadedById: "seed-user-operator",
      registrations: placeSeeds[0].registrations,
    },
    {
      id: "seed-import-product-expo-workshop.xlsx",
      fileName: "product-expo-workshop.xlsx",
      originalName: "product-expo-workshop.xlsx",
      target: RegistrationTarget.EVENT,
      uploadedById: "seed-user-operator",
      registrations: placeSeeds[1].registrations,
    },
    {
      id: "seed-import-board-briefing",
      fileName: "board-briefing-participants.xlsx",
      originalName: "board-briefing-participants.xlsx",
      target: RegistrationTarget.MEETING,
      uploadedById: "seed-user-admin",
      registrations: boardMeetingParticipants,
    },
    {
      id: "seed-import-committee-policy-room",
      fileName: "committee-policy-room-participants.xlsx",
      originalName: "committee-policy-room-participants.xlsx",
      target: RegistrationTarget.MEETING,
      uploadedById: "seed-user-operator",
      registrations: meetingPlaceSeeds[0].participants,
    },
  ];

  for (const importSeed of imports) {
    const created = await prisma.registrationImport.upsert({
      where: { id: importSeed.id },
      update: {
        fileName: importSeed.fileName,
        tenantId: "default-tenant",
        originalName: importSeed.originalName,
        target: importSeed.target,
        rowCount: importSeed.registrations.length,
        status: "IMPORTED",
        uploadedById: importSeed.uploadedById,
      },
      create: {
        id: importSeed.id,
        tenantId: "default-tenant",
        fileName: importSeed.fileName,
        originalName: importSeed.originalName,
        target: importSeed.target,
        rowCount: importSeed.registrations.length,
        status: "IMPORTED",
        uploadedById: importSeed.uploadedById,
      },
    });

    await prisma.registrationImportRow.deleteMany({
      where: { importId: created.id },
    });
    await prisma.registrationImportRow.createMany({
      data: importSeed.registrations.map((registration) => ({
        importId: created.id,
        fullNameEn: registration.fullNameEn,
        fullNameKm: registration.fullNameKm,
        gender: registration.gender,
        position: registration.position,
        organization: registration.organization,
      })),
    });
  }
}

async function seedEvent() {
  const eventId = sampleEvent.id;
  const eventData = eventDataFrom(sampleEvent);
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: { id: eventId, ...eventData },
  });
  const place = await seedDefaultEventPlace(sampleEvent);

  await prisma.eventQrCode.upsert({
    where: { code: "DEMO-TECH-SUMMIT-2026" },
    update: {
      eventId: event.id,
      placeId: place.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-TECH-SUMMIT-2026",
      eventId: event.id,
      placeId: place.id,
      active: true,
    },
  });

  await prisma.eventTheme.upsert({
    where: { eventId: event.id },
    update: sampleTheme,
    create: {
      eventId: event.id,
      ...sampleTheme,
    },
  });

  for (const shiftSeed of sampleShifts) {
    await prisma.eventShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        eventId: event.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        eventId: event.id,
      },
    });
  }

  for (const [index, registrationSeed] of registrations.entries()) {
    const { id: registrationId, ...registrationData } = registrationSeed;
    const shiftId = sampleShifts[index % sampleShifts.length].id;

    await prisma.eventRegistration.upsert({
      where: { id: registrationId },
      update: {
        eventId: event.id,
        shiftId,
        ...registrationData,
        checkInCode: `${registrationId}-qr`,
        source: "SEED",
      },
      create: {
        id: registrationId,
        eventId: event.id,
        shiftId,
        ...registrationData,
        checkInCode: `${registrationId}-qr`,
        source: "SEED",
      },
    });
  }

  const checkedInRegistration = registrations[0];

  await prisma.attendance.upsert({
    where: {
      eventId_registrationId: {
        eventId: event.id,
        registrationId: checkedInRegistration.id,
      },
    },
    update: {
      shiftId: sampleShifts[0].id,
      fullNameEn: checkedInRegistration.fullNameEn,
      fullNameKm: "សុខ ដារ៉ា",
      gender: checkedInRegistration.gender,
      position: checkedInRegistration.position,
      organization: checkedInRegistration.organization,
      latitude: "11.5564500",
      longitude: "104.9282500",
      distanceMeters: 8,
      status: AttendanceStatus.JOINED,
    },
    create: {
      eventId: event.id,
      registrationId: checkedInRegistration.id,
      shiftId: sampleShifts[0].id,
      userId: "seed-user-admin",
      fullNameEn: checkedInRegistration.fullNameEn,
      fullNameKm: "សុខ ដារ៉ា",
      gender: checkedInRegistration.gender,
      position: checkedInRegistration.position,
      organization: checkedInRegistration.organization,
      latitude: "11.5564500",
      longitude: "104.9282500",
      distanceMeters: 8,
      status: AttendanceStatus.JOINED,
    },
  });
}

async function seedPlaceEvent() {
  const eventId = placeEvent.id;
  const eventData = eventDataFrom(placeEvent);
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: { id: eventId, ...eventData },
  });

  await prisma.eventTheme.upsert({
    where: { eventId: event.id },
    update: placeEventTheme,
    create: {
      eventId: event.id,
      ...placeEventTheme,
    },
  });

  for (const shiftSeed of placeEventShifts) {
    await prisma.eventShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        eventId: event.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        eventId: event.id,
      },
    });
  }

  for (const placeSeed of placeSeeds) {
    const place = await prisma.eventPlace.upsert({
      where: { id: placeSeed.id },
      update: {
        eventId: event.id,
        name: placeSeed.name,
        description: placeSeed.description,
        requireLocation: placeSeed.requireLocation,
        locationName: placeSeed.locationName,
        latitude: placeSeed.requireLocation ? placeSeed.latitude : null,
        longitude: placeSeed.requireLocation ? placeSeed.longitude : null,
        radiusMeters: placeSeed.requireLocation ? placeSeed.radiusMeters : 0,
      },
      create: {
        id: placeSeed.id,
        eventId: event.id,
        name: placeSeed.name,
        description: placeSeed.description,
        requireLocation: placeSeed.requireLocation,
        locationName: placeSeed.locationName,
        latitude: placeSeed.requireLocation ? placeSeed.latitude : null,
        longitude: placeSeed.requireLocation ? placeSeed.longitude : null,
        radiusMeters: placeSeed.requireLocation ? placeSeed.radiusMeters : 0,
      },
    });

    await prisma.eventQrCode.upsert({
      where: { code: placeSeed.code },
      update: {
        eventId: event.id,
        placeId: place.id,
        active: true,
        expiresAt: null,
      },
      create: {
        code: placeSeed.code,
        eventId: event.id,
        placeId: place.id,
        active: true,
      },
    });

    for (const [index, registrationSeed] of placeSeed.registrations.entries()) {
      const { id: registrationId, ...registrationData } = registrationSeed;
      const shiftId = placeEventShifts[index % placeEventShifts.length].id;

      await prisma.eventRegistration.upsert({
        where: { id: registrationId },
        update: {
          eventId: event.id,
          placeId: place.id,
          shiftId,
          ...registrationData,
          checkInCode: `${registrationId}-qr`,
          source: "SEED",
        },
        create: {
          id: registrationId,
          eventId: event.id,
          placeId: place.id,
          shiftId,
          ...registrationData,
          checkInCode: `${registrationId}-qr`,
          source: "SEED",
        },
      });
    }
  }

  const checkedInMainHall = placeSeeds[0].registrations[0];
  const checkedInWorkshop = placeSeeds[1].registrations[0];

  for (const [placeSeed, registrationSeed, shiftSeed] of [
    [placeSeeds[0], checkedInMainHall, placeEventShifts[0]],
    [placeSeeds[1], checkedInWorkshop, placeEventShifts[1]],
  ] as const) {
    await prisma.attendance.upsert({
      where: {
        eventId_registrationId: {
          eventId: event.id,
          registrationId: registrationSeed.id,
        },
      },
      update: {
        placeId: placeSeed.id,
        shiftId: shiftSeed.id,
        fullNameEn: registrationSeed.fullNameEn,
        fullNameKm: registrationSeed.fullNameKm,
        gender: registrationSeed.gender,
        position: registrationSeed.position,
        organization: registrationSeed.organization,
        latitude: "11.5622100",
        longitude: "104.9160500",
        distanceMeters: 12,
        status: AttendanceStatus.JOINED,
      },
      create: {
        eventId: event.id,
        placeId: placeSeed.id,
        shiftId: shiftSeed.id,
        registrationId: registrationSeed.id,
        userId: "seed-user-operator",
        fullNameEn: registrationSeed.fullNameEn,
        fullNameKm: registrationSeed.fullNameKm,
        gender: registrationSeed.gender,
        position: registrationSeed.position,
        organization: registrationSeed.organization,
        latitude: "11.5622100",
        longitude: "104.9160500",
        distanceMeters: 12,
        status: AttendanceStatus.JOINED,
      },
    });
  }
}

async function seedMeetings() {
  const boardMeetingId = boardMeeting.id;
  const boardMeetingData = meetingDataFrom(boardMeeting);
  const board = await prisma.meeting.upsert({
    where: { id: boardMeetingId },
    update: boardMeetingData,
    create: { id: boardMeetingId, ...boardMeetingData },
  });
  const boardPlace = await seedDefaultMeetingPlace(boardMeeting);

  for (const chairpersonSeed of boardMeetingChairpersons) {
    await prisma.chairperson.upsert({
      where: { id: chairpersonSeed.id },
      update: {
        meetingId: board.id,
        honorificTitleEn: chairpersonSeed.honorificTitleEn,
        honorificTitleKm: chairpersonSeed.honorificTitleKm,
        firstNameEn: chairpersonSeed.firstNameEn,
        firstNameKm: chairpersonSeed.firstNameKm,
        lastNameEn: chairpersonSeed.lastNameEn,
        lastNameKm: chairpersonSeed.lastNameKm,
        position: chairpersonSeed.position,
        organization: chairpersonSeed.organization,
      },
      create: {
        ...chairpersonSeed,
        meetingId: board.id,
      },
    });
  }

  await prisma.meetingQrCode.upsert({
    where: { code: "DEMO-BOARD-BRIEFING-2026" },
    update: {
      meetingId: board.id,
      placeId: boardPlace.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-BOARD-BRIEFING-2026",
      meetingId: board.id,
      placeId: boardPlace.id,
      active: true,
    },
  });

  for (const shiftSeed of boardMeetingShifts) {
    await prisma.meetingShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        meetingId: board.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        meetingId: board.id,
      },
    });
  }

  for (const participantSeed of boardMeetingParticipants) {
    const { id: participantId, ...participantData } = participantSeed;
    const joined = participantId === "seed-meeting-participant-board-sopheak";

    await prisma.meetingParticipant.upsert({
      where: { id: participantId },
      update: {
        meetingId: board.id,
        placeId: null,
        shiftId: boardMeetingShifts[0].id,
        ...participantData,
        checkInCode: `${participantId}-qr`,
        status: joined
          ? MeetingParticipantStatus.JOINED
          : MeetingParticipantStatus.INVITED,
        joinedAt: joined ? new Date("2026-06-04T02:15:00.000Z") : null,
        latitude: joined ? "11.5564300" : null,
        longitude: joined ? "104.9282400" : null,
        distanceMeters: joined ? 6 : 0,
        source: "SEED",
      },
      create: {
        id: participantId,
        meetingId: board.id,
        shiftId: boardMeetingShifts[0].id,
        ...participantData,
        checkInCode: `${participantId}-qr`,
        status: joined
          ? MeetingParticipantStatus.JOINED
          : MeetingParticipantStatus.INVITED,
        joinedAt: joined ? new Date("2026-06-04T02:15:00.000Z") : null,
        latitude: joined ? "11.5564300" : null,
        longitude: joined ? "104.9282400" : null,
        distanceMeters: joined ? 6 : 0,
        source: "SEED",
      },
    });
  }

  const placeMeetingId = placeMeeting.id;
  const placeMeetingData = meetingDataFrom(placeMeeting);
  const committee = await prisma.meeting.upsert({
    where: { id: placeMeetingId },
    update: placeMeetingData,
    create: { id: placeMeetingId, ...placeMeetingData },
  });

  for (const chairpersonSeed of placeMeetingChairpersons) {
    await prisma.chairperson.upsert({
      where: { id: chairpersonSeed.id },
      update: {
        meetingId: committee.id,
        honorificTitleEn: chairpersonSeed.honorificTitleEn,
        honorificTitleKm: chairpersonSeed.honorificTitleKm,
        firstNameEn: chairpersonSeed.firstNameEn,
        firstNameKm: chairpersonSeed.firstNameKm,
        lastNameEn: chairpersonSeed.lastNameEn,
        lastNameKm: chairpersonSeed.lastNameKm,
        position: chairpersonSeed.position,
        organization: chairpersonSeed.organization,
      },
      create: {
        ...chairpersonSeed,
        meetingId: committee.id,
      },
    });
  }

  for (const shiftSeed of committeeMeetingShifts) {
    await prisma.meetingShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        meetingId: committee.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        meetingId: committee.id,
      },
    });
  }

  for (const placeSeed of meetingPlaceSeeds) {
    const place = await prisma.meetingPlace.upsert({
      where: { id: placeSeed.id },
      update: {
        meetingId: committee.id,
        name: placeSeed.name,
        description: placeSeed.description,
        requireLocation: placeSeed.requireLocation,
        locationName: placeSeed.locationName,
        latitude: placeSeed.requireLocation ? placeSeed.latitude : null,
        longitude: placeSeed.requireLocation ? placeSeed.longitude : null,
        radiusMeters: placeSeed.requireLocation ? placeSeed.radiusMeters : 0,
      },
      create: {
        id: placeSeed.id,
        meetingId: committee.id,
        name: placeSeed.name,
        description: placeSeed.description,
        requireLocation: placeSeed.requireLocation,
        locationName: placeSeed.locationName,
        latitude: placeSeed.requireLocation ? placeSeed.latitude : null,
        longitude: placeSeed.requireLocation ? placeSeed.longitude : null,
        radiusMeters: placeSeed.requireLocation ? placeSeed.radiusMeters : 0,
      },
    });

    await prisma.meetingQrCode.upsert({
    where: { code: placeSeed.code },
    update: {
        meetingId: committee.id,
        placeId: place.id,
        active: true,
        expiresAt: null,
      },
      create: {
        code: placeSeed.code,
        meetingId: committee.id,
        placeId: place.id,
        active: true,
      },
    });

    for (const participantSeed of placeSeed.participants) {
      const { id: participantId, ...participantData } = participantSeed;
      const shiftId =
        placeSeed.id === "seed-meeting-place-policy-room"
          ? committeeMeetingShifts[0].id
          : committeeMeetingShifts[1].id;

      await prisma.meetingParticipant.upsert({
        where: { id: participantId },
        update: {
          meetingId: committee.id,
          placeId: place.id,
          shiftId,
          ...participantData,
          checkInCode: `${participantId}-qr`,
          status: MeetingParticipantStatus.INVITED,
          source: "SEED",
        },
        create: {
          id: participantId,
          meetingId: committee.id,
          placeId: place.id,
          shiftId,
          ...participantData,
          checkInCode: `${participantId}-qr`,
          status: MeetingParticipantStatus.INVITED,
          source: "SEED",
        },
      });
    }
  }

  const openMeetingId = openMeeting.id;
  const openMeetingData = meetingDataFrom(openMeeting);
  const townhall = await prisma.meeting.upsert({
    where: { id: openMeetingId },
    update: openMeetingData,
    create: { id: openMeetingId, ...openMeetingData },
  });
  const townhallPlace = await seedDefaultMeetingPlace(openMeeting);

  for (const chairpersonSeed of openMeetingChairpersons) {
    await prisma.chairperson.upsert({
      where: { id: chairpersonSeed.id },
      update: {
        meetingId: townhall.id,
        honorificTitleEn: chairpersonSeed.honorificTitleEn,
        honorificTitleKm: chairpersonSeed.honorificTitleKm,
        firstNameEn: chairpersonSeed.firstNameEn,
        firstNameKm: chairpersonSeed.firstNameKm,
        lastNameEn: chairpersonSeed.lastNameEn,
        lastNameKm: chairpersonSeed.lastNameKm,
        position: chairpersonSeed.position,
        organization: chairpersonSeed.organization,
      },
      create: {
        ...chairpersonSeed,
        meetingId: townhall.id,
      },
    });
  }

  await prisma.meetingQrCode.upsert({
    where: { code: "DEMO-PUBLIC-TOWNHALL-2026" },
    update: {
      meetingId: townhall.id,
      placeId: townhallPlace.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-PUBLIC-TOWNHALL-2026",
      meetingId: townhall.id,
      placeId: townhallPlace.id,
      active: true,
    },
  });

  for (const shiftSeed of openMeetingShifts) {
    await prisma.meetingShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        meetingId: townhall.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        meetingId: townhall.id,
      },
    });
  }

  for (const participantSeed of openMeetingParticipants) {
    const { id: participantId, ...participantData } = participantSeed;

    await prisma.meetingParticipant.upsert({
      where: { id: participantId },
      update: {
        meetingId: townhall.id,
        placeId: null,
        shiftId: openMeetingShifts[0].id,
        ...participantData,
        checkInCode: `${participantId}-qr`,
        status: MeetingParticipantStatus.JOINED,
        joinedAt: new Date("2026-06-06T02:30:00.000Z"),
        source: "OPEN_REGISTRATION",
      },
      create: {
        id: participantId,
        meetingId: townhall.id,
        shiftId: openMeetingShifts[0].id,
        ...participantData,
        checkInCode: `${participantId}-qr`,
        status: MeetingParticipantStatus.JOINED,
        joinedAt: new Date("2026-06-06T02:30:00.000Z"),
        source: "OPEN_REGISTRATION",
      },
    });
  }
}

async function seedOpenEvent() {
  const eventId = openEvent.id;
  const eventData = eventDataFrom(openEvent);
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: { id: eventId, ...eventData },
  });
  const place = await seedDefaultEventPlace(openEvent);

  await prisma.eventQrCode.upsert({
    where: { code: "DEMO-COMMUNITY-OPEN-DAY-2026" },
    update: {
      eventId: event.id,
      placeId: place.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-COMMUNITY-OPEN-DAY-2026",
      eventId: event.id,
      placeId: place.id,
      active: true,
    },
  });

  await prisma.eventTheme.upsert({
    where: { eventId: event.id },
    update: openEventTheme,
    create: {
      eventId: event.id,
      ...openEventTheme,
    },
  });

  for (const shiftSeed of openEventShifts) {
    await prisma.eventShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        eventId: event.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        eventId: event.id,
      },
    });
  }

  for (const attendanceSeed of openEventAttendances) {
    const registrationId = `${attendanceSeed.id}-registration`;
    await prisma.eventRegistration.upsert({
      where: { id: registrationId },
      update: {
        eventId: event.id,
        shiftId: attendanceSeed.shiftId,
        fullNameEn: attendanceSeed.fullNameEn,
        fullNameKm: attendanceSeed.fullNameKm,
        gender: attendanceSeed.gender,
        position: attendanceSeed.position,
        organization: attendanceSeed.organization,
        checkInCode: `${registrationId}-qr`,
        source: "OPEN_REGISTRATION",
      },
      create: {
        id: registrationId,
        eventId: event.id,
        shiftId: attendanceSeed.shiftId,
        fullNameEn: attendanceSeed.fullNameEn,
        fullNameKm: attendanceSeed.fullNameKm,
        gender: attendanceSeed.gender,
        position: attendanceSeed.position,
        organization: attendanceSeed.organization,
        checkInCode: `${registrationId}-qr`,
        source: "OPEN_REGISTRATION",
      },
    });

    await prisma.attendance.upsert({
      where: { id: attendanceSeed.id },
      update: {
        shiftId: attendanceSeed.shiftId,
        registrationId,
        fullNameEn: attendanceSeed.fullNameEn,
        fullNameKm: attendanceSeed.fullNameKm,
        gender: attendanceSeed.gender,
        position: attendanceSeed.position,
        organization: attendanceSeed.organization,
        latitude: "11.5681300",
        longitude: "104.9223500",
        distanceMeters: 10,
        status: AttendanceStatus.JOINED,
      },
      create: {
        id: attendanceSeed.id,
        eventId: event.id,
        shiftId: attendanceSeed.shiftId,
        registrationId,
        userId: "seed-user-operator",
        fullNameEn: attendanceSeed.fullNameEn,
        fullNameKm: attendanceSeed.fullNameKm,
        gender: attendanceSeed.gender,
        position: attendanceSeed.position,
        organization: attendanceSeed.organization,
        latitude: "11.5681300",
        longitude: "104.9223500",
        distanceMeters: 10,
        status: AttendanceStatus.JOINED,
      },
    });
  }
}

async function seedCatalogs() {
  await prisma.place.createMany({
    data: [
      {
        id: "seed-place-main-hall",
        tenantId: "default-tenant",
        name: "Main hall",
        description: "Default venue for large attendance events.",
        requireLocation: true,
        locationName: "Main hall",
        latitude: "11.5564000",
        longitude: "104.9282000",
        radiusMeters: 100,
      },
      {
        id: "seed-place-workshop-room",
        tenantId: "default-tenant",
        name: "Workshop room",
        description: "Smaller room for breakout sessions.",
        requireLocation: false,
        locationName: "Workshop room",
        latitude: null,
        longitude: null,
        radiusMeters: 0,
      },
      {
        id: "seed-place-policy-room",
        tenantId: "default-tenant",
        name: "Policy room",
        description: "Meeting room with optional location check-in.",
        requireLocation: false,
        locationName: "Policy room",
        latitude: null,
        longitude: null,
        radiusMeters: 0,
      },
    ],
  });

  await prisma.chairperson.createMany({
    data: [
      {
        id: "seed-chairperson-sok-dara",
        tenantId: "default-tenant",
        honorificTitleEn: "H.E.",
        honorificTitleKm: "ឯកឧត្តម",
        firstNameEn: "Sok",
        firstNameKm: "សុខ",
        lastNameEn: "Dara",
        lastNameKm: "ដារ៉ា",
        position: "Chairperson",
        organization: "Ministry of Education",
      },
      {
        id: "seed-chairperson-chan-sophea",
        tenantId: "default-tenant",
        honorificTitleEn: "Dr.",
        honorificTitleKm: "បណ្ឌិត",
        firstNameEn: "Chan",
        firstNameKm: "ចាន់",
        lastNameEn: "Sophea",
        lastNameKm: "សុភា",
        position: "Program Director",
        organization: "Innovation Office",
      },
    ],
  });
}

async function seedPreRegistrationEvent() {
  const eventId = preRegistrationEvent.id;
  const eventData = eventDataFrom(preRegistrationEvent);
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: { id: eventId, ...eventData },
  });
  const place = await seedDefaultEventPlace(preRegistrationEvent);

  await prisma.eventQrCode.upsert({
    where: { code: "DEMO-DEVELOPER-CLINIC-2026" },
    update: {
      eventId: event.id,
      placeId: place.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-DEVELOPER-CLINIC-2026",
      eventId: event.id,
      placeId: place.id,
      active: true,
    },
  });

  await prisma.eventTheme.upsert({
    where: { eventId: event.id },
    update: preRegistrationEventTheme,
    create: {
      eventId: event.id,
      ...preRegistrationEventTheme,
    },
  });

  await prisma.eventRegistration.upsert({
    where: { id: "seed-registration-developer-clinic-sopheary" },
    update: {
      eventId: event.id,
      fullNameEn: "Sopheary Ngin",
      fullNameKm: null,
      gender: Gender.FEMALE,
      position: "Frontend Developer",
      organization: "Engineering",
      checkInCode: "seed-registration-developer-clinic-sopheary-qr",
      source: "PRE_REGISTRATION",
    },
    create: {
      id: "seed-registration-developer-clinic-sopheary",
      eventId: event.id,
      fullNameEn: "Sopheary Ngin",
      fullNameKm: null,
      gender: Gender.FEMALE,
      position: "Frontend Developer",
      organization: "Engineering",
      checkInCode: "seed-registration-developer-clinic-sopheary-qr",
      source: "PRE_REGISTRATION",
    },
  });
}

async function seedPreRegistrationMeeting() {
  const meetingId = preRegistrationMeeting.id;
  const meetingData = meetingDataFrom(preRegistrationMeeting);
  const meeting = await prisma.meeting.upsert({
    where: { id: meetingId },
    update: meetingData,
    create: { id: meetingId, ...meetingData },
  });
  const place = await seedDefaultMeetingPlace(preRegistrationMeeting);

  for (const chairpersonSeed of preRegistrationMeetingChairpersons) {
    await prisma.chairperson.upsert({
      where: { id: chairpersonSeed.id },
      update: {
        meetingId: meeting.id,
        honorificTitleEn: chairpersonSeed.honorificTitleEn,
        honorificTitleKm: chairpersonSeed.honorificTitleKm,
        firstNameEn: chairpersonSeed.firstNameEn,
        firstNameKm: chairpersonSeed.firstNameKm,
        lastNameEn: chairpersonSeed.lastNameEn,
        lastNameKm: chairpersonSeed.lastNameKm,
        position: chairpersonSeed.position,
        organization: chairpersonSeed.organization,
      },
      create: {
        ...chairpersonSeed,
        meetingId: meeting.id,
      },
    });
  }

  for (const shiftSeed of preRegistrationMeetingShifts) {
    await prisma.meetingShift.upsert({
      where: { id: shiftSeed.id },
      update: {
        meetingId: meeting.id,
        name: shiftSeed.name,
        startTime: shiftSeed.startTime,
        endTime: shiftSeed.endTime,
      },
      create: {
        ...shiftSeed,
        meetingId: meeting.id,
      },
    });
  }

  await prisma.meetingQrCode.upsert({
    where: { code: "DEMO-RESEARCH-ROUNDTABLE-2026" },
    update: {
      meetingId: meeting.id,
      placeId: place.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-RESEARCH-ROUNDTABLE-2026",
      meetingId: meeting.id,
      placeId: place.id,
      active: true,
    },
  });

  await prisma.meetingParticipant.upsert({
    where: { id: "seed-meeting-participant-roundtable-nara" },
    update: {
      meetingId: meeting.id,
      shiftId: preRegistrationMeetingShifts[0].id,
      fullNameEn: "Nara Vong",
      fullNameKm: null,
      gender: Gender.MALE,
      position: "Researcher",
      organization: "Innovation",
      status: MeetingParticipantStatus.INVITED,
      checkInCode: "seed-meeting-participant-roundtable-nara-qr",
      source: "PRE_REGISTRATION",
    },
    create: {
      id: "seed-meeting-participant-roundtable-nara",
      meetingId: meeting.id,
      shiftId: preRegistrationMeetingShifts[0].id,
      fullNameEn: "Nara Vong",
      fullNameKm: null,
      gender: Gender.MALE,
      position: "Researcher",
      organization: "Innovation",
      status: MeetingParticipantStatus.INVITED,
      checkInCode: "seed-meeting-participant-roundtable-nara-qr",
      source: "PRE_REGISTRATION",
    },
  });
}

async function main() {
  console.log(
    "Running seed command `node --no-warnings --experimental-strip-types prisma/seed.ts` ...",
  );

  await resetDatabase();

  const passwordHash = await hash(demoPassword, 10);
  const tenant = await seedTenant();
  const permissionByKey = await seedPermissions();
  const roleByName = await seedRoles(tenant.id, permissionByKey, true);
  await seedUsers(tenant.id, roleByName, passwordHash);
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { ownerUserId: "seed-user-admin" },
  });
  await seedExtraTenants(permissionByKey, passwordHash);
  await seedCatalogs();
  await seedRegistrationImports();
  await seedEvent();
  await seedPlaceEvent();
  await seedMeetings();
  await seedOpenEvent();
  await seedPreRegistrationEvent();
  await seedPreRegistrationMeeting();

  console.log("Seed complete.");
  console.table(
    [
      ...users,
      ...extraTenants.flatMap((tenant) => [tenant.owner, ...tenant.users]),
    ].map((user) => ({
      email: user.email,
      password: demoPassword,
      role: user.role,
    })),
  );
  console.log("Demo QR code: DEMO-TECH-SUMMIT-2026");
  console.log("Demo place QR codes: DEMO-EXPO-MAIN-HALL, DEMO-EXPO-WORKSHOP");
  console.log("Demo open-registration QR code: DEMO-COMMUNITY-OPEN-DAY-2026");
  console.log("Demo pre-registration QR code: DEMO-DEVELOPER-CLINIC-2026");
  console.log("Demo meeting QR code: DEMO-BOARD-BRIEFING-2026");
  console.log(
    "Demo meeting place QR codes: DEMO-MEETING-POLICY-ROOM, DEMO-MEETING-BUDGET-ROOM",
  );
  console.log("Demo open meeting QR code: DEMO-PUBLIC-TOWNHALL-2026");
  console.log(
    "Demo pre-registration meeting QR code: DEMO-RESEARCH-ROUNDTABLE-2026",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
