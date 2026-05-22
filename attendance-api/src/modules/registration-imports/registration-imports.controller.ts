import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { RequirePermissions } from "../rbac/permissions.decorator";
import type { AuthUser } from "../auth/types/auth-user";
import { RegistrationImportsService } from "./registration-imports.service";
import { RegistrationTarget } from "@prisma/client";
import type { PaginationQuery } from "../../common/pagination";

type AuthRequest = {
  user: AuthUser;
};

@ApiTags("Registration imports")
@ApiBearerAuth()
@Controller("registration-imports")
export class RegistrationImportsController {
  constructor(private readonly imports: RegistrationImportsService) {}

  @ApiOperation({ summary: "List reusable pre-registration Excel imports" })
  @RequirePermissions("registrations:read")
  @Get()
  list(
    @Req() request: AuthRequest,
    @Query("target") target: RegistrationTarget | undefined,
    @Query() query: PaginationQuery,
  ) {
    return this.imports.list(request.user.tenantId, target, query);
  }

  @ApiOperation({ summary: "Download the pre-registration Excel template" })
  @RequirePermissions("registrations:read")
  @Get("template")
  template() {
    return this.imports.template();
  }

  @ApiOperation({ summary: "Download a reusable pre-registration import" })
  @RequirePermissions("registrations:read")
  @Get(":importId/download")
  download(@Req() request: AuthRequest, @Param("importId") importId: string) {
    return this.imports.download(request.user.tenantId, importId);
  }

  @ApiOperation({ summary: "Delete a reusable pre-registration import" })
  @RequirePermissions("registrations:create")
  @Delete(":importId")
  remove(@Req() request: AuthRequest, @Param("importId") importId: string) {
    return this.imports.remove(request.user.tenantId, importId);
  }

  @ApiOperation({ summary: "Upload a reusable pre-registration Excel file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
  @RequirePermissions("registrations:create")
  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: AuthRequest,
  ) {
    return this.imports.upload(
      file,
      request.user.tenantId,
      request.user.id,
      RegistrationTarget.EVENT,
    );
  }

  @ApiOperation({ summary: "Upload a reusable meeting participant Excel file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
  @RequirePermissions("registrations:create")
  @Post("meetings/upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadMeetingParticipants(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: AuthRequest,
  ) {
    return this.imports.upload(
      file,
      request.user.tenantId,
      request.user.id,
      RegistrationTarget.MEETING,
    );
  }
}
