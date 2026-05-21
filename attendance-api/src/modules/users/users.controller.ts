import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { apiSuccess } from "../../common/swagger/api-examples";
import { RequirePermissions } from "../rbac/permissions.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateUserDto } from "./dto";
import { UsersService } from "./users.service";

type AuthRequest = { user: AuthUser };

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: "List admin users" })
  @ApiOkResponse({
    description: "Users list",
    schema: {
      example: apiSuccess([
        {
          id: "clxuser001",
          email: "admin@example.com",
          fullNameEn: "System Admin",
          fullNameKm: null,
          gender: null,
          position: "Administrator",
          department: "Operations",
          roles: [{ role: { id: "clxrole001", name: "Admin" } }],
          createdAt: "2026-05-18T03:00:00.000Z",
          updatedAt: "2026-05-18T03:00:00.000Z",
        },
      ]),
    },
  })
  @RequirePermissions("users:read")
  @Get()
  list(@Req() request: AuthRequest) {
    return this.users.list(request.user.tenantId);
  }

  @ApiOperation({ summary: "List roles and permissions" })
  @RequirePermissions("roles:read")
  @Get("roles")
  roles(@Req() request: AuthRequest) {
    return this.users.roles(request.user.tenantId);
  }

  @ApiOperation({ summary: "Create role with permissions" })
  @RequirePermissions("roles:create")
  @Post("roles")
  createRole(@Req() request: AuthRequest, @Body() dto: CreateRoleDto) {
    return this.users.createRole(request.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update role and permissions" })
  @RequirePermissions("roles:update")
  @Patch("roles/:roleId")
  updateRole(
    @Req() request: AuthRequest,
    @Param("roleId") roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.users.updateRole(request.user.tenantId, roleId, dto);
  }

  @ApiOperation({ summary: "Delete role" })
  @RequirePermissions("roles:delete")
  @Delete("roles/:roleId")
  removeRole(@Req() request: AuthRequest, @Param("roleId") roleId: string) {
    return this.users.removeRole(request.user.tenantId, roleId);
  }

  @ApiOperation({ summary: "Create admin user" })
  @RequirePermissions("users:create")
  @Post()
  create(@Req() request: AuthRequest, @Body() dto: CreateUserDto) {
    return this.users.create(request.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update admin user" })
  @RequirePermissions("users:update")
  @Patch(":userId")
  update(
    @Req() request: AuthRequest,
    @Param("userId") userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(request.user.tenantId, userId, dto);
  }

  @ApiOperation({ summary: "Assign role to user" })
  @RequirePermissions("users:update", "roles:update")
  @Patch(":userId/role")
  assignRole(
    @Req() request: AuthRequest,
    @Param("userId") userId: string,
    @Body() dto: { roleName: string },
  ) {
    return this.users.assignRole(request.user.tenantId, userId, dto.roleName);
  }

  @ApiOperation({ summary: "Delete admin user" })
  @RequirePermissions("users:delete")
  @Delete(":userId")
  remove(@Req() request: AuthRequest, @Param("userId") userId: string) {
    return this.users.remove(request.user.tenantId, userId);
  }
}
