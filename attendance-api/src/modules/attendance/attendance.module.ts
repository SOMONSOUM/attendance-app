import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller";
import { AttendanceRepository } from "./attendance.repository";
import { AttendeeCardService } from "./attendee-card.service";
import { AttendanceService } from "./attendance.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository, AttendeeCardService],
})
export class AttendanceModule {}
