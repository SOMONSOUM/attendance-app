import { Module } from "@nestjs/common";
import { AttendeeCardService } from "../attendance/attendee-card.service";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, AttendeeCardService],
})
export class TelegramModule {}
