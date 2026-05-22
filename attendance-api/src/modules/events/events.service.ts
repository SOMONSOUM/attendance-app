import { Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender } from "@prisma/client";
import type { Event, EventRegistration, Attendance } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDto, UpdateEventDto } from "./dto";
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

  async create(tenantId: string | null, dto: CreateEventDto) {
    const { places, shifts, theme, ...eventDto } = dto;
    const separateQrByPlace = Boolean(dto.separateQrByPlace);
    const code = this.toQrCode();
    const event = await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          ...eventDto,
          tenantId,
          separateQrByPlace,
          requireLocation: Boolean(dto.requireLocation),
          locationName: dto.locationName?.trim() || "Not required",
          latitude: dto.requireLocation ? dto.latitude ?? 0 : 0,
          longitude: dto.requireLocation ? dto.longitude ?? 0 : 0,
          radiusMeters: dto.requireLocation ? dto.radiusMeters ?? 100 : 0,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          qrCodes: separateQrByPlace ? undefined : { create: { code } },
          places: separateQrByPlace
            ? {
                create:
                  places?.map((place) => ({
                    name: place.name,
                    description: place.description,
                    locationName: place.locationName?.trim() || place.name,
                  })) ?? [],
              }
            : undefined,
          shifts: {
            create:
              shifts?.map((shift) => ({
                name: shift.name,
                startTime: this.toTimeDate(shift.startTime),
                endTime: this.toTimeDate(shift.endTime),
              })) ?? [],
          },
          theme: { create: theme ?? {} },
        },
      });

      if (separateQrByPlace) {
        const createdPlaces = await tx.eventPlace.findMany({
          where: { eventId: createdEvent.id },
        });
        await tx.eventQrCode.createMany({
          data: createdPlaces.map((place) => ({
            eventId: createdEvent.id,
            placeId: place.id,
            code: this.toQrCode(),
          })),
        });
      }

      return tx.event.findUniqueOrThrow({
        where: { id: createdEvent.id },
        include: {
          places: { include: { qrCodes: true } },
          qrCodes: true,
          shifts: true,
          theme: true,
        },
      });
    });
    const firstCode = event.qrCodes[0]?.code ?? event.places[0]?.qrCodes[0]?.code;
    return { ...event, qrImage: firstCode ? await this.toQrImage(firstCode) : null };
  }

  async list(tenantId: string | null, query: PaginationQuery = {}) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = { tenantId };
    const [events, totalItems] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          qrCodes: true,
          places: { include: { qrCodes: true } },
          shifts: true,
          theme: true,
          attendances: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: { select: { attendances: true, registrations: true } },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return paginated(
      events.map((event) => this.withSummary(event)),
      totalItems,
      page,
      pageSize,
    );
  }

  async update(tenantId: string | null, eventId: string, dto: UpdateEventDto) {
    await this.assertEvent(tenantId, eventId);
    const { places, shifts, theme, ...eventDto } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (shifts) {
        await tx.eventShift.deleteMany({ where: { eventId } });
      }

      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          ...eventDto,
          requireLocation: dto.requireLocation,
          locationName: dto.locationName?.trim() || undefined,
          latitude:
            dto.requireLocation === false
              ? 0
              : dto.latitude !== undefined
                ? dto.latitude
                : undefined,
          longitude:
            dto.requireLocation === false
              ? 0
              : dto.longitude !== undefined
                ? dto.longitude
                : undefined,
          radiusMeters:
            dto.requireLocation === false
              ? 0
              : dto.radiusMeters !== undefined
                ? dto.radiusMeters
                : undefined,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          shifts: shifts
            ? {
                create: shifts.map((shift) => ({
                  name: shift.name,
                  startTime: this.toTimeDate(shift.startTime),
                  endTime: this.toTimeDate(shift.endTime),
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
          places: { include: { qrCodes: true } },
          shifts: true,
          theme: true,
          _count: { select: { attendances: true, registrations: true } },
        },
      });

      if (places) {
        const incomingPlaceIds = places
          .map((place) => place.id)
          .filter((id): id is string => Boolean(id));

        await tx.eventPlace.deleteMany({
          where: {
            eventId,
            id: incomingPlaceIds.length ? { notIn: incomingPlaceIds } : undefined,
          },
        });

        for (const place of places) {
          if (place.id) {
            await tx.eventPlace.updateMany({
              where: { id: place.id, eventId },
              data: {
                name: place.name,
                description: place.description,
                locationName: place.locationName?.trim() || place.name,
              },
            });
          } else {
            await tx.eventPlace.create({
              data: {
                eventId,
                name: place.name,
                description: place.description,
                locationName: place.locationName?.trim() || place.name,
              },
            });
          }
        }

        const createdPlaces = await tx.eventPlace.findMany({
          where: { eventId },
          include: { qrCodes: true },
        });
        if (event.separateQrByPlace) {
          const placesWithoutQr = createdPlaces.filter(
            (place) => !place.qrCodes.some((qr) => qr.active),
          );
          if (placesWithoutQr.length) {
            await tx.eventQrCode.createMany({
              data: placesWithoutQr.map((place) => ({
                eventId,
                placeId: place.id,
                code: this.toQrCode(),
              })),
            });
          }
        } else {
          const existingEventQr = await tx.eventQrCode.findFirst({
            where: { eventId, placeId: null, active: true },
          });
          if (!existingEventQr) {
            await tx.eventQrCode.create({
              data: { eventId, code: this.toQrCode() },
            });
          }
        }
      }

      return tx.event.findUniqueOrThrow({
        where: { id: event.id },
        include: {
          qrCodes: true,
          places: { include: { qrCodes: true } },
          shifts: true,
          theme: true,
          _count: { select: { attendances: true, registrations: true } },
        },
      });
    });
  }

  async getQr(tenantId: string | null, eventId: string) {
    await this.assertEvent(tenantId, eventId);
    const qrs = await this.prisma.eventQrCode.findMany({
      where: { eventId, active: true },
      orderBy: { createdAt: "desc" },
      include: { place: true },
    });
    if (!qrs.length) throw new NotFoundException("QR code not found");
    return {
      code: qrs[0].code,
      qrImage: await this.toQrImage(qrs[0].code),
      qrCodes: await Promise.all(
        qrs.map(async (qr) => ({
          id: qr.id,
          code: qr.code,
          placeId: qr.placeId,
          placeName: qr.place?.name ?? null,
          qrImage: await this.toQrImage(qr.code),
        })),
      ),
    };
  }

  async remove(tenantId: string | null, eventId: string) {
    await this.assertEvent(tenantId, eventId);
    await this.prisma.event.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  async getPublicByCode(code: string) {
    const qr = await this.prisma.eventQrCode.findUnique({
      where: { code },
      include: {
        place: true,
        event: { include: { theme: true, shifts: true, places: true } },
      },
    });
    if (!qr?.active)
      throw new NotFoundException("QR code was not found or is inactive");
    return { ...qr.event, scanPlace: qr.place };
  }

  async uploadRegistrations(
    tenantId: string | null,
    eventId: string,
    file: Express.Multer.File,
    placeId?: string,
  ) {
    await this.assertEvent(tenantId, eventId);
    if (placeId) await this.assertPlace(eventId, placeId);

    const workbook = XLSX.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<UploadRow>(sheet);
    const data = rows
      .filter((row) => row["Fullname English"] || row["Fullname Khmer"])
      .map((row) => ({
        eventId,
        placeId,
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

  searchRegistrations(eventId: string, query: string, placeId?: string) {
    const tokens = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);

    return this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        placeId: placeId || undefined,
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
    });
  }

  async copyRegistrations(
    tenantId: string | null,
    eventId: string,
    sourceEventId: string,
  ) {
    await this.assertEvent(tenantId, eventId);
    await this.assertEvent(tenantId, sourceEventId);
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

  async copyRegistrationsFromImport(
    tenantId: string | null,
    eventId: string,
    importId: string,
    placeId?: string,
  ) {
    await this.assertEvent(tenantId, eventId);
    if (placeId) await this.assertPlace(eventId, placeId);
    const rows = await this.prisma.registrationImportRow.findMany({
      where: { importId, import: { tenantId } },
    });

    if (!rows.length) return { count: 0 };

    await this.prisma.eventRegistration.createMany({
      data: rows.map((row) => ({
        eventId,
        placeId,
        fullNameEn: row.fullNameEn,
        fullNameKm: row.fullNameKm,
        gender: row.gender,
        position: row.position,
        department: row.department,
        source: `IMPORT:${importId}`,
      })),
    });

    return { count: rows.length };
  }

  private toQrImage(code: string) {
    return QRCode.toDataURL(
      `${process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000"}/en/scan/${code}`,
    );
  }

  private toQrCode() {
    return randomBytes(18).toString("base64url");
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

  private toTimeDate(value: string) {
    const time = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${time}.000Z`);
  }

  private async assertEvent(tenantId: string | null, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  private async assertPlace(eventId: string, placeId: string) {
    const place = await this.prisma.eventPlace.findFirst({
      where: { id: placeId, eventId },
    });
    if (!place) throw new NotFoundException("Event place not found");
    return place;
  }
}
