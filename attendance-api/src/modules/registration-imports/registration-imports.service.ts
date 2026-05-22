import { Injectable, NotFoundException } from "@nestjs/common";
import { Gender, RegistrationTarget } from "@prisma/client";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";
import {
  paginated,
  parsePagination,
  type PaginationQuery,
} from "../../common/pagination";

type UploadRow = {
  "Fullname English"?: string;
  "Fullname Khmer"?: string;
  Gender?: string;
  Position?: string;
  Department?: string;
};

const genderMap: Record<string, Gender> = {
  male: "MALE",
  m: "MALE",
  female: "FEMALE",
  f: "FEMALE",
  other: "OTHER",
};

@Injectable()
export class RegistrationImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    tenantId: string | null,
    target: RegistrationTarget | undefined,
    query: PaginationQuery = {},
  ) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = { tenantId, target };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.registrationImport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          uploadedBy: {
            select: { id: true, fullNameEn: true, email: true },
          },
        },
      }),
      this.prisma.registrationImport.count({ where }),
    ]);
    return paginated(items, totalItems, page, pageSize);
  }

  async upload(
    file: Express.Multer.File,
    tenantId: string | null,
    uploadedById?: string,
    target: RegistrationTarget = RegistrationTarget.EVENT,
  ) {
    const rows = this.parseRows(file.buffer);
    const created = await this.prisma.registrationImport.create({
      data: {
        fileName: file.originalname,
        tenantId,
        target,
        originalName: file.originalname,
        rowCount: rows.length,
        status: "IMPORTED",
        uploadedById,
        rows: { create: rows },
      },
      include: {
        uploadedBy: {
          select: { id: true, fullNameEn: true, email: true },
        },
      },
    });

    return created;
  }

  async download(tenantId: string | null, importId: string) {
    const registrationImport = await this.prisma.registrationImport.findFirst({
      where: { id: importId, tenantId },
      include: { rows: { orderBy: { createdAt: "asc" } } },
    });
    if (!registrationImport) throw new NotFoundException("Import not found");

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(
      registrationImport.rows.map((row) => ({
        "Fullname English": row.fullNameEn,
        "Fullname Khmer": row.fullNameKm ?? "",
        Gender: row.gender ? titleCase(row.gender) : "",
        Position: row.position ?? "",
        Department: row.department ?? "",
      })),
      {
        header: [
          "Fullname English",
          "Fullname Khmer",
          "Gender",
          "Position",
          "Department",
        ],
      },
    );
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendees");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return {
      filename: registrationImport.originalName,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      contentBase64: Buffer.from(buffer).toString("base64"),
    };
  }

  async remove(tenantId: string | null, importId: string) {
    const registrationImport = await this.prisma.registrationImport.findFirst({
      where: { id: importId, tenantId },
      select: { id: true },
    });
    if (!registrationImport) throw new NotFoundException("Import not found");
    await this.prisma.registrationImport.delete({ where: { id: importId } });
    return { deleted: true };
  }

  template() {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      [
        "Fullname English",
        "Fullname Khmer",
        "Gender",
        "Position",
        "Department",
      ],
      ["Sok Dara", "", "Male", "Software Engineer", "Engineering"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendees");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return {
      filename: "pre-registration-template.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      contentBase64: Buffer.from(buffer).toString("base64"),
    };
  }

  private parseRows(buffer: Buffer) {
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<UploadRow>(sheet);

    return rows
      .filter((row) => row["Fullname English"] || row["Fullname Khmer"])
      .map((row) => ({
        fullNameEn:
          row["Fullname English"]?.trim() ??
          row["Fullname Khmer"]?.trim() ??
          "Unknown",
        fullNameKm: row["Fullname Khmer"]?.trim(),
        gender: row.Gender ? genderMap[row.Gender.toLowerCase()] : undefined,
        position: row.Position?.trim(),
        department: row.Department?.trim(),
      }));
  }
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
