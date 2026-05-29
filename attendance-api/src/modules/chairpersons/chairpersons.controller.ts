import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/types/auth-user";
import { RequirePermissions } from "../rbac/permissions.decorator";
import type { PaginationQuery } from "../../common/pagination";
import {
  CreateChairpersonDto,
  UpdateChairpersonDto,
} from "./dto/chairperson.dto";
import { ChairpersonsService } from "./chairpersons.service";

type AuthRequest = { user: AuthUser };

@ApiTags("Chairpersons")
@ApiBearerAuth()
@Controller("chairpersons")
export class ChairpersonsController {
  constructor(private readonly chairpersons: ChairpersonsService) {}

  @RequirePermissions("chairpersons:read")
  @Get()
  list(@Req() request: AuthRequest, @Query() query: PaginationQuery) {
    return this.chairpersons.list(request.user.tenantId, query);
  }

  @RequirePermissions("chairpersons:create")
  @Post()
  create(@Req() request: AuthRequest, @Body() dto: CreateChairpersonDto) {
    return this.chairpersons.create(request.user.tenantId, dto);
  }

  @RequirePermissions("chairpersons:update")
  @Patch(":chairpersonId")
  update(
    @Req() request: AuthRequest,
    @Param("chairpersonId") chairpersonId: string,
    @Body() dto: UpdateChairpersonDto,
  ) {
    return this.chairpersons.update(
      request.user.tenantId,
      chairpersonId,
      dto,
    );
  }

  @RequirePermissions("chairpersons:delete")
  @Delete(":chairpersonId")
  remove(
    @Req() request: AuthRequest,
    @Param("chairpersonId") chairpersonId: string,
  ) {
    return this.chairpersons.remove(request.user.tenantId, chairpersonId);
  }
}
