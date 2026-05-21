import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import {
  alreadyJoinedError,
  apiError,
  apiSuccess,
  attendanceExample,
} from "../../common/swagger/api-examples";
import { Public } from "../auth/decorators/public.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { RequirePermissions } from "../rbac/permissions.decorator";
import { AttendanceService } from "./attendance.service";
import { JoinEventDto } from "./dto";

type AuthRequest = { user: AuthUser };

@ApiTags("Attendance")
@ApiBearerAuth()
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Public()
  @ApiOperation({
    summary: "Join event from QR code",
  })
  @ApiParam({ name: "code", example: "QR-CODE-EXAMPLE-123" })
  @ApiOkResponse({
    description: "Created attendance",
    schema: { example: apiSuccess(attendanceExample) },
  })
  @ApiBadRequestResponse({
    description: "Validation failed",
    schema: { example: apiError },
  })
  @ApiConflictResponse({
    description: "User already joined this event",
    schema: { example: alreadyJoinedError },
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
  list(@Req() request: AuthRequest, @Param("eventId") eventId: string) {
    return this.attendance.list(request.user.tenantId, eventId);
  }

  @ApiOperation({ summary: "List all event attendees with joined status" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @RequirePermissions("attendance:read")
  @Get("events/:eventId/roster")
  roster(@Req() request: AuthRequest, @Param("eventId") eventId: string) {
    return this.attendance.roster(request.user.tenantId, eventId);
  }

  @ApiOperation({ summary: "Mark a registered attendee as joined" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiParam({ name: "registrationId", example: "clxregistration001" })
  @RequirePermissions("attendance:create")
  @Post("events/:eventId/registrations/:registrationId/join")
  joinRegistration(
    @Req() request: AuthRequest,
    @Param("eventId") eventId: string,
    @Param("registrationId") registrationId: string,
  ) {
    return this.attendance.joinRegistration(
      request.user.tenantId,
      eventId,
      registrationId,
    );
  }

  @ApiOperation({ summary: "Cancel an attendee check-in" })
  @ApiParam({ name: "attendanceId", example: "clxattendance001" })
  @RequirePermissions("attendance:create")
  @Delete(":attendanceId")
  cancel(@Req() request: AuthRequest, @Param("attendanceId") attendanceId: string) {
    return this.attendance.cancel(request.user.tenantId, attendanceId);
  }
}
