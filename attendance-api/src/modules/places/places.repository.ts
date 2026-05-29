import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BaseRepository } from "../../common/repositories/base.repository";
import type { CreatePlaceDto } from "./dto/place.dto";
import type { PaginationQuery } from "../../common/pagination";
import { parsePagination } from "../../common/pagination";

@Injectable()
export class PlacesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(tenantId: string | null, query: PaginationQuery = {}) {
    const { skip, take } = parsePagination(query);
    const where = { tenantId, eventId: null, meetingId: null };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.place.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      this.prisma.place.count({ where }),
    ]);
    return { items, totalItems };
  }

  findById(tenantId: string | null, placeId: string) {
    return this.prisma.place.findFirst({
      where: { id: placeId, tenantId, eventId: null, meetingId: null },
    });
  }

  findByName(tenantId: string | null, name: string) {
    return this.prisma.place.findFirst({
      where: { tenantId, name, eventId: null, meetingId: null },
    });
  }

  create(data: ReturnType<typeof this.toData>) {
    return this.prisma.place.create({ data });
  }

  update(placeId: string, data: ReturnType<typeof this.toData>) {
    return this.prisma.place.update({ where: { id: placeId }, data });
  }

  delete(placeId: string) {
    return this.prisma.place.delete({ where: { id: placeId } });
  }

  toData(tenantId: string | null, dto: CreatePlaceDto) {
    const requireLocation = Boolean(dto.requireLocation);
    return {
      tenantId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      requireLocation,
      locationName: requireLocation
        ? dto.locationName?.trim() || dto.name.trim()
        : dto.locationName?.trim() || null,
      latitude: requireLocation ? dto.latitude ?? 0 : null,
      longitude: requireLocation ? dto.longitude ?? 0 : null,
      radiusMeters: requireLocation ? dto.radiusMeters ?? 100 : 0,
    };
  }
}
