import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res } from "@nestjs/common";
import type { Response } from "express";
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
import type { PaginationQuery } from "../../common/pagination";

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

  @Public()
  @ApiOperation({ summary: "Register attendee from event QR and return attendee QR" })
  @Post("qr/:code/register")
  register(@Param("code") code: string, @Body() dto: JoinEventDto) {
    return this.attendance.registerByCode(code, dto);
  }

  @ApiOperation({ summary: "List attendance records for an event" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiOkResponse({
    description: "Attendance list",
    schema: { example: apiSuccess([attendanceExample]) },
  })
  @RequirePermissions("attendance:read")
  @Get("events/:eventId")
  list(
    @Req() request: AuthRequest,
    @Param("eventId") eventId: string,
    @Query() query: PaginationQuery,
  ) {
    return this.attendance.list(request.user.tenantId, eventId, query);
  }

  @ApiOperation({ summary: "List all event attendees with joined status" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @RequirePermissions("attendance:read")
  @Get("events/:eventId/roster")
  roster(@Req() request: AuthRequest, @Param("eventId") eventId: string) {
    return this.attendance.roster(request.user.tenantId, eventId);
  }

  @ApiOperation({ summary: "Download attendee card image" })
  @RequirePermissions("attendance:read")
  @Get("events/:eventId/registrations/:registrationId/card")
  async registrationCard(
    @Req() request: AuthRequest,
    @Param("eventId") eventId: string,
    @Param("registrationId") registrationId: string,
    @Res() response: Response,
  ) {
    const buffer = await this.attendance.registrationCard(
      request.user.tenantId,
      eventId,
      registrationId,
    );
    response.setHeader("Content-Type", "image/png");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="attendee-card-${registrationId}.png"`,
    );
    response.send(buffer);
  }

  @ApiOperation({ summary: "Update a registered event attendee" })
  @RequirePermissions("attendance:create")
  @Patch("events/:eventId/registrations/:registrationId")
  updateRegistration(
    @Req() request: AuthRequest,
    @Param("eventId") eventId: string,
    @Param("registrationId") registrationId: string,
    @Body() dto: JoinEventDto,
  ) {
    return this.attendance.updateRegistration(
      request.user.tenantId,
      eventId,
      registrationId,
      dto,
    );
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

  @ApiOperation({ summary: "Mark an attendee as joined by attendee QR code" })
  @RequirePermissions("attendance:create")
  @Post("registrations/qr/:checkInCode/join")
  joinRegistrationQr(
    @Req() request: AuthRequest,
    @Param("checkInCode") checkInCode: string,
    @Body("eventId") eventId?: string,
  ) {
    return this.attendance.joinRegistrationByCode(
      request.user.tenantId,
      checkInCode,
      eventId,
    );
  }

  @Public()
  @ApiOperation({ summary: "View attendee card image by attendee QR code" })
  @Get("registrations/qr/:checkInCode/card")
  async registrationCardByCode(
    @Param("checkInCode") checkInCode: string,
    @Res() response: Response,
  ) {
    const buffer = await this.attendance.registrationCardByCode(checkInCode);
    response.setHeader("Content-Type", "image/png");
    response.setHeader(
      "Content-Disposition",
      `inline; filename="attendee-card-${checkInCode}.png"`,
    );
    response.send(buffer);
  }

  @ApiOperation({ summary: "Cancel an attendee check-in" })
  @ApiParam({ name: "attendanceId", example: "clxattendance001" })
  @RequirePermissions("attendance:create")
  @Delete(":attendanceId")
  cancel(@Req() request: AuthRequest, @Param("attendanceId") attendanceId: string) {
    return this.attendance.cancel(request.user.tenantId, attendanceId);
  }
}
