import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterTenantDto } from "./dto";

const ownerPermissions = [
  "events:create",
  "events:read",
  "events:update",
  "events:delete",
  "meetings:create",
  "meetings:read",
  "meetings:update",
  "meetings:delete",
  "registrations:create",
  "registrations:read",
  "attendance:create",
  "attendance:read",
  "users:create",
  "users:read",
  "users:update",
  "users:delete",
  "roles:create",
  "roles:read",
  "roles:update",
  "roles:delete",
  "theme:update",
];

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ownerUser: { select: { id: true, email: true, fullNameEn: true } },
        users: {
          select: { id: true, email: true, fullNameEn: true },
          orderBy: { fullNameEn: "asc" },
        },
        _count: { select: { users: true, events: true } },
      },
    });
  }

  async assignOwner(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("Tenant user not found");

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ownerUserId: userId },
      include: {
        ownerUser: { select: { id: true, email: true, fullNameEn: true } },
        users: {
          select: { id: true, email: true, fullNameEn: true },
          orderBy: { fullNameEn: "asc" },
        },
        _count: { select: { users: true, events: true } },
      },
    });
  }

  async register(dto: RegisterTenantDto) {
    const [slug, existingUser] = await Promise.all([
      this.createUniqueSlug(dto.slug ?? dto.name),
      this.prisma.user.findUnique({ where: { email: dto.ownerEmail } }),
    ]);
    if (existingUser) throw new ConflictException("Owner email already exists");

    const permissions = await Promise.all(
      ownerPermissions.map((key) => this.upsertPermission(key)),
    );

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
        },
      });
      const ownerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: "owner",
          description: "Full tenant owner access.",
          permissions: {
            create: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
      });
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.ownerEmail,
          passwordHash: await hash(dto.ownerPassword, 10),
          fullNameEn: dto.ownerName,
          position: "Tenant Owner",
          department: dto.name,
          roles: { create: { roleId: ownerRole.id } },
        },
        include: { roles: { include: { role: true } } },
      });

      return tx.tenant.update({
        where: { id: tenant.id },
        data: { ownerUserId: owner.id },
        include: {
          ownerUser: { select: { id: true, email: true, fullNameEn: true } },
          roles: true,
        },
      });
    });
  }

  private upsertPermission(key: string) {
    const [resource, action] = key.split(":");
    return this.prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
  }

  private async createUniqueSlug(value: string) {
    const base = this.slugify(value) || "tenant";
    let slug = base;
    let suffix = 2;

    while (
      await this.prisma.tenant.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    return value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }
}
