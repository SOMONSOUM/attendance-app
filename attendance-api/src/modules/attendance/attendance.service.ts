import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { AttendanceRepository } from "./attendance.repository";
import { JoinEventDto } from "./dto";
import {
  paginated,
  parsePagination,
  type PaginationQuery,
} from "../../common/pagination";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: AttendanceRepository) {}

  async joinByCode(code: string, dto: JoinEventDto) {
    const qr = await this.prisma.eventQrCode.findUnique({
      where: { code },
      include: { place: true, event: { include: { shifts: true } } },
    });
    if (!qr?.active || !qr.event || !qr.eventId)
      throw new NotFoundException("QR code was not found or is inactive");
    const activeShift = this.assertScanWindow(qr.event);
    const distanceMeters = this.assertLocation(qr.place, dto);
    const registration = dto.registrationId
      ? await this.prisma.eventRegistration.findFirst({
        where: {
          id: dto.registrationId,
          eventId: qr.eventId,
          placeId: qr.event.separateQrByPlace ? qr.placeId || undefined : undefined,
        },
      })
      : null;
    if (dto.registrationId && !registration) {
      throw new NotFoundException("Registration not found for this QR code");
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        eventId: qr.eventId,
        OR: [
          ...(dto.registrationId
            ? [{ registrationId: dto.registrationId }]
            : []),
          {
            registrationId: null,
            fullNameEn: dto.fullNameEn,
          },
        ],
      },
    });

    if (existingAttendance) throw this.alreadyJoinedException();

    try {
      return await this.prisma.attendance.create({
        data: {
          eventId: qr.eventId,
          placeId: qr.placeId ?? registration?.placeId,
          shiftId: activeShift?.id,
          registrationId: dto.registrationId,
          fullNameEn: dto.fullNameEn,
          fullNameKm: dto.fullNameKm,
          gender: dto.gender,
          position: dto.position,
          department: dto.department,
          latitude: dto.latitude ?? 0,
          longitude: dto.longitude ?? 0,
          distanceMeters,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw this.alreadyJoinedException();
      }

      throw error;
    }
  }

  async registerByCode(code: string, dto: JoinEventDto) {
    const qr = await this.prisma.eventQrCode.findUnique({
      where: { code },
      include: { event: true },
    });
    if (!qr?.active || !qr.event || !qr.eventId)
      throw new NotFoundException("QR code was not found or is inactive");

    const checkInCode = this.toQrCode();
    const shiftId = dto.shiftId
      ? (await this.assertShift(qr.eventId, dto.shiftId)).id
      : undefined;
    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId: qr.eventId,
        placeId: qr.placeId,
        shiftId,
        fullNameEn: dto.fullNameEn,
        fullNameKm: dto.fullNameKm,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
        checkInCode,
        source:
          qr.event.mode === "OPEN_REGISTRATION"
            ? "OPEN_REGISTRATION"
            : "PRE_REGISTRATION",
      },
    });

    return {
      ...registration,
      qrImage: await this.toAttendeeQrImage(checkInCode),
    };
  }

  async list(
    tenantId: string | null,
    eventId: string,
    query: PaginationQuery = {},
  ) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = { eventId, event: { tenantId } };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.attendance.count({ where }),
    ]);
    return paginated(items, totalItems, page, pageSize);
  }

  async roster(tenantId: string | null, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: {
        registrations: { orderBy: { fullNameEn: "asc" } },
        attendances: { orderBy: { createdAt: "desc" } },
        shifts: true,
        places: true,
      },
    });

    if (!event) throw new NotFoundException("Event not found");

    const attendanceByRegistration = new Map(
      event.attendances
        .filter((attendance) => attendance.registrationId)
        .map((attendance) => [attendance.registrationId, attendance]),
    );
    const placeById = new Map(event.places.map((place) => [place.id, place]));
    const registrationRows = event.registrations.map((registration) => {
      const attendance = attendanceByRegistration.get(registration.id);
      const placeId = attendance?.placeId ?? registration.placeId;
      const place = placeId ? placeById.get(placeId) : null;

      return {
        id: registration.id,
        eventId,
        registrationId: registration.id,
        attendanceId: attendance?.id ?? null,
        placeId,
        placeName: place?.name ?? null,
        shiftId: attendance?.shiftId ?? registration.shiftId ?? null,
        shiftName: (attendance?.shiftId ?? registration.shiftId)
          ? event.shifts.find(
              (shift) =>
                shift.id === (attendance?.shiftId ?? registration.shiftId),
            )
              ?.name ?? null
          : null,
        fullNameEn: registration.fullNameEn,
        fullNameKm: registration.fullNameKm,
        gender: registration.gender,
        position: registration.position,
        department: registration.department,
        joined: Boolean(attendance),
        status: attendance?.status ?? "NOT_YET",
        joinedAt: attendance?.createdAt ?? null,
      };
    });
    const walkInRows = event.attendances
      .filter((attendance) => !attendance.registrationId)
      .map((attendance) => {
        const place = attendance.placeId
          ? placeById.get(attendance.placeId)
          : null;

        return {
          id: attendance.id,
          eventId,
          registrationId: null,
          attendanceId: attendance.id,
          placeId: attendance.placeId,
          placeName: place?.name ?? null,
          shiftId: attendance.shiftId,
          shiftName:
            event.shifts.find((shift) => shift.id === attendance.shiftId)
              ?.name ?? null,
          fullNameEn: attendance.fullNameEn,
          fullNameKm: attendance.fullNameKm,
          gender: attendance.gender,
          position: attendance.position,
          department: attendance.department,
          joined: true,
          status: attendance.status,
          joinedAt: attendance.createdAt,
        };
      });

    return [...registrationRows, ...walkInRows];
  }

  async joinRegistration(
    tenantId: string | null,
    eventId: string,
    registrationId: string,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: { shifts: true },
    });

    if (!event) throw new NotFoundException("Event not found");

    const registration = await this.prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId },
    });

    if (!registration) throw new NotFoundException("Registration not found");
    const activeShift = registration.shiftId
      ? null
      : this.assertScanWindow(event);
    const selectedShiftId = registration.shiftId ?? activeShift?.id;

    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        eventId_registrationId: {
          eventId,
          registrationId,
        },
      },
    });

    if (existingAttendance) throw this.alreadyJoinedException();

    return this.prisma.attendance.create({
      data: {
        eventId,
        placeId: registration.placeId,
        shiftId: selectedShiftId,
        registrationId,
        fullNameEn: registration.fullNameEn,
        fullNameKm: registration.fullNameKm,
        gender: registration.gender,
        position: registration.position,
        department: registration.department,
        latitude: 0,
        longitude: 0,
        distanceMeters: 0,
      },
    });
  }

  async joinRegistrationByCode(tenantId: string | null, checkInCode: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { checkInCode },
      include: { event: { include: { shifts: true } } },
    });

    if (!registration || registration.event.tenantId !== tenantId) {
      throw new NotFoundException("Registration QR code not found");
    }

    const activeShift = registration.shiftId
      ? null
      : this.assertScanWindow(registration.event);
    const selectedShiftId = registration.shiftId ?? activeShift?.id;
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        eventId_registrationId: {
          eventId: registration.eventId,
          registrationId: registration.id,
        },
      },
    });

    if (existingAttendance) throw this.alreadyJoinedException();

    return this.prisma.attendance.create({
      data: {
        eventId: registration.eventId,
        placeId: registration.placeId,
        shiftId: selectedShiftId,
        registrationId: registration.id,
        fullNameEn: registration.fullNameEn,
        fullNameKm: registration.fullNameKm,
        gender: registration.gender,
        position: registration.position,
        department: registration.department,
        latitude: 0,
        longitude: 0,
        distanceMeters: 0,
      },
    });
  }

  async cancel(tenantId: string | null, attendanceId: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, event: { tenantId } },
    });
    if (!attendance) throw new NotFoundException("Attendance not found");
    await this.prisma.attendance.delete({ where: { id: attendanceId } });
    return { cancelled: true };
  }

  private alreadyJoinedException() {
    return new ConflictException({
      error: "Already Joined",
      message: "This user already joined the event.",
    });
  }

  private toAttendeeQrImage(code: string) {
    return QRCode.toDataURL(code);
  }

  private toQrCode() {
    return randomBytes(18).toString("base64url");
  }

  private async assertShift(eventId: string, shiftId: string) {
    const shift = await this.prisma.eventShift.findFirst({
      where: { id: shiftId, eventId },
    });
    if (!shift) throw new NotFoundException("Event shift not found");
    return shift;
  }

  private assertLocation(
    event: {
      requireLocation: boolean;
      latitude: unknown;
      longitude: unknown;
      radiusMeters: number;
      locationName?: string | null;
    } | null,
    dto: JoinEventDto,
  ) {
    if (!event?.requireLocation) return 0;

    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new BadRequestException({
        error: "Location Required",
        message: "Current location is required for this check-in.",
      });
    }

    const distanceMeters = this.distanceMeters(
      Number(event.latitude),
      Number(event.longitude),
      dto.latitude,
      dto.longitude,
    );

    if (distanceMeters > event.radiusMeters) {
      throw new BadRequestException({
        error: "Outside Check In Range",
        message: `You are ${distanceMeters}m from ${event.locationName ?? "the venue"}. Check-in is allowed within ${event.radiusMeters}m.`,
      });
    }

    return distanceMeters;
  }

  private distanceMeters(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ) {
    const earthRadiusMeters = 6_371_000;
    const deltaLat = this.toRadians(toLat - fromLat);
    const deltaLng = this.toRadians(toLng - fromLng);
    const lat1 = this.toRadians(fromLat);
    const lat2 = this.toRadians(toLat);
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return Math.round(
      earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
    );
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }

  private assertScanWindow(event: {
    startsAt: Date;
    endsAt: Date;
    shifts: { id: string; startTime: Date; endTime: Date }[];
  }) {
    const now = new Date();
    const eventStartDate = this.startOfDay(event.startsAt);
    const eventEndDate = this.endOfDay(event.endsAt);

    if (now < eventStartDate) {
      throw new BadRequestException({
        error: "Event Not Started",
        message: "This event has not started yet.",
      });
    }

    if (now > eventEndDate) {
      throw new BadRequestException({
        error: "Event Ended",
        message: "This event has already ended.",
      });
    }

    if (!event.shifts.length) return null;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const activeShift = event.shifts.find((shift) =>
      this.isWithinShift(nowMinutes, shift.startTime, shift.endTime),
    );

    if (!activeShift) {
      throw new BadRequestException({
        error: "Invalid Shift Time",
        message: "Attendance can only be confirmed during an active shift.",
      });
    }

    return activeShift;
  }

  private isWithinShift(nowMinutes: number, startTime: Date, endTime: Date) {
    const startMinutes = this.toMinutes(startTime);
    const endMinutes = this.toMinutes(endTime);

    if (startMinutes <= endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
    }

    return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
  }

  private toMinutes(time: Date) {
    return time.getUTCHours() * 60 + time.getUTCMinutes();
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
