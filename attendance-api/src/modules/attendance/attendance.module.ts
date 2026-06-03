import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller";
import { AttendanceRepository } from "./attendance.repository";
import { AttendeeCardService } from "./attendee-card.service";
import { AttendanceService } from "./attendance.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository, AttendeeCardService],
})
export class AttendanceModule {}
