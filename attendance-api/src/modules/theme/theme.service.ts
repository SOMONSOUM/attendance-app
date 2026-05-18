import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateThemeDto } from "./dto";

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  update(eventId: string, dto: UpdateThemeDto) {
    return this.prisma.eventTheme.upsert({
      where: { eventId },
      create: { eventId, ...dto },
      update: dto,
    });
  }
}
