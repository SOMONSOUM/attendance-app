import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";
import { UsersRepository } from "./users.repository";
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateUserDto } from "./dto";
import {
  paginated,
  parsePagination,
  type PaginationQuery,
} from "../../common/pagination";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: UsersRepository) {}

  async list(tenantId: string | null, query: PaginationQuery = {}) {
    const scopedTenantId = this.scopeTenant(tenantId);
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = { tenantId: scopedTenantId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items, totalItems, page, pageSize);
  }

  async roles(tenantId: string | null, query: PaginationQuery = {}) {
    const scopedTenantId = this.scopeTenant(tenantId);
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = { tenantId: scopedTenantId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
        include: {
          permissions: {
            include: { permission: true },
            orderBy: { permission: { resource: "asc" } },
          },
          _count: { select: { users: true } },
        },
      }),
      this.prisma.role.count({ where }),
    ]);
    return paginated(items, totalItems, page, pageSize);
  }

  async createRole(tenantId: string | null, dto: CreateRoleDto) {
    const scopedTenantId = this.scopeTenant(tenantId);
    const existing = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId: scopedTenantId, name: dto.name } },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Role already exists");

    const permissions = await Promise.all(
      dto.permissions.map((key) => this.upsertPermission(key)),
    );
    return this.prisma.role.create({
      data: {
        name: dto.name,
        tenantId: scopedTenantId,
        description: dto.description,
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async updateRole(tenantId: string | null, roleId: string, dto: UpdateRoleDto) {
    const scopedTenantId = this.scopeTenant(tenantId);
    await this.assertRole(scopedTenantId, roleId);

    if (dto.name) {
      const existing = await this.prisma.role.findUnique({
        where: { tenantId_name: { tenantId: scopedTenantId, name: dto.name } },
        select: { id: true },
      });
      if (existing && existing.id !== roleId) {
        throw new ConflictException("Role already exists");
      }
    }

    const permissions = dto.permissions
      ? await Promise.all(dto.permissions.map((key) => this.upsertPermission(key)))
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      if (permissions) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        if (permissions.length) {
          await tx.rolePermission.createMany({
            data: permissions.map((permission) => ({
              roleId,
              permissionId: permission.id,
            })),
          });
        }
      }
    });

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async removeRole(tenantId: string | null, roleId: string) {
    const scopedTenantId = this.scopeTenant(tenantId);
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role || role.tenantId !== scopedTenantId)
      throw new NotFoundException("Role not found");
    if (role._count.users > 0) {
      throw new ConflictException("Cannot delete a role assigned to users");
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { deleted: true };
  }

  async create(tenantId: string | null, dto: CreateUserDto) {
    const scopedTenantId = this.scopeTenant(tenantId);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Email is already registered");

    const role = await this.findRole(scopedTenantId, dto.roleName ?? "viewer");
    return this.prisma.user.create({
      data: {
        email: dto.email,
        tenantId: scopedTenantId,
        passwordHash: await hash(dto.password, 10),
        fullNameEn: dto.fullNameEn,
        gender: dto.gender,
        position: dto.position,
        organization: dto.organization,
        roles: role ? { create: { roleId: role.id } } : undefined,
      },
      include: { roles: { include: { role: true } } },
    });
  }

  async update(tenantId: string | null, userId: string, dto: UpdateUserDto) {
    const scopedTenantId = this.scopeTenant(tenantId);
    await this.assertUser(scopedTenantId, userId);
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException("Email is already registered");
      }
    }

    const role = dto.roleName
      ? await this.findRole(scopedTenantId, dto.roleName)
      : null;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        passwordHash: dto.password ? await hash(dto.password, 10) : undefined,
        fullNameEn: dto.fullNameEn,
        gender: dto.gender,
        position: dto.position,
        organization: dto.organization,
      },
      include: { roles: { include: { role: true } } },
    });

    if (role) {
      return this.assignRole(scopedTenantId, userId, role.name);
    }

    return user;
  }

  async assignRole(tenantId: string | null, userId: string, roleName: string) {
    const scopedTenantId = this.scopeTenant(tenantId);
    await this.assertUser(scopedTenantId, userId);
    const role = await this.findRole(scopedTenantId, roleName);
    if (!role) throw new NotFoundException("Role not found");
    await this.prisma.userRole.deleteMany({ where: { userId } });
    await this.prisma.userRole.create({
      data: { userId, roleId: role.id },
    });
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
  }

  async remove(tenantId: string | null, userId: string) {
    const scopedTenantId = this.scopeTenant(tenantId);
    await this.assertUser(scopedTenantId, userId);
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  private async assertUser(tenantId: string | null, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private async assertRole(tenantId: string | null, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  private findRole(tenantId: string | null, name: string) {
    const scopedTenantId = this.scopeTenant(tenantId);
    return this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId: scopedTenantId, name } },
    });
  }

  private scopeTenant(tenantId: string | null) {
    return tenantId ?? "default-tenant";
  }

  private upsertPermission(key: string) {
    const [resource, action] = key.split(":");
    if (!resource || !action) {
      throw new ConflictException(`Invalid permission key: ${key}`);
    }
    return this.prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
  }
}
