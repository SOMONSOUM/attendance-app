import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { JoinEventDto } from "./dto";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async joinByCode(code: string, dto: JoinEventDto) {
    const qr = await this.prisma.eventQrCode.findUnique({
      where: { code },
      include: { event: { include: { shifts: true } } },
    });
    if (!qr?.active)
      throw new NotFoundException("QR code was not found or is inactive");
    const activeShift = this.assertScanWindow(qr.event);
    const registration = dto.registrationId
      ? await this.prisma.eventRegistration.findFirst({
          where: {
            id: dto.registrationId,
            eventId: qr.eventId,
            placeId: qr.placeId || undefined,
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
          distanceMeters: 0,
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

  list(eventId: string) {
    return this.prisma.attendance.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }

  async roster(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
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
        shiftId: attendance?.shiftId ?? null,
        shiftName: attendance?.shiftId
          ? event.shifts.find((shift) => shift.id === attendance.shiftId)
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

  async joinRegistration(eventId: string, registrationId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { shifts: true },
    });

    if (!event) throw new NotFoundException("Event not found");
    const activeShift = this.assertScanWindow(event);

    const registration = await this.prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId },
    });

    if (!registration) throw new NotFoundException("Registration not found");

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
        shiftId: activeShift?.id,
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

  async cancel(attendanceId: string) {
    await this.prisma.attendance.delete({ where: { id: attendanceId } });
    return { cancelled: true };
  }

  private alreadyJoinedException() {
    return new ConflictException({
      error: "Already Joined",
      message: "This user already joined the event.",
    });
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
