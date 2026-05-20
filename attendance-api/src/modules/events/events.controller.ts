import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Multer } from "multer";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import {
  apiError,
  apiSuccess,
  eventExample,
  eventWithQrExample,
  registrationExample,
} from "../../common/swagger/api-examples";
import { Public } from "../auth/decorators/public.decorator";
import { RequirePermissions } from "../rbac/permissions.decorator";
import { CreateEventDto, UpdateEventDto } from "./dto";
import { EventsService } from "./events.service";

@ApiTags("Events")
@ApiBearerAuth()
@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @ApiOperation({ summary: "Create event and generate its first QR code" })
  @ApiOkResponse({
    description: "Created event",
    schema: { example: eventWithQrExample },
  })
  @ApiBadRequestResponse({
    description: "Validation failed",
    schema: { example: apiError },
  })
  @RequirePermissions("events:create")
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @ApiOperation({
    summary: "List events with QR, theme, and attendance counts",
  })
  @ApiOkResponse({
    description: "Events list",
    schema: {
      example: apiSuccess([
        {
          ...eventExample,
          qrCodes: [
            { id: "clxqr001", code: "QR-CODE-EXAMPLE-123", active: true },
          ],
          theme: { primaryColor: "#2563eb", backgroundColor: "#f8fafc" },
          _count: { attendances: 64, registrations: 120 },
        },
      ]),
    },
  })
  @RequirePermissions("events:read")
  @Get()
  list() {
    return this.events.list();
  }

  @ApiOperation({ summary: "Get event QR code as an image data URL" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @RequirePermissions("events:read")
  @Get(":eventId/qr")
  getQr(@Param("eventId") eventId: string) {
    return this.events.getQr(eventId);
  }

  @ApiOperation({ summary: "Update event details" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @RequirePermissions("events:update")
  @Patch(":eventId")
  update(@Param("eventId") eventId: string, @Body() dto: UpdateEventDto) {
    return this.events.update(eventId, dto);
  }

  @ApiOperation({
    summary: "Delete event and related QR/registration/attendance data",
  })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @RequirePermissions("events:delete")
  @Delete(":eventId")
  remove(@Param("eventId") eventId: string) {
    return this.events.remove(eventId);
  }

  @Public()
  @ApiOperation({ summary: "Read public event information by QR code" })
  @ApiParam({ name: "code", example: "QR-CODE-EXAMPLE-123" })
  @ApiOkResponse({
    description: "Public event",
    schema: { example: apiSuccess(eventExample) },
  })
  @Get("qr/:code")
  getPublic(@Param("code") code: string) {
    return this.events.getPublicByCode(code);
  }

  @ApiOperation({ summary: "Upload pre-registration spreadsheet" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description:
            "XLSX file with Fullname English, Fullname Khmer, Gender, Position, Department headers.",
        },
      },
      required: ["file"],
    },
  })
  @ApiOkResponse({
    description: "Uploaded row count",
    schema: { example: apiSuccess({ count: 42 }) },
  })
  @RequirePermissions("registrations:create")
  @Post(":eventId/registrations/upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @Param("eventId") eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("placeId") placeId?: string,
  ) {
    return this.events.uploadRegistrations(eventId, file, placeId);
  }

  @ApiOperation({ summary: "Copy registrations from another event" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiParam({ name: "sourceEventId", example: "clxsourceevent001" })
  @RequirePermissions("registrations:create")
  @Post(":eventId/registrations/copy/:sourceEventId")
  copyRegistrations(
    @Param("eventId") eventId: string,
    @Param("sourceEventId") sourceEventId: string,
  ) {
    return this.events.copyRegistrations(eventId, sourceEventId);
  }

  @ApiOperation({ summary: "Copy registrations from a reusable import" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiParam({ name: "importId", example: "clximport001" })
  @RequirePermissions("registrations:create")
  @Post(":eventId/registrations/import/:importId")
  copyRegistrationsFromImport(
    @Param("eventId") eventId: string,
    @Param("importId") importId: string,
    @Body("placeId") placeId?: string,
  ) {
    return this.events.copyRegistrationsFromImport(eventId, importId, placeId);
  }

  @ApiOperation({ summary: "Search registrations for attendee check-in" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiQuery({ name: "q", required: false, example: "Sok" })
  @ApiOkResponse({
    description: "Matching registrations",
    schema: { example: apiSuccess([registrationExample]) },
  })
  @Public()
  @Get(":eventId/registrations/search")
  search(
    @Param("eventId") eventId: string,
    @Query("q") query = "",
    @Query("placeId") placeId?: string,
  ) {
    return this.events.searchRegistrations(eventId, query, placeId);
  }
}
