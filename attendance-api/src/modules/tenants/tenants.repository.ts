import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class TenantsRepository extends BaseRepository {
  readonly $transaction: PrismaService["$transaction"];

  constructor(prisma: PrismaService) {
    super(prisma);
    this.$transaction = prisma.$transaction.bind(prisma) as PrismaService["$transaction"];
  }

  get permission() {
    return this.prisma.permission;
  }

  get tenant() {
    return this.prisma.tenant;
  }

  get user() {
    return this.prisma.user;
  }
}
