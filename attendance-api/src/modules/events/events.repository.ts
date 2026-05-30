import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class EventsRepository extends BaseRepository {
  readonly $transaction: PrismaService["$transaction"];

  constructor(prisma: PrismaService) {
    super(prisma);
    this.$transaction = prisma.$transaction.bind(prisma) as PrismaService["$transaction"];
  }

  get event() {
    return this.prisma.event;
  }

  get eventPlace() {
    return this.prisma.eventPlace;
  }

  get eventQrCode() {
    return this.prisma.eventQrCode;
  }

  get eventRegistration() {
    return this.prisma.eventRegistration;
  }

  get registrationImportRow() {
    return this.prisma.registrationImportRow;
  }
}
