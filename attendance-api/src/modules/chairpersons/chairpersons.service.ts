import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateChairpersonDto, UpdateChairpersonDto } from "./dto/chairperson.dto";
import {
  paginated,
  parsePagination,
  type PaginationQuery,
} from "../../common/pagination";
import { ChairpersonsRepository } from "./chairpersons.repository";

@Injectable()
export class ChairpersonsService {
  constructor(private readonly chairpersonsRepository: ChairpersonsRepository) {}

  async list(tenantId: string | null, query: PaginationQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const { items, totalItems } = await this.chairpersonsRepository.findMany(
      tenantId,
      query,
    );
    return paginated(items, totalItems, page, pageSize);
  }

  create(tenantId: string | null, dto: CreateChairpersonDto) {
    return this.chairpersonsRepository.create(
      this.chairpersonsRepository.toData(tenantId, dto),
    );
  }

  async update(
    tenantId: string | null,
    chairpersonId: string,
    dto: UpdateChairpersonDto,
  ) {
    await this.assertChairperson(tenantId, chairpersonId);
    return this.chairpersonsRepository.update(
      chairpersonId,
      this.chairpersonsRepository.toData(tenantId, dto),
    );
  }

  async remove(tenantId: string | null, chairpersonId: string) {
    await this.assertChairperson(tenantId, chairpersonId);
    await this.chairpersonsRepository.delete(chairpersonId);
    return { deleted: true };
  }

  private async assertChairperson(
    tenantId: string | null,
    chairpersonId: string,
  ) {
    const chairperson = await this.chairpersonsRepository.findById(
      tenantId,
      chairpersonId,
    );
    if (!chairperson) throw new NotFoundException("Chairperson not found");
    return chairperson;
  }
}
