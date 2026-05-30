import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class AttendanceRepository extends BaseRepository {
  readonly $transaction: PrismaService["$transaction"];

  constructor(prisma: PrismaService) {
    super(prisma);
    this.$transaction = prisma.$transaction.bind(prisma) as PrismaService["$transaction"];
  }

  get attendance() {
    return this.prisma.attendance;
  }

  get event() {
    return this.prisma.event;
  }

  get eventQrCode() {
    return this.prisma.eventQrCode;
  }

  get eventRegistration() {
    return this.prisma.eventRegistration;
  }

  get eventShift() {
    return this.prisma.eventShift;
  }
}
