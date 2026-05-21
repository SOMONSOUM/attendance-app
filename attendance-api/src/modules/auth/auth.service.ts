import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  jwtAccessSecret,
  jwtRefreshSecret,
  REFRESH_TOKEN_EXPIRES_IN,
} from "./constants";
import { RegisterUserDto } from "./dto/register-user.dto";
import type {
  AccessTokenPayload,
  AuthUser,
  RefreshTokenPayload,
} from "./types/auth-user";

type RefreshTokenRecord = {
  id: string;
  jti: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

type RefreshTokenDelegate = {
  create: (args: {
    data: {
      jti: string;
      tokenHash: string;
      userId: string;
      expiresAt: Date;
    };
  }) => Promise<RefreshTokenRecord>;
  findUnique: (args: {
    where: { jti: string };
  }) => Promise<RefreshTokenRecord | null>;
  update: (args: {
    where: { jti: string };
    data: { revokedAt: Date };
  }) => Promise<RefreshTokenRecord>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user?.passwordHash || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const permissions = user.roles.flatMap((item) =>
      item.role.permissions.map(
        ({ permission }) => `${permission.resource}:${permission.action}`,
      ),
    );
    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      tenantName: user.tenant?.name,
      email: user.email,
      fullNameEn: user.fullNameEn,
      permissions,
    };

    const tokens = await this.issueTokens(authUser);
    return {
      ...tokens,
      user: authUser,
    };
  }

  async register(dto: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) throw new ConflictException("Email is already registered");

    const passwordHash = await hash(dto.password, 10);
    const viewerRole = await this.prisma.role.findUnique({
      where: { tenantId_name: { tenantId: "default-tenant", name: "viewer" } },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        tenantId: viewerRole?.tenantId ?? "default-tenant",
        passwordHash,
        fullNameEn: dto.fullNameEn,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
        roles: viewerRole
          ? {
              create: {
                roleId: viewerRole.id,
              },
            }
          : undefined,
      },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      tenantName: user.tenant?.name,
      email: user.email,
      fullNameEn: user.fullNameEn,
      permissions: user.roles.flatMap((item) =>
        item.role.permissions.map(
          ({ permission }) => `${permission.resource}:${permission.action}`,
        ),
      ),
    };

    const tokens = await this.issueTokens(authUser);
    return {
      ...tokens,
      user: authUser,
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.assertRefreshToken(refreshToken);
    await this.revokeRefreshToken(payload.jti);
    const user = await this.getAuthUser(payload.sub);
    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  async logout(refreshToken: string) {
    const payload = await this.assertRefreshToken(refreshToken);
    await this.revokeRefreshToken(payload.jti);
    return { message: "Logged out", data: { revoked: true } };
  }

  me(userId: string) {
    return this.getAuthUser(userId);
  }

  private async getAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException("User no longer exists");

    return {
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      tenantName: user.tenant?.name,
      email: user.email,
      fullNameEn: user.fullNameEn,
      permissions: user.roles.flatMap((item) =>
        item.role.permissions.map(
          ({ permission }) => `${permission.resource}:${permission.action}`,
        ),
      ),
    };
  }

  private async issueTokens(user: AuthUser) {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      permissions: user.permissions,
    };
    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: jwtAccessSecret(),
        expiresIn: ACCESS_TOKEN_EXPIRES_IN as never,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: jwtRefreshSecret(),
        expiresIn: REFRESH_TOKEN_EXPIRES_IN as never,
      }),
    ]);
    await this.refreshTokens.create({
      data: {
        jti,
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: this.refreshTokenExpiresAt(),
      },
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(refreshToken: string) {
    return this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
      secret: jwtRefreshSecret(),
    });
  }

  private async assertRefreshToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokens.findUnique({
      where: { jti: payload.jti },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt.getTime() <= Date.now() ||
      storedToken.tokenHash !== this.hashToken(refreshToken)
    ) {
      throw new UnauthorizedException("Refresh token was revoked");
    }

    return payload;
  }

  private revokeRefreshToken(jti: string) {
    return this.refreshTokens.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private refreshTokenExpiresAt() {
    return new Date(Date.now() + this.toMilliseconds(REFRESH_TOKEN_EXPIRES_IN));
  }

  private toMilliseconds(value: string) {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const amount = Number(match[1]);
    const unit = match[2];
    if (unit === "s") return amount * 1000;
    if (unit === "m") return amount * 60 * 1000;
    if (unit === "h") return amount * 60 * 60 * 1000;
    return amount * 24 * 60 * 60 * 1000;
  }

  private get refreshTokens() {
    return (
      this.prisma as PrismaService & { refreshToken: RefreshTokenDelegate }
    ).refreshToken;
  }
}
