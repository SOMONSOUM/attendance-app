import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";

@Injectable()
export class ThemeRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get event() {
    return this.prisma.event;
  }

  get eventTheme() {
    return this.prisma.eventTheme;
  }
}
