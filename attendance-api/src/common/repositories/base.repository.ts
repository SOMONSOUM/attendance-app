import { PrismaService } from "../../modules/prisma/prisma.service";

export abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaService) {}
}
