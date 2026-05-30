import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class UsersRepository extends BaseRepository {
  readonly $transaction: PrismaService["$transaction"];

  constructor(prisma: PrismaService) {
    super(prisma);
    this.$transaction = prisma.$transaction.bind(prisma) as PrismaService["$transaction"];
  }

  get permission() {
    return this.prisma.permission;
  }

  get role() {
    return this.prisma.role;
  }

  get user() {
    return this.prisma.user;
  }

  get userRole() {
    return this.prisma.userRole;
  }
}
