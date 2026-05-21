import { Injectable } from "@nestjs/common";
import { Gender } from "@prisma/client";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";

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

  async list(tenantId: string | null) {
    return this.prisma.registrationImport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: { id: true, fullNameEn: true, email: true },
        },
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    tenantId: string | null,
    uploadedById?: string,
  ) {
    const rows = this.parseRows(file.buffer);
    const created = await this.prisma.registrationImport.create({
      data: {
        fileName: file.originalname,
        tenantId,
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
