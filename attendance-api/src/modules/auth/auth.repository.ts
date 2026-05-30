import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

type RefreshTokenDelegate = {
  create: PrismaService["refreshToken"]["create"];
  findUnique: PrismaService["refreshToken"]["findUnique"];
  update: PrismaService["refreshToken"]["update"];
};

@Injectable()
export class AuthRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get refreshToken(): RefreshTokenDelegate {
    return this.prisma.refreshToken;
  }

  get role() {
    return this.prisma.role;
  }

  get user() {
    return this.prisma.user;
  }
}
