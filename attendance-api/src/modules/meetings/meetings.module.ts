import { Module } from "@nestjs/common";
import { MeetingsController } from "./meetings.controller";
import { MeetingsRepository } from "./meetings.repository";
import { MeetingsService } from "./meetings.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsRepository],
})
export class MeetingsModule {}
