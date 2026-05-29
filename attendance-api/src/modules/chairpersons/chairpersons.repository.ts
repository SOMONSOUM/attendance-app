import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";
import type { CreateChairpersonDto } from "./dto/chairperson.dto";
import type { PaginationQuery } from "../../common/pagination";
import { parsePagination } from "../../common/pagination";

@Injectable()
export class ChairpersonsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(tenantId: string | null, query: PaginationQuery = {}) {
    const { skip, take } = parsePagination(query);
    const where = { tenantId, meetingId: null };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.chairperson.findMany({
        where,
        orderBy: [{ firstNameEn: "asc" }, { lastNameEn: "asc" }],
        skip,
        take,
      }),
      this.prisma.chairperson.count({ where }),
    ]);
    return { items, totalItems };
  }

  findById(tenantId: string | null, chairpersonId: string) {
    return this.prisma.chairperson.findFirst({
      where: { id: chairpersonId, tenantId, meetingId: null },
    });
  }

  create(data: ReturnType<typeof this.toData>) {
    return this.prisma.chairperson.create({ data });
  }

  update(chairpersonId: string, data: ReturnType<typeof this.toData>) {
    return this.prisma.chairperson.update({
      where: { id: chairpersonId },
      data,
    });
  }

  delete(chairpersonId: string) {
    return this.prisma.chairperson.delete({ where: { id: chairpersonId } });
  }

  toData(tenantId: string | null, dto: CreateChairpersonDto) {
    return {
      tenantId,
      honorificTitleEn: dto.honorificTitleEn.trim(),
      honorificTitleKm: dto.honorificTitleKm.trim(),
      firstNameEn: dto.firstNameEn.trim(),
      firstNameKm: dto.firstNameKm.trim(),
      lastNameEn: dto.lastNameEn.trim(),
      lastNameKm: dto.lastNameKm.trim(),
      position: dto.position?.trim() || null,
      organization: dto.organization?.trim() || null,
    };
  }
}
