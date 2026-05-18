import { Body, Controller, Get, Post, Req } from "@nestjs/common";
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
import { RegisterUserDto } from "./dto/register-user.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { AuthUser } from "./types/auth-user";

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
  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: "Register a new user and issue access/refresh tokens" })
  @ApiOkResponse({
    description: "Authenticated session",
    schema: { example: authSessionExample },
  })
  @ApiBadRequestResponse({
    description: "Invalid request or email already exists",
    schema: { example: apiError },
  })
  @Public()
  @Post("register")
  register(@Body() dto: RegisterUserDto) {
    return this.auth.register(dto);
  }

  @ApiOperation({ summary: "Get current authenticated admin user" })
  @Get("me")
  me(@Req() request: { user: AuthUser }) {
    return this.auth.me(request.user.id);
  }

  @ApiOperation({ summary: "Rotate refresh token and issue a new session" })
  @ApiOkResponse({
    description: "Rotated session",
    schema: { example: authSessionExample },
  })
  @Public()
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
  @Public()
  @Post("logout")
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
