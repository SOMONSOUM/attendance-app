import { Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender, Prisma } from "@prisma/client";
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
    const allowLocation = dto.mode !== EventMode.PRE_REGISTRATION;
    const code = this.toQrCode();
    const event = await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          ...eventDto,
          tenantId,
          separateQrByPlace,
          requireLocation: allowLocation && Boolean(dto.requireLocation),
          locationName: dto.locationName?.trim() || "Not required",
          latitude: allowLocation && dto.requireLocation ? dto.latitude ?? 0 : 0,
          longitude: allowLocation && dto.requireLocation ? dto.longitude ?? 0 : 0,
          radiusMeters: allowLocation && dto.requireLocation ? dto.radiusMeters ?? 100 : 0,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          qrCodes: separateQrByPlace ? undefined : { create: { code } },
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
        for (const place of places ?? []) {
          const placeData = await this.toEventPlaceData(tx, tenantId, allowLocation, place);
          await tx.place.create({
            data: {
              ...placeData,
              eventId: createdEvent.id,
            },
          });
        }
        const createdPlaces = await tx.place.findMany({
          where: { eventId: createdEvent.id },
        });
        await tx.qrCode.createMany({
          data: createdPlaces.map((place) => ({
            target: "EVENT",
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
    const existing = await this.assertEvent(tenantId, eventId);
    const { places, shifts, theme, ...eventDto } = dto;
    const allowLocation =
      (dto.mode ?? existing.mode) !== EventMode.PRE_REGISTRATION;

    return this.prisma.$transaction(async (tx) => {
      if (shifts) {
        await tx.eventShift.deleteMany({ where: { eventId } });
      }

      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          ...eventDto,
          requireLocation: allowLocation ? dto.requireLocation : false,
          locationName: dto.locationName?.trim() || undefined,
          latitude:
            !allowLocation || dto.requireLocation === false
              ? 0
              : dto.latitude !== undefined
                ? dto.latitude
                : undefined,
          longitude:
            !allowLocation || dto.requireLocation === false
              ? 0
              : dto.longitude !== undefined
                ? dto.longitude
                : undefined,
          radiusMeters:
            !allowLocation || dto.requireLocation === false
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

        await tx.place.deleteMany({
          where: {
            eventId,
            id: incomingPlaceIds.length ? { notIn: incomingPlaceIds } : undefined,
          },
        });

        for (const place of places) {
          if (place.id) {
            const placeData = await this.toEventPlaceData(tx, tenantId, allowLocation, place);
            await tx.place.updateMany({
              where: { id: place.id, eventId },
              data: placeData,
            });
          } else {
            const placeData = await this.toEventPlaceData(tx, tenantId, allowLocation, place);
            await tx.place.create({
              data: {
                eventId,
                ...placeData,
              },
            });
          }
        }

        const createdPlaces = await tx.place.findMany({
          where: { eventId },
          include: { qrCodes: true },
        });
        if (event.separateQrByPlace) {
          const placesWithoutQr = createdPlaces.filter(
            (place) => !place.qrCodes.some((qr) => qr.active),
          );
          if (placesWithoutQr.length) {
            await tx.qrCode.createMany({
              data: placesWithoutQr.map((place) => ({
                target: "EVENT",
                eventId,
                placeId: place.id,
                code: this.toQrCode(),
              })),
            });
          }
        } else {
          const existingEventQr = await tx.qrCode.findFirst({
            where: { target: "EVENT", eventId, placeId: null, active: true },
          });
          if (!existingEventQr) {
            await tx.qrCode.create({
              data: { target: "EVENT", eventId, code: this.toQrCode() },
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
    const qrs = await this.prisma.qrCode.findMany({
      where: { target: "EVENT", eventId, active: true },
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
    const qr = await this.prisma.qrCode.findUnique({
      where: { code },
      include: {
        place: true,
        event: { include: { theme: true, shifts: true, places: true } },
      },
    });
    if (!qr?.active || qr.target !== "EVENT" || !qr.event)
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
        checkInCode: this.toQrCode(),
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
        checkInCode: this.toQrCode(),
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
        checkInCode: this.toQrCode(),
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
    const totalUsers = registrations;
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
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, eventId },
    });
    if (!place) throw new NotFoundException("Event place not found");
    return place;
  }

  private async toEventPlaceData(
    tx: Prisma.TransactionClient,
    tenantId: string | null,
    allowLocation: boolean,
    place: NonNullable<CreateEventDto["places"]>[number],
  ) {
    const catalogPlace = place.catalogPlaceId
      ? await tx.place.findFirst({
          where: { id: place.catalogPlaceId, tenantId },
        })
      : place.name.trim()
        ? await this.upsertCatalogPlace(tx, tenantId, allowLocation, place)
        : null;

    const requireLocation =
      allowLocation &&
      Boolean(place.requireLocation ?? catalogPlace?.requireLocation);
    const name = place.name?.trim() || catalogPlace?.name || "Place";

    return {
      catalogPlaceId: catalogPlace?.id ?? null,
      name,
      description: place.description?.trim() || catalogPlace?.description || null,
      requireLocation,
      locationName:
        place.locationName?.trim() || catalogPlace?.locationName || name,
      latitude: requireLocation
        ? place.latitude ?? Number(catalogPlace?.latitude ?? 0)
        : null,
      longitude: requireLocation
        ? place.longitude ?? Number(catalogPlace?.longitude ?? 0)
        : null,
      radiusMeters: requireLocation
        ? place.radiusMeters ?? catalogPlace?.radiusMeters ?? 100
        : 0,
    };
  }

  private async upsertCatalogPlace(
    tx: Prisma.TransactionClient,
    tenantId: string | null,
    allowLocation: boolean,
    place: NonNullable<CreateEventDto["places"]>[number],
  ) {
    const data = {
      tenantId,
      name: place.name.trim(),
      description: place.description?.trim() || null,
      requireLocation: allowLocation && Boolean(place.requireLocation),
      locationName: place.locationName?.trim() || place.name.trim(),
      latitude:
        allowLocation && place.requireLocation ? place.latitude ?? 0 : null,
      longitude:
        allowLocation && place.requireLocation ? place.longitude ?? 0 : null,
      radiusMeters:
        allowLocation && place.requireLocation ? place.radiusMeters ?? 100 : 0,
    };

    const existing = await tx.place.findFirst({
      where: { tenantId, name: place.name.trim(), eventId: null, meetingId: null },
    });
    if (!existing) return tx.place.create({ data });
    return tx.place.update({ where: { id: existing.id }, data });
  }
}
