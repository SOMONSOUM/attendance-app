import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { apiError, apiSuccess } from "../../common/swagger/api-examples";
import { Public } from "../auth/decorators/public.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { RequirePermissions } from "../rbac/permissions.decorator";
import { CreateMeetingDto, UpdateMeetingDto } from "./dto";
import { MeetingsService } from "./meetings.service";
import type { PaginationQuery } from "../../common/pagination";

type AuthRequest = { user: AuthUser };

@ApiTags("Meetings")
@ApiBearerAuth()
@Controller("meetings")
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @ApiOperation({ summary: "Create meeting with at least one chairperson" })
  @ApiOkResponse({ description: "Created meeting", schema: { example: apiSuccess({ id: "clxmeeting001" }) } })
  @ApiBadRequestResponse({ description: "Validation failed", schema: { example: apiError } })
  @RequirePermissions("meetings:create")
  @Post()
  create(@Req() request: AuthRequest, @Body() dto: CreateMeetingDto) {
    return this.meetings.create(request.user.tenantId, request.user.id, dto);
  }

  @ApiOperation({ summary: "List meetings with chairpersons and participants" })
  @RequirePermissions("meetings:read")
  @Get()
  list(@Req() request: AuthRequest, @Query() query: PaginationQuery) {
    return this.meetings.list(request.user.tenantId, query);
  }

  @ApiOperation({ summary: "Update meeting details, chairpersons, places, and participants" })
  @ApiParam({ name: "meetingId", example: "clxmeeting001" })
  @RequirePermissions("meetings:update")
  @Patch(":meetingId")
  update(
    @Req() request: AuthRequest,
    @Param("meetingId") meetingId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetings.update(request.user.tenantId, meetingId, dto);
  }

  @ApiOperation({ summary: "Delete meeting and related chairpersons/participants" })
  @ApiParam({ name: "meetingId", example: "clxmeeting001" })
  @RequirePermissions("meetings:delete")
  @Delete(":meetingId")
  remove(@Req() request: AuthRequest, @Param("meetingId") meetingId: string) {
    return this.meetings.remove(request.user.tenantId, meetingId);
  }

  @ApiOperation({ summary: "Get meeting QR code as an image data URL" })
  @ApiParam({ name: "meetingId", example: "clxmeeting001" })
  @RequirePermissions("meetings:read")
  @Get(":meetingId/qr")
  getQr(@Req() request: AuthRequest, @Param("meetingId") meetingId: string) {
    return this.meetings.getQr(request.user.tenantId, meetingId);
  }

  @ApiOperation({ summary: "Upload pre-registered meeting participants" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        placeId: { type: "string" },
      },
      required: ["file"],
    },
  })
  @RequirePermissions("meetings:update")
  @Post(":meetingId/participants/upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadParticipants(
    @Req() request: AuthRequest,
    @Param("meetingId") meetingId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("placeId") placeId?: string,
  ) {
    return this.meetings.uploadParticipants(
      request.user.tenantId,
      meetingId,
      file,
      placeId,
    );
  }

  @ApiOperation({ summary: "Copy participants from a reusable meeting import" })
  @ApiParam({ name: "meetingId", example: "clxmeeting001" })
  @ApiParam({ name: "importId", example: "clximport001" })
  @RequirePermissions("meetings:update")
  @Post(":meetingId/participants/import/:importId")
  copyParticipantsFromImport(
    @Req() request: AuthRequest,
    @Param("meetingId") meetingId: string,
    @Param("importId") importId: string,
    @Body("placeId") placeId?: string,
  ) {
    return this.meetings.copyParticipantsFromImport(
      request.user.tenantId,
      meetingId,
      importId,
      placeId,
    );
  }

  @ApiOperation({ summary: "Mark a meeting participant as joined" })
  @RequirePermissions("meetings:update")
  @Post(":meetingId/participants/:participantId/join")
  joinParticipant(
    @Req() request: AuthRequest,
    @Param("meetingId") meetingId: string,
    @Param("participantId") participantId: string,
  ) {
    return this.meetings.joinParticipant(
      request.user.tenantId,
      meetingId,
      participantId,
    );
  }

  @Public()
  @ApiOperation({ summary: "Read public meeting information by QR code" })
  @Get("qr/:code")
  getPublic(@Param("code") code: string) {
    return this.meetings.getPublicByCode(code);
  }

  @Public()
  @ApiOperation({ summary: "Join an open-registration meeting by QR code" })
  @Post("qr/:code/join")
  joinByCode(
    @Param("code") code: string,
    @Body() dto: { fullNameEn: string; fullNameKm?: string },
  ) {
    return this.meetings.joinByCode(code, dto);
  }
}
