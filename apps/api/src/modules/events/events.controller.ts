import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
import { CreateEventDto } from "./dto";
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
  @Get()
  list() {
    return this.events.list();
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
  @Post(":eventId/registrations/upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @Param("eventId") eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.events.uploadRegistrations(eventId, file);
  }

  @ApiOperation({ summary: "Search registrations for attendee check-in" })
  @ApiParam({ name: "eventId", example: "clxevent001" })
  @ApiQuery({ name: "q", required: false, example: "Sok" })
  @ApiOkResponse({
    description: "Matching registrations",
    schema: { example: apiSuccess([registrationExample]) },
  })
  @Get(":eventId/registrations/search")
  search(@Param("eventId") eventId: string, @Query("q") query = "") {
    return this.events.searchRegistrations(eventId, query);
  }
}
