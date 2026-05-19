import { Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender } from "@prisma/client";
import type { Event, EventRegistration, Attendance } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDto, UpdateEventDto } from "./dto";

type UploadRow = {
  "Fullname English"?: string;
  "Fullname Khmer"?: string;
  Gender?: string;
  Position?: string;
  Department?: string;
  Shift?: string;
};

type EventWithSummary = Event & {
  registrations?: EventRegistration[];
  attendances?: Attendance[];
  _count?: { registrations: number; attendances: number };
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
    const { shifts, theme, ...eventDto } = dto;
    const event = await this.prisma.event.create({
      data: {
        ...eventDto,
        locationName: dto.locationName?.trim() || "Not required",
        latitude: dto.latitude ?? 0,
        longitude: dto.longitude ?? 0,
        radiusMeters: dto.radiusMeters ?? 0,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        qrCodes: { create: { code } },
        shifts: {
          create:
            shifts?.map((shift) => ({
              name: shift.name,
              startsAt: new Date(shift.startsAt),
              endsAt: new Date(shift.endsAt),
            })) ?? [],
        },
        theme: { create: theme ?? {} },
      },
      include: { qrCodes: true, shifts: true, theme: true },
    });
    return { ...event, qrImage: await this.toQrImage(code) };
  }

  async list() {
    const events = await this.prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        qrCodes: true,
        shifts: true,
        theme: true,
        attendances: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { attendances: true, registrations: true } },
      },
    });

    return events.map((event) => this.withSummary(event));
  }

  async update(eventId: string, dto: UpdateEventDto) {
    await this.assertEvent(eventId);
    const { shifts, theme, ...eventDto } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (shifts) {
        await tx.eventShift.deleteMany({ where: { eventId } });
      }

      return tx.event.update({
        where: { id: eventId },
        data: {
          ...eventDto,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          shifts: shifts
            ? {
                create: shifts.map((shift) => ({
                  name: shift.name,
                  startsAt: new Date(shift.startsAt),
                  endsAt: new Date(shift.endsAt),
                })),
              }
            : undefined,
          theme: theme
            ? {
                upsert: {
                  create: theme,
                  update: theme,
                },
              }
            : undefined,
        },
        include: {
          qrCodes: true,
          shifts: true,
          theme: true,
          _count: { select: { attendances: true, registrations: true } },
        },
      });
    });
  }

  async getQr(eventId: string) {
    await this.assertEvent(eventId);
    const qr = await this.prisma.eventQrCode.findFirst({
      where: { eventId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!qr) throw new NotFoundException("QR code not found");
    return {
      code: qr.code,
      qrImage: await this.toQrImage(qr.code),
    };
  }

  async remove(eventId: string) {
    await this.assertEvent(eventId);
    await this.prisma.event.delete({ where: { id: eventId } });
    return { deleted: true };
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
    await this.assertEvent(eventId);
    const shifts = await this.prisma.eventShift.findMany({ where: { eventId } });

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
        shiftId: this.matchShiftId(shifts, row.Shift),
      }));

    if (!data.length) return { count: 0 };
    await this.prisma.eventRegistration.createMany({ data });
    return { count: data.length };
  }

  searchRegistrations(eventId: string, query: string) {
    const tokens = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);

    return this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        AND: tokens.map((token) => ({
          OR: [
            { fullNameEn: { contains: token } },
            { fullNameKm: { contains: token } },
            { department: { contains: token } },
          ],
        })),
      },
      take: 20,
      orderBy: { fullNameEn: "asc" },
      include: { shift: true },
    });
  }

  async copyRegistrations(eventId: string, sourceEventId: string) {
    await this.assertEvent(eventId);
    const sourceRegistrations = await this.prisma.eventRegistration.findMany({
      where: { eventId: sourceEventId },
    });

    if (!sourceRegistrations.length) return { count: 0 };

    await this.prisma.eventRegistration.createMany({
      data: sourceRegistrations.map((registration) => ({
        eventId,
        fullNameEn: registration.fullNameEn,
        fullNameKm: registration.fullNameKm,
        gender: registration.gender,
        position: registration.position,
        department: registration.department,
        source: `COPY:${sourceEventId}`,
      })),
    });

    return { count: sourceRegistrations.length };
  }

  private toQrImage(code: string) {
    return QRCode.toDataURL(
      `${process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000"}/en/scan/${code}`,
    );
  }

  private withSummary<T extends EventWithSummary>(event: T) {
    const registrations = event._count?.registrations ?? 0;
    const checkedIn = event._count?.attendances ?? 0;
    const totalUsers =
      event.mode === EventMode.PRE_REGISTERED ? registrations : checkedIn;
    const joinRate = totalUsers ? Math.round((checkedIn / totalUsers) * 100) : 0;

    const { attendances, ...eventWithoutAttendances } = event;

    return {
      ...eventWithoutAttendances,
      summary: {
        totalUsers,
        registrations,
        checkedIn,
        joinRate,
        remaining: Math.max(totalUsers - checkedIn, 0),
      },
      recentAttendances: attendances ?? [],
    };
  }

  private matchShiftId(
    shifts: { id: string; name: string }[],
    value: string | undefined,
  ) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return undefined;
    return shifts.find((shift) => shift.name.toLowerCase() === normalized)?.id;
  }

  private async assertEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }
}
