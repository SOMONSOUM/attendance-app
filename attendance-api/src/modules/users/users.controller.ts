import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { apiSuccess } from "../../common/swagger/api-examples";
import { RequirePermissions } from "../rbac/permissions.decorator";
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateUserDto } from "./dto";
import { UsersService } from "./users.service";

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
  list() {
    return this.users.list();
  }

  @ApiOperation({ summary: "List roles and permissions" })
  @RequirePermissions("roles:read")
  @Get("roles")
  roles() {
    return this.users.roles();
  }

  @ApiOperation({ summary: "Create role with permissions" })
  @RequirePermissions("roles:create")
  @Post("roles")
  createRole(@Body() dto: CreateRoleDto) {
    return this.users.createRole(dto);
  }

  @ApiOperation({ summary: "Update role and permissions" })
  @RequirePermissions("roles:update")
  @Patch("roles/:roleId")
  updateRole(@Param("roleId") roleId: string, @Body() dto: UpdateRoleDto) {
    return this.users.updateRole(roleId, dto);
  }

  @ApiOperation({ summary: "Delete role" })
  @RequirePermissions("roles:delete")
  @Delete("roles/:roleId")
  removeRole(@Param("roleId") roleId: string) {
    return this.users.removeRole(roleId);
  }

  @ApiOperation({ summary: "Create admin user" })
  @RequirePermissions("users:create")
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @ApiOperation({ summary: "Update admin user" })
  @RequirePermissions("users:update")
  @Patch(":userId")
  update(@Param("userId") userId: string, @Body() dto: UpdateUserDto) {
    return this.users.update(userId, dto);
  }

  @ApiOperation({ summary: "Assign role to user" })
  @RequirePermissions("users:update", "roles:update")
  @Patch(":userId/role")
  assignRole(@Param("userId") userId: string, @Body() dto: { roleName: string }) {
    return this.users.assignRole(userId, dto.roleName);
  }

  @ApiOperation({ summary: "Delete admin user" })
  @RequirePermissions("users:delete")
  @Delete(":userId")
  remove(@Param("userId") userId: string) {
    return this.users.remove(userId);
  }
}
