import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class RegistrationImportsRepository extends BaseRepository {
  readonly $transaction: PrismaService["$transaction"];

  constructor(prisma: PrismaService) {
    super(prisma);
    this.$transaction = prisma.$transaction.bind(prisma) as PrismaService["$transaction"];
  }

  get registrationImport() {
    return this.prisma.registrationImport;
  }
}
