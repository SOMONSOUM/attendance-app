import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreatePlaceDto, UpdatePlaceDto } from "./dto/place.dto";
import {
  paginated,
  parsePagination,
  type PaginationQuery,
} from "../../common/pagination";
import { PlacesRepository } from "./places.repository";

@Injectable()
export class PlacesService {
  constructor(private readonly placesRepository: PlacesRepository) {}

  async list(tenantId: string | null, query: PaginationQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const { items, totalItems } = await this.placesRepository.findMany(
      tenantId,
      query,
    );
    return paginated(items, totalItems, page, pageSize);
  }

  async create(tenantId: string | null, dto: CreatePlaceDto) {
    await this.assertUniqueName(tenantId, dto.name);
    return this.placesRepository.create(this.placesRepository.toData(tenantId, dto));
  }

  async update(tenantId: string | null, placeId: string, dto: UpdatePlaceDto) {
    const place = await this.assertPlace(tenantId, placeId);
    if (dto.name && dto.name !== place.name) {
      await this.assertUniqueName(tenantId, dto.name);
    }
    return this.placesRepository.update(
      placeId,
      this.placesRepository.toData(tenantId, dto),
    );
  }

  async remove(tenantId: string | null, placeId: string) {
    await this.assertPlace(tenantId, placeId);
    await this.placesRepository.delete(placeId);
    return { deleted: true };
  }

  private async assertPlace(tenantId: string | null, placeId: string) {
    const place = await this.placesRepository.findById(tenantId, placeId);
    if (!place) throw new NotFoundException("Place not found");
    return place;
  }

  private async assertUniqueName(tenantId: string | null, name: string) {
    const existing = await this.placesRepository.findByName(
      tenantId,
      name.trim(),
    );
    if (existing) throw new ConflictException("Place already exists");
  }
}
