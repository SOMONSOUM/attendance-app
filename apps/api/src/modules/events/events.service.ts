import { Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDto } from "./dto";

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
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    const code = randomBytes(18).toString("base64url");
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        qrCodes: { create: { code } },
        theme: { create: {} },
      },
      include: { qrCodes: true, theme: true },
    });
    return { ...event, qrImage: await this.toQrImage(code) };
  }

  list() {
    return this.prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        qrCodes: true,
        theme: true,
        _count: { select: { attendances: true, registrations: true } },
      },
    });
  }

  async getPublicByCode(code: string) {
    const qr = await this.prisma.eventQrCode.findUnique({
      where: { code },
      include: { event: { include: { theme: true } } },
    });
    if (!qr?.active)
      throw new NotFoundException("QR code was not found or is inactive");
    return qr.event;
  }

  async uploadRegistrations(eventId: string, file: Express.Multer.File) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException("Event not found");

    const workbook = XLSX.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<UploadRow>(sheet);
    const data = rows
      .filter((row) => row["Fullname English"] || row["Fullname Khmer"])
      .map((row) => ({
        eventId,
        fullNameEn:
          row["Fullname English"]?.trim() ??
          row["Fullname Khmer"]?.trim() ??
          "Unknown",
        fullNameKm: row["Fullname Khmer"]?.trim(),
        gender: row.Gender ? genderMap[row.Gender.toLowerCase()] : undefined,
        position: row.Position?.trim(),
        department: row.Department?.trim(),
      }));

    if (!data.length) return { count: 0 };
    await this.prisma.eventRegistration.createMany({ data });
    return { count: data.length };
  }

  searchRegistrations(eventId: string, query: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        OR: [
          { fullNameEn: { contains: query } },
          { fullNameKm: { contains: query } },
          { department: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { fullNameEn: "asc" },
    });
  }

  private toQrImage(code: string) {
    return QRCode.toDataURL(
      `${process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000"}/en/scan/${code}`,
    );
  }
}
