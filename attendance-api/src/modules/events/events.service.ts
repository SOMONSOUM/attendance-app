import { Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender, Prisma } from "@prisma/client";
import type { Event, EventRegistration, Attendance } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { EventsRepository } from "./events.repository";
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
  Organization?: string;
  "Phone Number"?: string;
  Phone?: string;
};

type EventWithSummary = Event & {
  registrations?: EventRegistration[];
  attendances?: Attendance[];
  _count?: { registrations: number; attendances: number };
};

type ScheduleStatus = "LIVE" | "UPCOMING" | "ENDED";
type ScheduleShift = { startTime: Date; endTime: Date };
type Schedulable = {
  startsAt: Date;
  endsAt: Date;
  shifts?: ScheduleShift[];
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
  constructor(private readonly prisma: EventsRepository) {}

  async create(tenantId: string | null, dto: CreateEventDto) {
    const {
      places,
      shifts,
      theme,
      requireLocation,
      locationName,
      latitude,
      longitude,
      radiusMeters,
      ...eventDto
    } = dto;
    const separateQrByPlace = Boolean(dto.separateQrByPlace);
    const allowLocation = dto.mode !== EventMode.PRE_REGISTRATION;
    const code = this.toQrCode();
    const event = await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          ...eventDto,
          tenantId,
          separateQrByPlace,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          qrCodes: undefined,
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
          await tx.eventPlace.create({
            data: {
              ...placeData,
              eventId: createdEvent.id,
            },
          });
        }
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
      } else {
        const defaultPlace = await tx.eventPlace.create({
          data: this.toDefaultEventPlaceData(createdEvent.id, allowLocation, {
            requireLocation,
            locationName,
            latitude,
            longitude,
            radiusMeters,
          }),
        });
        await tx.eventQrCode.create({
          data: { eventId: createdEvent.id, placeId: defaultPlace.id, code },
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
    return {
      ...this.withPrimaryPlace(event),
      qrImage: firstCode ? await this.toQrImage(firstCode) : null,
    };
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
      events.map((event) => this.withSummary(this.withPrimaryPlace(event))),
      totalItems,
      page,
      pageSize,
    );
  }

  async update(tenantId: string | null, eventId: string, dto: UpdateEventDto) {
    const existing = await this.assertEvent(tenantId, eventId);
    const {
      places,
      shifts,
      theme,
      requireLocation,
      locationName,
      latitude,
      longitude,
      radiusMeters,
      ...eventDto
    } = dto;
    const allowLocation =
      (dto.mode ?? existing.mode) !== EventMode.PRE_REGISTRATION;

    const event = await this.prisma.$transaction(async (tx) => {
      if (shifts) {
        await tx.eventShift.deleteMany({ where: { eventId } });
      }

      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          ...eventDto,
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
            const placeData = await this.toEventPlaceData(tx, tenantId, allowLocation, place);
            await tx.eventPlace.updateMany({
              where: { id: place.id, eventId },
              data: placeData,
            });
          } else {
            const placeData = await this.toEventPlaceData(tx, tenantId, allowLocation, place);
            await tx.eventPlace.create({
              data: {
                eventId,
                ...placeData,
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
            where: { eventId, active: true },
          });
          if (!existingEventQr) {
            const defaultPlace = await tx.eventPlace.create({
              data: this.toDefaultEventPlaceData(eventId, allowLocation, {
                requireLocation,
                locationName,
                latitude,
                longitude,
                radiusMeters,
              }),
            });
            await tx.eventQrCode.create({
              data: { eventId, placeId: defaultPlace.id, code: this.toQrCode() },
            });
          }
        }
      } else if (!event.separateQrByPlace) {
        const existingPlace = await tx.eventPlace.findFirst({
          where: { eventId },
          orderBy: { createdAt: "asc" },
        });
        const placeData = this.toDefaultEventPlaceData(eventId, allowLocation, {
          requireLocation,
          locationName,
          latitude,
          longitude,
          radiusMeters,
        });
        if (existingPlace) {
          await tx.eventPlace.update({ where: { id: existingPlace.id }, data: placeData });
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
    return this.withPrimaryPlace(event);
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
      qrUrl: this.toEventScanUrl(qrs[0].code),
      qrImage: await this.toQrImage(qrs[0].code),
      qrCodes: await Promise.all(
        qrs.map(async (qr) => ({
          id: qr.id,
          code: qr.code,
          qrUrl: this.toEventScanUrl(qr.code),
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
    if (!qr?.active || !qr.event)
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
        phoneNumber: (row["Phone Number"] ?? row.Phone)?.trim(),
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
            { organization: { contains: token } },
            { phoneNumber: { contains: token } },
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
        phoneNumber: registration.phoneNumber,
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
        phoneNumber: row.phoneNumber,
        checkInCode: this.toQrCode(),
        source: `IMPORT:${importId}`,
      })),
    });

    return { count: rows.length };
  }

  private toQrImage(code: string) {
    return QRCode.toDataURL(this.toEventScanUrl(code));
  }

  private toEventScanUrl(code: string) {
    return `${this.attendanceAppUrl()}/en/scan/${code}`;
  }

  private attendanceAppUrl() {
    return (process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
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
    const place = await this.prisma.eventPlace.findFirst({
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
      where: { tenantId, name: place.name.trim() },
    });
    if (!existing) return tx.place.create({ data });
    return tx.place.update({ where: { id: existing.id }, data });
  }

  private toDefaultEventPlaceData(
    eventId: string,
    allowLocation: boolean,
    place: {
      requireLocation?: boolean;
      locationName?: string;
      latitude?: number;
      longitude?: number;
      radiusMeters?: number;
    },
  ) {
    const requireLocation = allowLocation && Boolean(place.requireLocation);
    const name =
      place.locationName?.trim() ||
      (requireLocation ? "Event venue" : "Registration desk");
    return {
      eventId,
      name,
      description: null,
      catalogPlaceId: null,
      requireLocation,
      locationName: name,
      latitude: requireLocation ? place.latitude ?? 0 : null,
      longitude: requireLocation ? place.longitude ?? 0 : null,
      radiusMeters: requireLocation ? place.radiusMeters ?? 100 : 0,
    };
  }

  private withPrimaryPlace<T extends Schedulable & { places?: Array<Record<string, any>> }>(
    event: T,
  ) {
    const primaryPlace =
      event.places?.find((place) => place.qrCodes?.some((qr: any) => !qr.placeId)) ??
      event.places?.[0];
    const schedule = this.scheduleState(event);
    return {
      ...event,
      requireLocation: primaryPlace?.requireLocation ?? false,
      locationName: primaryPlace?.locationName ?? primaryPlace?.name ?? null,
      latitude: primaryPlace?.latitude ?? null,
      longitude: primaryPlace?.longitude ?? null,
      radiusMeters: primaryPlace?.radiusMeters ?? 0,
      scheduleStatus: schedule.status,
      scheduleSortAt: schedule.sortAt,
    };
  }

  private scheduleState(item: Schedulable): {
    status: ScheduleStatus;
    sortAt: Date | null;
  } {
    const now = new Date();
    const shifts = item.shifts ?? [];

    if (!shifts.length) {
      const start = this.startOfDay(item.startsAt);
      const end = this.endOfDay(item.endsAt);
      if (now < start) return { status: "UPCOMING", sortAt: start };
      if (now > end) return { status: "ENDED", sortAt: end };
      return { status: "LIVE", sortAt: start };
    }

    const occurrences = this.shiftOccurrences(item);
    const active = occurrences.find(
      (occurrence) => now >= occurrence.start && now <= occurrence.end,
    );
    if (active) return { status: "LIVE", sortAt: active.start };

    const next = occurrences.find((occurrence) => occurrence.start > now);
    if (next) return { status: "UPCOMING", sortAt: next.start };

    const last = occurrences.at(-1);
    return { status: "ENDED", sortAt: last?.end ?? this.endOfDay(item.endsAt) };
  }

  private shiftOccurrences(item: Schedulable) {
    const firstDay = this.startOfDay(item.startsAt);
    const lastDay = this.startOfDay(item.endsAt);
    const occurrences: Array<{ start: Date; end: Date }> = [];

    for (
      let day = new Date(firstDay);
      day <= lastDay;
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    ) {
      for (const shift of item.shifts ?? []) {
        const start = new Date(day);
        start.setHours(
          shift.startTime.getUTCHours(),
          shift.startTime.getUTCMinutes(),
          0,
          0,
        );

        const end = new Date(day);
        end.setHours(
          shift.endTime.getUTCHours(),
          shift.endTime.getUTCMinutes(),
          0,
          0,
        );
        if (end <= start) end.setDate(end.getDate() + 1);

        occurrences.push({ start, end });
      }
    }

    return occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  private startOfDay(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private endOfDay(date: Date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
