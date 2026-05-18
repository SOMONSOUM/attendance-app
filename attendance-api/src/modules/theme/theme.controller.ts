import { Body, Controller, Param, Put } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { themeExample } from "../../common/swagger/api-examples";
import { UpdateThemeDto } from "./dto";
import { ThemeService } from "./theme.service";
import { RequirePermissions } from "../rbac/permissions.decorator";

@ApiTags("Theme")
@ApiBearerAuth()
@Controller("events/:eventId/theme")
export class ThemeController {
  constructor(private readonly theme: ThemeService) {}

  @ApiOperation({ summary: "Create or update event theme" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiOkResponse({
    description: "Updated theme",
    schema: { example: themeExample },
  })
  @RequirePermissions("theme:update")
  @Put()
  update(@Param("eventId") eventId: string, @Body() dto: UpdateThemeDto) {
    return this.theme.update(eventId, dto);
  }
}
