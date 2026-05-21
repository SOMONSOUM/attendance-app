import {
  Controller,
  Get,
  Post,
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
  list(@Req() request: AuthRequest) {
    return this.imports.list(request.user.tenantId);
  }

  @ApiOperation({ summary: "Download the pre-registration Excel template" })
  @RequirePermissions("registrations:read")
  @Get("template")
  template() {
    return this.imports.template();
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
    return this.imports.upload(file, request.user.tenantId, request.user.id);
  }
}
