import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventMode, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { AttendanceRepository } from "./attendance.repository";
import { AttendeeCardService } from "./attendee-card.service";
import { JoinEventDto } from "./dto";
import { RegistrationDeliveryService } from "../notifications/registration-delivery.service";
import {
  paginated,
  parsePagination,
  type PaginationQuery,
} from "../../common/pagination";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: AttendanceRepository,
    private readonly attendeeCard: AttendeeCardService,
    private readonly delivery: RegistrationDeliveryService,
  ) {}

  async joinByCode(code: string, dto: JoinEventDto) {
    const qr = await this.prisma.eventQrCode.findUnique({
      where: { code },
      include: { place: true, event: { include: { shifts: true } } },
    });
    if (!qr?.active || !qr.event || !qr.eventId)
      throw new NotFoundException("QR code was not found or is inactive");
    const activeShift = this.assertScanWindow(qr.event);
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
    if (qr.event.mode === EventMode.BULK_REGISTRATION && registration) {
      if (!registration.checkInCode) {
        throw new NotFoundException("Registration QR code not found");
      }

      return {
        ...registration,
        qrImage: await this.toAttendeeQrImage(registration.checkInCode),
        cardImage: await this.toAttendeeCardImage({
          fullNameEn: registration.fullNameEn,
          fullNameKm: registration.fullNameKm,
          organization: registration.organization,
          checkInCode: registration.checkInCode,
        }),
      };
    }

    const distanceMeters = this.assertLocation(qr.place, dto);
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
          phoneNumber: dto.phoneNumber,
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
      include: { event: { include: { shifts: true } } },
    });
    if (!qr?.active || !qr.event || !qr.eventId)
      throw new NotFoundException("QR code was not found or is inactive");

    this.assertDeliveryOption(
      qr.event.personalQrEnabled !== false,
      qr.event.personalQrDeliveryMethods,
      dto,
    );
    const checkInCode = this.toQrCode();
    await this.assertUniqueRegistration(qr.eventId, dto);
    const activeShift = this.activeShiftForToday(qr.event);
    const shiftId = dto.shiftId
      ? (await this.assertShift(qr.eventId, dto.shiftId)).id
      : activeShift?.id;
    const registration = await this.prisma.$transaction(async (tx) => {
      const created = await tx.eventRegistration.create({
        data: {
          eventId: qr.eventId,
          placeId: qr.placeId,
          shiftId,
          fullNameEn: dto.fullNameEn,
          fullNameKm: dto.fullNameKm,
          gender: dto.gender,
          title: dto.title,
          position: dto.position,
          organization: dto.organization,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          checkInCode,
          source:
            qr.event.mode === "OPEN_REGISTRATION"
              ? "OPEN_REGISTRATION"
              : "PRE_REGISTRATION",
        },
      });

      if (activeShift) {
        await tx.attendance.create({
          data: {
            eventId: qr.eventId,
            placeId: qr.placeId,
            shiftId: activeShift.id,
            registrationId: created.id,
            fullNameEn: created.fullNameEn,
            fullNameKm: created.fullNameKm,
            gender: created.gender,
            position: created.position,
            phoneNumber: created.phoneNumber,
            latitude: dto.latitude ?? 0,
            longitude: dto.longitude ?? 0,
            distanceMeters: 0,
          },
        });
      }

      return created;
    });

    const personalQrEnabled = qr.event.personalQrEnabled !== false;
    const cardImage = personalQrEnabled
      ? await this.toAttendeeCardImage({
          fullNameEn: registration.fullNameEn,
          fullNameKm: registration.fullNameKm,
          organization: registration.organization,
          checkInCode,
        })
      : null;
    return {
      ...registration,
      qrImage: personalQrEnabled ? await this.toAttendeeQrImage(checkInCode) : null,
      cardImage,
      delivery: personalQrEnabled
        ? await this.toDeliveryPayload(dto.deliveryMethod, checkInCode, {
            cardImage,
            contextName: qr.event.name,
            email: registration.email,
            fullNameEn: registration.fullNameEn,
          })
        : null,
    };
  }

  async updateRegistration(
    tenantId: string | null,
    eventId: string,
    registrationId: string,
    dto: JoinEventDto,
  ) {
    await this.assertEventForTenant(tenantId, eventId);
    if (dto.shiftId) await this.assertShift(eventId, dto.shiftId);
    const registration = await this.prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId },
      select: { id: true },
    });
    if (!registration) throw new NotFoundException("Registration not found");
    await this.assertUniqueRegistration(eventId, dto, registrationId);
    const updatedRegistration = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        fullNameEn: dto.fullNameEn,
        fullNameKm: dto.fullNameKm,
        gender: dto.gender,
        title: dto.title,
        position: dto.position,
        organization: dto.organization,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        shiftId: dto.shiftId || null,
      },
    });

    await this.prisma.attendance.updateMany({
      where: { eventId, registrationId },
      data: {
        fullNameEn: updatedRegistration.fullNameEn,
        fullNameKm: updatedRegistration.fullNameKm,
        gender: updatedRegistration.gender,
        position: updatedRegistration.position,
        organization: updatedRegistration.organization,
        phoneNumber: updatedRegistration.phoneNumber,
        shiftId: updatedRegistration.shiftId,
      },
    });

    return updatedRegistration;
  }

  async registrationCard(
    tenantId: string | null,
    eventId: string,
    registrationId: string,
  ) {
    const registration = await this.prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId, event: { tenantId } },
    });
    if (!registration?.checkInCode) {
      throw new NotFoundException("Registration QR code not found");
    }

    return this.attendeeCard.renderPng({
      fullNameEn: registration.fullNameEn,
      fullNameKm: registration.fullNameKm,
      organization: registration.organization,
      checkInCode: registration.checkInCode,
    });
  }

  async registrationCardByCode(checkInCode: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { checkInCode },
    });
    if (!registration?.checkInCode) {
      throw new NotFoundException("Registration QR code not found");
    }

    return this.attendeeCard.renderPng({
      fullNameEn: registration.fullNameEn,
      fullNameKm: registration.fullNameKm,
      organization: registration.organization,
      checkInCode: registration.checkInCode,
    });
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
        title: registration.title,
        position: registration.position,
        organization: registration.organization,
        phoneNumber: registration.phoneNumber,
        email: registration.email,
        checkInCode: registration.checkInCode,
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
          title: null,
          position: attendance.position,
          organization: attendance.organization,
          phoneNumber: attendance.phoneNumber,
          email: null,
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
    this.assertEventDateWindow(event);
    const activeShift = registration.shiftId
      ? this.assertActiveShift(event, registration.shiftId)
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
        phoneNumber: registration.phoneNumber,
        latitude: 0,
        longitude: 0,
        distanceMeters: 0,
      },
    });
  }

  async joinRegistrationByCode(
    tenantId: string | null,
    checkInCode: string,
    eventId?: string,
  ) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { checkInCode },
      include: { event: { include: { shifts: true } } },
    });

    if (
      !registration ||
      registration.event.tenantId !== tenantId ||
      (eventId && registration.eventId !== eventId)
    ) {
      throw new NotFoundException("Registration QR code not found");
    }

    this.assertEventDateWindow(registration.event);
    const activeShift = registration.shiftId
      ? this.assertActiveShift(registration.event, registration.shiftId)
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
        phoneNumber: registration.phoneNumber,
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

  private async toAttendeeCardImage(input: {
    fullNameEn: string;
    fullNameKm?: string | null;
    organization?: string | null;
    checkInCode: string;
  }) {
    const buffer = await this.attendeeCard.renderPng({
      fullNameEn: input.fullNameEn,
      fullNameKm: input.fullNameKm,
      organization: input.organization,
      checkInCode: input.checkInCode,
    });
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }

  private attendanceAppUrl() {
    return process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000";
  }

  private toQrCode() {
    return randomBytes(18).toString("base64url");
  }

  private async toDeliveryPayload(
    method: string | undefined,
    checkInCode: string,
    input: {
      cardImage: string | null;
      contextName: string;
      email?: string | null;
      fullNameEn: string;
    },
  ) {
    const deliveryMethod = method || "download";
    if (deliveryMethod === "email" && input.cardImage) {
      await this.delivery.sendCardEmail({
        to: input.email,
        fullNameEn: input.fullNameEn,
        contextName: input.contextName,
        cardImage: input.cardImage,
      });
    }
    return {
      method: deliveryMethod,
      telegramUrl:
        deliveryMethod === "telegram" ? this.delivery.telegramUrl(checkInCode) : null,
      emailSent: deliveryMethod === "email",
    };
  }

  private assertDeliveryOption(
    personalQrEnabled: boolean,
    configuredMethods: string | null | undefined,
    dto: JoinEventDto,
  ) {
    if (!personalQrEnabled) return;
    const method = dto.deliveryMethod || "download";
    const allowed = (configuredMethods || "download,email,telegram")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!allowed.includes(method)) {
      throw new BadRequestException("This QR delivery method is not enabled.");
    }
    if (method === "email" && !dto.email?.trim()) {
      throw new BadRequestException("Email address is required for email delivery.");
    }
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
    this.assertEventDateWindow(event);

    if (!event.shifts.length) return null;

    const now = new Date();
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

  private activeShiftForToday(event: {
    startsAt: Date;
    endsAt: Date;
    shifts: { id: string; startTime: Date; endTime: Date }[];
  }) {
    const now = new Date();
    if (now < this.startOfDay(event.startsAt) || now > this.endOfDay(event.endsAt)) {
      return null;
    }
    if (!event.shifts.length) return null;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return (
      event.shifts.find((shift) =>
        this.isWithinShift(nowMinutes, shift.startTime, shift.endTime),
      ) ?? null
    );
  }

  private async assertEventForTenant(tenantId: string | null, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException("Event not found");
  }

  private async assertUniqueRegistration(
    eventId: string,
    dto: JoinEventDto,
    excludeRegistrationId?: string,
  ) {
    const fullNameEn = dto.fullNameEn?.trim();
    const phoneNumber = dto.phoneNumber?.trim();
    const duplicateChecks: Prisma.EventRegistrationWhereInput[] = [];
    if (fullNameEn) duplicateChecks.push({ fullNameEn });
    if (phoneNumber) duplicateChecks.push({ phoneNumber });
    if (!duplicateChecks.length) return;

    const existing = await this.prisma.eventRegistration.findFirst({
      where: {
        eventId,
        id: excludeRegistrationId ? { not: excludeRegistrationId } : undefined,
        OR: duplicateChecks,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        "An attendee with the same full name or phone number is already registered.",
      );
    }
  }

  private assertActiveShift(
    event: {
      startsAt: Date;
      endsAt: Date;
      shifts: { id: string; startTime: Date; endTime: Date }[];
    },
    shiftId: string,
  ) {
    this.assertEventDateWindow(event);
    const shift = event.shifts.find((item) => item.id === shiftId);
    if (!shift) throw new NotFoundException("Event shift not found");

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (this.isWithinShift(nowMinutes, shift.startTime, shift.endTime)) {
      return shift;
    }

    throw new BadRequestException({
      error: "Invalid Shift Time",
      message: "Attendance can only be confirmed during the assigned shift.",
    });
  }

  private assertEventDateWindow(event: { startsAt: Date; endsAt: Date }) {
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
