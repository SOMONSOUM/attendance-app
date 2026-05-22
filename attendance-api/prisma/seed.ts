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
  department: string;
  role: string;
};

type RegistrationSeed = {
  id: string;
  fullNameEn: string;
  fullNameKm: string | null;
  gender: Gender;
  position: string;
  department: string;
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
  locationName: string;
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
    department: "Information Technology",
    role: "admin",
  },
  {
    id: "seed-user-operator",
    email: "operator@example.com",
    fullNameEn: "Event Operator",
    fullNameKm: null,
    gender: Gender.FEMALE,
    position: "Event Coordinator",
    department: "Operations",
    role: "operator",
  },
  {
    id: "seed-user-viewer",
    email: "viewer@example.com",
    fullNameEn: "Attendance Viewer",
    fullNameKm: null,
    gender: Gender.MALE,
    position: "HR Officer",
    department: "Human Resources",
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
      position: "Department Director",
      department: "Administration",
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
        department: "Operations",
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
      department: "Student Affairs",
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
        department: "Human Resources",
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
  mode: EventMode.PRE_REGISTERED,
  separateQrByPlace: false,
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
  description:
    "Demo event with separate QR codes for each hall and room.",
  mode: EventMode.PRE_REGISTERED,
  separateQrByPlace: true,
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
  locationName: "Community Innovation Hub",
  latitude: "11.5681000",
  longitude: "104.9223000",
  radiusMeters: 180,
  startsAt: new Date("2026-06-03T01:30:00.000Z"),
  endsAt: new Date("2026-06-03T10:30:00.000Z"),
  createdById: "seed-user-admin",
};

const sampleTheme = {
  primaryColor: "#2563eb",
  backgroundColor: "#f8fafc",
  backgroundImageUrl: null,
  fontFamily: "Inter",
  fontSize: 16,
  radius: 8,
  appearance: ThemeAppearance.system,
};

const placeEventTheme = {
  primaryColor: "#0f766e",
  backgroundColor: "#f7fbf9",
  backgroundImageUrl: null,
  fontFamily: "Inter",
  fontSize: 16,
  radius: 8,
  appearance: ThemeAppearance.system,
};

const openEventTheme = {
  primaryColor: "#7c3aed",
  backgroundColor: "#fbf8ff",
  backgroundImageUrl: null,
  fontFamily: "Inter",
  fontSize: 16,
  radius: 10,
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
    department: "Open Visitor",
  },
  {
    id: "seed-attendance-open-day-mony",
    shiftId: "seed-shift-open-day-afternoon",
    fullNameEn: "Mony Keo",
    fullNameKm: null,
    gender: Gender.MALE,
    position: "Founder",
    department: "Startup Community",
  },
];

const registrations: RegistrationSeed[] = [
  {
    id: "seed-registration-sok-dara",
    fullNameEn: "Sok Dara",
    fullNameKm: "សុខ ដារ៉ា",
    gender: Gender.MALE,
    position: "Software Engineer",
    department: "Engineering",
  },
  {
    id: "seed-registration-chan-sophea",
    fullNameEn: "Chan Sophea",
    fullNameKm: "ចាន សុភា",
    gender: Gender.FEMALE,
    position: "Product Manager",
    department: "Product",
  },
  {
    id: "seed-registration-kim-sovann",
    fullNameEn: "Kim Sovann",
    fullNameKm: "គីម សុវណ្ណ",
    gender: Gender.OTHER,
    position: "Designer",
    department: "Creative",
  },
];

