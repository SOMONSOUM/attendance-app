import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

    const distanceMeters = Math.round(
      this.distance(
        Number(qr.event.latitude),
        Number(qr.event.longitude),
        dto.latitude,
        dto.longitude,
      ),
    );
    if (distanceMeters > qr.event.radiusMeters) {
      throw new BadRequestException(
        `You are ${distanceMeters}m away. Required range is ${qr.event.radiusMeters}m.`,
      );
    }

    return this.prisma.attendance.create({
      data: {
        eventId: qr.eventId,
        registrationId: dto.registrationId,
        fullNameEn: dto.fullNameEn,
        fullNameKm: dto.fullNameKm,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distanceMeters,
      },
    });
  }

  list(eventId: string) {
    return this.prisma.attendance.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }

  private distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const earthRadius = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const deltaP = ((lat2 - lat1) * Math.PI) / 180;
    const deltaL = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaP / 2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(deltaL / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
