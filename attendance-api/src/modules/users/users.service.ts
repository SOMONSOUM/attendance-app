import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateUserDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { roles: { include: { role: true } } },
    });
  }

  roles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: { permission: true },
          orderBy: { permission: { resource: "asc" } },
        },
        _count: { select: { users: true } },
      },
    });
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Role already exists");

    const permissions = await Promise.all(
      dto.permissions.map((key) => this.upsertPermission(key)),
    );
    return this.prisma.role.create({
      data: {
        name: dto.name,
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

  async updateRole(roleId: string, dto: UpdateRoleDto) {
    await this.assertRole(roleId);

    if (dto.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: dto.name },
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

  async removeRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException("Role not found");
    if (role._count.users > 0) {
      throw new ConflictException("Cannot delete a role assigned to users");
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { deleted: true };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Email is already registered");

    const role = await this.findRole(dto.roleName ?? "viewer");
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hash(dto.password, 10),
        fullNameEn: dto.fullNameEn,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
        roles: role ? { create: { roleId: role.id } } : undefined,
      },
      include: { roles: { include: { role: true } } },
    });
  }

  async update(userId: string, dto: UpdateUserDto) {
    await this.assertUser(userId);
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException("Email is already registered");
      }
    }

    const role = dto.roleName ? await this.findRole(dto.roleName) : null;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.email,
        passwordHash: dto.password ? await hash(dto.password, 10) : undefined,
        fullNameEn: dto.fullNameEn,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
      },
      include: { roles: { include: { role: true } } },
    });

    if (role) {
      return this.assignRole(userId, role.name);
    }

    return user;
  }

  async assignRole(userId: string, roleName: string) {
    await this.assertUser(userId);
    const role = await this.findRole(roleName);
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

  async remove(userId: string) {
    await this.assertUser(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  private async assertUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private async assertRole(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  private findRole(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
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
