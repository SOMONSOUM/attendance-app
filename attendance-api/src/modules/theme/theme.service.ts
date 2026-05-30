import { Injectable, NotFoundException } from "@nestjs/common";
import { ThemeRepository } from "./theme.repository";
import { UpdateThemeDto } from "./dto";

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: ThemeRepository) {}

  async update(tenantId: string | null, eventId: string, dto: UpdateThemeDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException("Event not found");

    return this.prisma.eventTheme.upsert({
      where: { eventId },
      create: { eventId, ...dto },
      update: dto,
    });
  }
}
