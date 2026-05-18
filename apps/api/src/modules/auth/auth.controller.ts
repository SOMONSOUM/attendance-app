import { Body, Controller, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  apiError,
  authSessionExample,
} from "../../common/swagger/api-examples";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Public()
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ summary: "Login admin user and issue access/refresh tokens" })
  @ApiOkResponse({
    description: "Authenticated session",
    schema: { example: authSessionExample },
  })
  @ApiBadRequestResponse({
    description: "Invalid request",
    schema: { example: apiError },
  })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: "Rotate refresh token and issue a new session" })
  @ApiOkResponse({
    description: "Rotated session",
    schema: { example: authSessionExample },
  })
  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: "Revoke a refresh token" })
  @ApiOkResponse({
    description: "Refresh token revoked",
    schema: {
      example: {
        success: true,
        data: { revoked: true },
        message: "Logged out",
        timestamp: "2026-05-18T03:00:00.000Z",
        path: "/api/auth/logout",
      },
    },
  })
  @Post("logout")
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
