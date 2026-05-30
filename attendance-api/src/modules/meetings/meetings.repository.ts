import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class MeetingsRepository extends BaseRepository {
  readonly $transaction: PrismaService["$transaction"];

  constructor(prisma: PrismaService) {
    super(prisma);
    this.$transaction = prisma.$transaction.bind(prisma) as PrismaService["$transaction"];
  }

  get chairperson() {
    return this.prisma.chairperson;
  }

  get meeting() {
    return this.prisma.meeting;
  }

  get meetingParticipant() {
    return this.prisma.meetingParticipant;
  }

  get meetingPlace() {
    return this.prisma.meetingPlace;
  }

  get meetingQrCode() {
    return this.prisma.meetingQrCode;
  }

  get meetingShift() {
    return this.prisma.meetingShift;
  }

  get registrationImportRow() {
    return this.prisma.registrationImportRow;
  }
}
