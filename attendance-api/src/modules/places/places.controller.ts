import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/types/auth-user";
import { RequirePermissions } from "../rbac/permissions.decorator";
import type { PaginationQuery } from "../../common/pagination";
import { CreatePlaceDto, UpdatePlaceDto } from "./dto/place.dto";
import { PlacesService } from "./places.service";

type AuthRequest = { user: AuthUser };

@ApiTags("Places")
@ApiBearerAuth()
@Controller("places")
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @RequirePermissions("places:read")
  @Get()
  list(@Req() request: AuthRequest, @Query() query: PaginationQuery) {
    return this.places.list(request.user.tenantId, query);
  }

  @RequirePermissions("places:create")
  @Post()
  create(@Req() request: AuthRequest, @Body() dto: CreatePlaceDto) {
    return this.places.create(request.user.tenantId, dto);
  }

  @RequirePermissions("places:update")
  @Patch(":placeId")
  update(
    @Req() request: AuthRequest,
    @Param("placeId") placeId: string,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.places.update(request.user.tenantId, placeId, dto);
  }

  @RequirePermissions("places:delete")
  @Delete(":placeId")
  remove(@Req() request: AuthRequest, @Param("placeId") placeId: string) {
    return this.places.remove(request.user.tenantId, placeId);
  }
}
