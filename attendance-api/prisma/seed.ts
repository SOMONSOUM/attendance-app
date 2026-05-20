import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  AttendanceStatus,
  EventMode,
  Gender,
  PrismaClient,
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
];

const roles: RoleSeed[] = [
  {
    name: "admin",
    description: "Full application access for managing events and users.",
    permissions: permissions.map(
      ([resource, action]) => `${resource}:${action}`,
    ),
  },
  {
    name: "operator",
    description: "Can manage event check-in and view attendance records.",
    permissions: [
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
    permissions: ["events:read", "registrations:read", "attendance:read"],
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

const sampleEvent = {
  id: "seed-event-tech-summit-2026",
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

async function resetDatabase() {
  await prisma.attendance.deleteMany();
  await prisma.eventRegistration.deleteMany();
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

async function seedRoles(permissionByKey: Map<string, { id: string }>) {
  const created = new Map<string, { id: string; name: string }>();

  for (const roleSeed of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleSeed.name },
      update: { description: roleSeed.description },
      create: {
        name: roleSeed.name,
        description: roleSeed.description,
      },
    });

    for (const permissionKey of roleSeed.permissions) {
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
  roleByName: Map<string, { id: string; name: string }>,
  passwordHash: string,
) {
  for (const userSeed of users) {
    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        passwordHash,
        fullNameEn: userSeed.fullNameEn,
        fullNameKm: userSeed.fullNameKm,
        gender: userSeed.gender,
        position: userSeed.position,
        department: userSeed.department,
      },
      create: {
        id: userSeed.id,
        email: userSeed.email,
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
      uploadedById: "seed-user-admin",
      registrations,
    },
    {
      id: "seed-import-product-expo-main-hall",
      fileName: "product-expo-main-hall.xlsx",
      originalName: "product-expo-main-hall.xlsx",
      uploadedById: "seed-user-operator",
      registrations: placeSeeds[0].registrations,
    },
    {
      id: "seed-import-product-expo-workshop.xlsx",
      fileName: "product-expo-workshop.xlsx",
      originalName: "product-expo-workshop.xlsx",
      uploadedById: "seed-user-operator",
      registrations: placeSeeds[1].registrations,
    },
  ];

  for (const importSeed of imports) {
    const created = await prisma.registrationImport.upsert({
      where: { id: importSeed.id },
      update: {
        fileName: importSeed.fileName,
        originalName: importSeed.originalName,
        rowCount: importSeed.registrations.length,
        status: "IMPORTED",
        uploadedById: importSeed.uploadedById,
      },
      create: {
        id: importSeed.id,
        fileName: importSeed.fileName,
        originalName: importSeed.originalName,
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
  const permissionByKey = await seedPermissions();
  const roleByName = await seedRoles(permissionByKey);
  await seedUsers(roleByName, passwordHash);
  await seedRegistrationImports();
  await seedEvent();
  await seedPlaceEvent();
  await seedOpenEvent();

  console.log("Seed complete.");
  console.table(
    users.map((user) => ({
      email: user.email,
      password: demoPassword,
      role: user.role,
    })),
  );
  console.log("Demo QR code: DEMO-TECH-SUMMIT-2026");
  console.log("Demo place QR codes: DEMO-EXPO-MAIN-HALL, DEMO-EXPO-WORKSHOP");
  console.log("Demo open-registration QR code: DEMO-COMMUNITY-OPEN-DAY-2026");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