const placeSeeds: PlaceSeed[] = [
  {
    id: "seed-place-expo-main-hall",
    name: "Main Hall",
    description: "Main product showcase and partner booths.",
    locationName: "Hall A",
    code: "DEMO-EXPO-MAIN-HALL",
    registrations: [
      {
        id: "seed-registration-expo-sreynich",
        fullNameEn: "Sreynich Mao",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Marketing Lead",
        department: "Marketing",
      },
      {
        id: "seed-registration-expo-vuthy",
        fullNameEn: "Vuthy Long",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Sales Manager",
        department: "Sales",
      },
    ],
  },
  {
    id: "seed-place-expo-workshop-room",
    name: "Workshop Room",
    description: "Hands-on product demos and customer workshops.",
    locationName: "Room 204",
    code: "DEMO-EXPO-WORKSHOP",
    registrations: [
      {
        id: "seed-registration-expo-rithy",
        fullNameEn: "Rithy Chan",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Solutions Engineer",
        department: "Engineering",
      },
      {
        id: "seed-registration-expo-sophea",
        fullNameEn: "Sophea Lim",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Customer Success",
        department: "Customer Success",
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
  mode: EventMode.PRE_REGISTERED,
  separateQrByPlace: false,
  locationName: "Executive Meeting Room",
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
    department: "Finance",
  },
  {
    id: "seed-meeting-participant-board-davy",
    fullNameEn: "Davy Chhem",
    fullNameKm: null,
    gender: Gender.FEMALE,
    position: "Legal Advisor",
    department: "Legal",
  },
];

const placeMeeting = {
  id: "seed-meeting-committee-workshops-2026",
  tenantId: "default-tenant",
  name: "Committee Workshops 2026",
  description:
    "Demo meeting with separate QR codes for each workshop room.",
  mode: EventMode.PRE_REGISTERED,
  separateQrByPlace: true,
  locationName: "Administration Building",
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
    locationName: "Room 301",
    code: "DEMO-MEETING-POLICY-ROOM",
    participants: [
      {
        id: "seed-meeting-participant-policy-rina",
        fullNameEn: "Rina Hul",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Policy Analyst",
        department: "Planning",
      },
      {
        id: "seed-meeting-participant-policy-vireak",
        fullNameEn: "Vireak Touch",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Project Lead",
        department: "Programs",
      },
    ],
  },
  {
    id: "seed-meeting-place-budget-room",
    name: "Budget Room",
    description: "Budget planning and procurement discussion.",
    locationName: "Room 302",
    code: "DEMO-MEETING-BUDGET-ROOM",
    participants: [
      {
        id: "seed-meeting-participant-budget-malis",
        fullNameEn: "Malis Sim",
        fullNameKm: null,
        gender: Gender.FEMALE,
        position: "Procurement Officer",
        department: "Procurement",
      },
      {
        id: "seed-meeting-participant-budget-bora",
        fullNameEn: "Bora Seng",
        fullNameKm: null,
        gender: Gender.MALE,
        position: "Accountant",
        department: "Finance",
      },
    ],
  },
];

async function resetDatabase() {
  await prisma.attendance.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meetingQrCode.deleteMany();
  await prisma.meetingChairperson.deleteMany();
  await prisma.meetingPlace.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.registrationImportRow.deleteMany();
  await prisma.registrationImport.deleteMany();
  await prisma.eventQrCode.deleteMany();
  await prisma.eventTheme.deleteMany();
  await prisma.eventShift.deleteMany();
  await prisma.eventPlace.deleteMany();
  await prisma.event.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tenant.deleteMany();
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
    await seedUsers(
      tenant.id,
      roleByName,
      passwordHash,
      [tenantSeed.owner, ...tenantSeed.users],
    );
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
        department: userSeed.department,
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
        department: userSeed.department,
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
        department: registration.department,
      })),
    });
  }
}

