import { Module } from "@nestjs/common";
import { MeetingsController } from "./meetings.controller";
import { MeetingsRepository } from "./meetings.repository";
import { MeetingsService } from "./meetings.service";
import { AttendeeCardService } from "../attendance/attendee-card.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsRepository, AttendeeCardService],
})
export class MeetingsModule {}
