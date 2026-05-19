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
  locationName: "Phnom Penh Convention Center",
  latitude: "11.5564000",
  longitude: "104.9282000",
  radiusMeters: 250,
  startsAt: new Date("2026-06-01T01:30:00.000Z"),
  endsAt: new Date("2026-06-01T10:30:00.000Z"),
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

async function main() {
  const passwordHash = await hash(demoPassword, 10);
  const permissionByKey = await seedPermissions();
  const roleByName = await seedRoles(permissionByKey);
  await seedUsers(roleByName, passwordHash);
  await seedEvent();

  console.log("Seed complete.");
  console.table(
    users.map((user) => ({
      email: user.email,
      password: demoPassword,
      role: user.role,
    })),
  );
  console.log("Demo QR code: DEMO-TECH-SUMMIT-2026");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