async function seedEvent() {
  const { id: eventId, ...eventData } = sampleEvent;
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: sampleEvent,
  });

  await prisma.eventQrCode.upsert({
    where: { code: "DEMO-TECH-SUMMIT-2026" },
    update: {
      eventId: event.id,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-TECH-SUMMIT-2026",
      eventId: event.id,
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

  for (const registrationSeed of registrations) {
    const { id: registrationId, ...registrationData } = registrationSeed;

    await prisma.eventRegistration.upsert({
      where: { id: registrationId },
      update: {
        eventId: event.id,
        ...registrationData,
        source: "SEED",
      },
      create: {
        id: registrationId,
        eventId: event.id,
        ...registrationData,
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
      fullNameEn: checkedInRegistration.fullNameEn,
      fullNameKm: "សុខ ដារ៉ា",
      gender: checkedInRegistration.gender,
      position: checkedInRegistration.position,
      department: checkedInRegistration.department,
      latitude: "11.5564500",
      longitude: "104.9282500",
      distanceMeters: 8,
      status: AttendanceStatus.JOINED,
    },
    create: {
      eventId: event.id,
      registrationId: checkedInRegistration.id,
      userId: "seed-user-admin",
      fullNameEn: checkedInRegistration.fullNameEn,
      fullNameKm: "សុខ ដារ៉ា",
      gender: checkedInRegistration.gender,
      position: checkedInRegistration.position,
      department: checkedInRegistration.department,
      latitude: "11.5564500",
      longitude: "104.9282500",
      distanceMeters: 8,
      status: AttendanceStatus.JOINED,
    },
  });
}

async function seedPlaceEvent() {
  const { id: eventId, ...eventData } = placeEvent;
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: placeEvent,
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
        locationName: placeSeed.locationName,
      },
      create: {
        id: placeSeed.id,
        eventId: event.id,
        name: placeSeed.name,
        description: placeSeed.description,
        locationName: placeSeed.locationName,
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

    for (const registrationSeed of placeSeed.registrations) {
      const { id: registrationId, ...registrationData } = registrationSeed;

      await prisma.eventRegistration.upsert({
        where: { id: registrationId },
        update: {
          eventId: event.id,
          placeId: place.id,
          ...registrationData,
          source: "SEED",
        },
        create: {
          id: registrationId,
          eventId: event.id,
          placeId: place.id,
          ...registrationData,
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
        department: registrationSeed.department,
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
        department: registrationSeed.department,
        latitude: "11.5622100",
        longitude: "104.9160500",
        distanceMeters: 12,
        status: AttendanceStatus.JOINED,
      },
    });
  }
}

async function seedMeetings() {
  const { id: boardMeetingId, ...boardMeetingData } = boardMeeting;
  const board = await prisma.meeting.upsert({
    where: { id: boardMeetingId },
    update: boardMeetingData,
    create: boardMeeting,
  });

  for (const chairpersonSeed of boardMeetingChairpersons) {
    await prisma.meetingChairperson.upsert({
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
      placeId: null,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-BOARD-BRIEFING-2026",
      meetingId: board.id,
      active: true,
    },
  });

  for (const participantSeed of boardMeetingParticipants) {
    const { id: participantId, ...participantData } = participantSeed;

    await prisma.meetingParticipant.upsert({
      where: { id: participantId },
      update: {
        meetingId: board.id,
        placeId: null,
        ...participantData,
        status: MeetingParticipantStatus.INVITED,
        source: "SEED",
      },
      create: {
        id: participantId,
        meetingId: board.id,
        ...participantData,
        status: MeetingParticipantStatus.INVITED,
        source: "SEED",
      },
    });
  }

  const { id: placeMeetingId, ...placeMeetingData } = placeMeeting;
  const committee = await prisma.meeting.upsert({
    where: { id: placeMeetingId },
    update: placeMeetingData,
    create: placeMeeting,
  });

  for (const chairpersonSeed of placeMeetingChairpersons) {
    await prisma.meetingChairperson.upsert({
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

  for (const placeSeed of meetingPlaceSeeds) {
    const place = await prisma.meetingPlace.upsert({
      where: { id: placeSeed.id },
      update: {
        meetingId: committee.id,
        name: placeSeed.name,
        description: placeSeed.description,
        locationName: placeSeed.locationName,
      },
      create: {
        id: placeSeed.id,
        meetingId: committee.id,
        name: placeSeed.name,
        description: placeSeed.description,
        locationName: placeSeed.locationName,
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

      await prisma.meetingParticipant.upsert({
        where: { id: participantId },
        update: {
          meetingId: committee.id,
          placeId: place.id,
          ...participantData,
          status: MeetingParticipantStatus.INVITED,
          source: "SEED",
        },
        create: {
          id: participantId,
          meetingId: committee.id,
          placeId: place.id,
          ...participantData,
          status: MeetingParticipantStatus.INVITED,
          source: "SEED",
        },
      });
    }
  }
}

async function seedOpenEvent() {
  const { id: eventId, ...eventData } = openEvent;
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: eventData,
    create: openEvent,
  });

  await prisma.eventQrCode.upsert({
    where: { code: "DEMO-COMMUNITY-OPEN-DAY-2026" },
    update: {
      eventId: event.id,
      placeId: null,
      active: true,
      expiresAt: null,
    },
    create: {
      code: "DEMO-COMMUNITY-OPEN-DAY-2026",
      eventId: event.id,
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
    await prisma.attendance.upsert({
      where: { id: attendanceSeed.id },
      update: {
        shiftId: attendanceSeed.shiftId,
        fullNameEn: attendanceSeed.fullNameEn,
        fullNameKm: attendanceSeed.fullNameKm,
        gender: attendanceSeed.gender,
        position: attendanceSeed.position,
        department: attendanceSeed.department,
        latitude: "11.5681300",
        longitude: "104.9223500",
        distanceMeters: 10,
        status: AttendanceStatus.JOINED,
      },
      create: {
        id: attendanceSeed.id,
        eventId: event.id,
        shiftId: attendanceSeed.shiftId,
        userId: "seed-user-operator",
        fullNameEn: attendanceSeed.fullNameEn,
        fullNameKm: attendanceSeed.fullNameKm,
        gender: attendanceSeed.gender,
        position: attendanceSeed.position,
        department: attendanceSeed.department,
        latitude: "11.5681300",
        longitude: "104.9223500",
        distanceMeters: 10,
        status: AttendanceStatus.JOINED,
      },
    });
  }
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
  await seedRegistrationImports();
  await seedEvent();
  await seedPlaceEvent();
  await seedMeetings();
  await seedOpenEvent();

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
  console.log("Demo meeting QR code: DEMO-BOARD-BRIEFING-2026");
  console.log(
    "Demo meeting place QR codes: DEMO-MEETING-POLICY-ROOM, DEMO-MEETING-BUDGET-ROOM",
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
