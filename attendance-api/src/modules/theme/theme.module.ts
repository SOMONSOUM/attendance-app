import { Module } from "@nestjs/common";
import { ThemeController } from "./theme.controller";
import { ThemeRepository } from "./theme.repository";
import { ThemeService } from "./theme.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ThemeController],
  providers: [ThemeService, ThemeRepository],
})
export class ThemeModule {}
