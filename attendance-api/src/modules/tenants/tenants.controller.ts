import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { RequirePermissions } from "../rbac/permissions.decorator";
import { AssignTenantOwnerDto, RegisterTenantDto } from "./dto";
import { TenantsService } from "./tenants.service";

@ApiTags("Tenants")
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Public()
  @ApiOperation({ summary: "Register a tenant and its owner account" })
  @Post("register")
  register(@Body() dto: RegisterTenantDto) {
    return this.tenants.register(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "List tenants for platform management" })
  @RequirePermissions("tenants:read")
  @Get()
  list() {
    return this.tenants.list();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign a tenant owner" })
  @RequirePermissions("tenants:update")
  @Patch(":tenantId/owner")
  assignOwner(
    @Param("tenantId") tenantId: string,
    @Body() dto: AssignTenantOwnerDto,
  ) {
    return this.tenants.assignOwner(tenantId, dto.userId);
  }
}
