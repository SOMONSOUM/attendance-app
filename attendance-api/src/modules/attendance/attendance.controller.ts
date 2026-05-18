import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import {
  apiError,
  apiSuccess,
  attendanceExample,
} from "../../common/swagger/api-examples";
import { Public } from "../auth/decorators/public.decorator";
import { RequirePermissions } from "../rbac/permissions.decorator";
import { AttendanceService } from "./attendance.service";
import { JoinEventDto } from "./dto";

@ApiTags("Attendance")
@ApiBearerAuth()
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Public()
  @ApiOperation({
    summary: "Join event from QR code after geofence validation",
  })
  @ApiParam({ name: "code", example: "QR-CODE-EXAMPLE-123" })
  @ApiOkResponse({
    description: "Created attendance",
    schema: { example: apiSuccess(attendanceExample) },
  })
  @ApiBadRequestResponse({
    description: "Outside event radius or validation failed",
    schema: { example: apiError },
  })
  @Post("qr/:code/join")
  join(@Param("code") code: string, @Body() dto: JoinEventDto) {
    return this.attendance.joinByCode(code, dto);
  }

  @ApiOperation({ summary: "List attendance records for an event" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiOkResponse({
    description: "Attendance list",
    schema: { example: apiSuccess([attendanceExample]) },
  })
  @RequirePermissions("attendance:read")
  @Get("events/:eventId")
  list(@Param("eventId") eventId: string) {
    return this.attendance.list(eventId);
  }
}
