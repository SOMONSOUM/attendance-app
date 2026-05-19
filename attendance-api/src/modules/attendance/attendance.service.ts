import {
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
      include: { event: true },
    });
    if (!qr?.active)
      throw new NotFoundException("QR code was not found or is inactive");
    const registration = dto.registrationId
      ? await this.prisma.eventRegistration.findFirst({
          where: { id: dto.registrationId, eventId: qr.eventId },
        })
      : null;

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
          shiftId: registration?.shiftId ?? dto.shiftId,
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
      },
    });

    if (!event) throw new NotFoundException("Event not found");

    const attendanceByRegistration = new Map(
      event.attendances
        .filter((attendance) => attendance.registrationId)
        .map((attendance) => [attendance.registrationId, attendance]),
    );
    const registrationRows = event.registrations.map((registration) => {
      const attendance = attendanceByRegistration.get(registration.id);

      return {
        id: registration.id,
        eventId,
        registrationId: registration.id,
        attendanceId: attendance?.id ?? null,
        shiftId: registration.shiftId,
        shiftName:
          event.shifts.find((shift) => shift.id === registration.shiftId)
            ?.name ?? null,
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
      .map((attendance) => ({
        id: attendance.id,
        eventId,
        registrationId: null,
        attendanceId: attendance.id,
        shiftId: attendance.shiftId,
        shiftName:
          event.shifts.find((shift) => shift.id === attendance.shiftId)?.name ??
          null,
        fullNameEn: attendance.fullNameEn,
        fullNameKm: attendance.fullNameKm,
        gender: attendance.gender,
        position: attendance.position,
        department: attendance.department,
        joined: true,
        status: attendance.status,
        joinedAt: attendance.createdAt,
      }));

    return [...registrationRows, ...walkInRows];
  }

  async joinRegistration(eventId: string, registrationId: string) {
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
        shiftId: registration.shiftId,
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
}
