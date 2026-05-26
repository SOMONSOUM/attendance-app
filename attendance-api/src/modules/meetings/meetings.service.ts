import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMeetingDto, JoinMeetingDto, UpdateMeetingDto } from "./dto";
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
  Email?: string;
};

const genderMap: Record<string, Gender> = {
  male: "MALE",
  m: "MALE",
  female: "FEMALE",
  f: "FEMALE",
  other: "OTHER",
};

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string | null, userId: string, dto: CreateMeetingDto) {
    this.assertChairpersons(dto.chairpersons);
    const separateQrByPlace = Boolean(dto.separateQrByPlace);
    const allowLocation = dto.mode !== EventMode.PRE_REGISTRATION;
    const code = this.toQrCode();

    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          tenantId,
          createdById: userId,
          name: dto.name,
          description: dto.description,
          mode: dto.mode,
          separateQrByPlace,
          requireLocation: allowLocation && Boolean(dto.requireLocation),
          locationName: dto.locationName?.trim() || "Not required",
          latitude: allowLocation && dto.requireLocation ? dto.latitude ?? 0 : 0,
          longitude: allowLocation && dto.requireLocation ? dto.longitude ?? 0 : 0,
          radiusMeters: allowLocation && dto.requireLocation ? dto.radiusMeters ?? 100 : 0,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          chairpersons: {
            create: dto.chairpersons.map((chairperson) => ({ ...chairperson })),
          },
          shifts: {
            create:
              dto.shifts?.map((shift) => ({
                name: shift.name,
                startTime: this.toTimeDate(shift.startTime),
                endTime: this.toTimeDate(shift.endTime),
              })) ?? [],
          },
          qrCodes: separateQrByPlace ? undefined : { create: { code } },
          places: separateQrByPlace
            ? {
                create:
                  dto.places?.map((place) => ({
                    name: place.name,
                    description: place.description,
                    requireLocation: allowLocation && Boolean(place.requireLocation),
                    locationName: place.locationName?.trim() || place.name,
                    latitude: allowLocation && place.requireLocation ? place.latitude ?? 0 : null,
                    longitude: allowLocation && place.requireLocation ? place.longitude ?? 0 : null,
                    radiusMeters: allowLocation && place.requireLocation ? place.radiusMeters ?? 100 : 0,
                  })) ?? [],
              }
            : undefined,
          participants: {
            create:
              dto.mode !== EventMode.OPEN_REGISTRATION
                ? dto.participants?.map((participant) => ({
                    ...participant,
                    checkInCode: this.toQrCode(),
                  })) ?? []
                : [],
          },
        },
      });

      if (separateQrByPlace) {
        const places = await tx.meetingPlace.findMany({
          where: { meetingId: meeting.id },
        });
        await tx.meetingQrCode.createMany({
          data: places.map((place) => ({
            meetingId: meeting.id,
            placeId: place.id,
            code: this.toQrCode(),
          })),
        });
      }

      return tx.meeting.findUniqueOrThrow({
        where: { id: meeting.id },
        include: this.include,
      });
    });
  }

  async list(tenantId: string | null, query: PaginationQuery = {}) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = { tenantId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.meeting.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: this.include,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return paginated(items, totalItems, page, pageSize);
  }

  async update(tenantId: string | null, meetingId: string, dto: UpdateMeetingDto) {
    const existing = await this.assertMeeting(tenantId, meetingId);
    if (dto.chairpersons) this.assertChairpersons(dto.chairpersons);

    return this.prisma.$transaction(async (tx) => {
      if (dto.chairpersons) {
        await tx.meetingChairperson.deleteMany({ where: { meetingId } });
      }
      if (dto.participants) {
        await tx.meetingParticipant.deleteMany({ where: { meetingId } });
      }
      if (dto.shifts) {
        await tx.meetingShift.deleteMany({ where: { meetingId } });
      }
      if (dto.places) {
        await tx.meetingPlace.deleteMany({ where: { meetingId } });
        await tx.meetingQrCode.deleteMany({ where: { meetingId } });
      }

      const separateQrByPlace =
        dto.separateQrByPlace ?? existing.separateQrByPlace;
      const allowLocation =
        (dto.mode ?? existing.mode) !== EventMode.PRE_REGISTRATION;
      const meeting = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          name: dto.name,
          description: dto.description,
          mode: dto.mode,
          separateQrByPlace: dto.separateQrByPlace,
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
          chairpersons: dto.chairpersons
            ? {
                create: dto.chairpersons.map((chairperson) => ({
                  ...chairperson,
                })),
              }
            : undefined,
          shifts: dto.shifts
            ? {
                create: dto.shifts.map((shift) => ({
                  name: shift.name,
                  startTime: this.toTimeDate(shift.startTime),
                  endTime: this.toTimeDate(shift.endTime),
                })),
              }
            : undefined,
          places: dto.places
            ? {
                create: separateQrByPlace
                  ? dto.places.map((place) => ({
                      name: place.name,
                      description: place.description,
                      requireLocation: allowLocation && Boolean(place.requireLocation),
                      locationName: place.locationName?.trim() || place.name,
                      latitude: allowLocation && place.requireLocation ? place.latitude ?? 0 : null,
                      longitude: allowLocation && place.requireLocation ? place.longitude ?? 0 : null,
                      radiusMeters: allowLocation && place.requireLocation ? place.radiusMeters ?? 100 : 0,
                    }))
                  : [],
              }
            : undefined,
          participants: dto.participants
            ? {
                create: dto.participants.map((participant) => ({
                  ...participant,
                  checkInCode: this.toQrCode(),
                })),
              }
            : undefined,
        },
      });

      if (dto.places && separateQrByPlace) {
        const places = await tx.meetingPlace.findMany({ where: { meetingId } });
        await tx.meetingQrCode.createMany({
          data: places.map((place) => ({
            meetingId,
            placeId: place.id,
            code: this.toQrCode(),
          })),
        });
      } else if (!separateQrByPlace) {
        const existingQr = await tx.meetingQrCode.findFirst({
          where: { meetingId, placeId: null, active: true },
        });
        if (!existingQr) {
          await tx.meetingQrCode.create({
            data: { meetingId, code: this.toQrCode() },
          });
        }
      }

      return tx.meeting.findUniqueOrThrow({
        where: { id: meeting.id },
        include: this.include,
      });
    });
  }

  async remove(tenantId: string | null, meetingId: string) {
    await this.assertMeeting(tenantId, meetingId);
    await this.prisma.meeting.delete({ where: { id: meetingId } });
    return { deleted: true };
  }

  async getQr(tenantId: string | null, meetingId: string) {
    await this.assertMeeting(tenantId, meetingId);
    const qrs = await this.prisma.meetingQrCode.findMany({
      where: { meetingId, active: true },
      orderBy: { createdAt: "desc" },
      include: { place: true },
    });
    if (!qrs.length) throw new NotFoundException("Meeting QR code not found");
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

  async uploadParticipants(
    tenantId: string | null,
    meetingId: string,
    file: Express.Multer.File,
    placeId?: string,
  ) {
    await this.assertMeeting(tenantId, meetingId);
    if (placeId) await this.assertPlace(meetingId, placeId);

    const workbook = XLSX.read(file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<UploadRow>(sheet);
    const data = rows
      .filter((row) => row["Fullname English"] || row["Fullname Khmer"])
      .map((row) => ({
        meetingId,
        placeId,
        fullNameEn:
          row["Fullname English"]?.trim() ??
          row["Fullname Khmer"]?.trim() ??
          "Unknown",
        fullNameKm: row["Fullname Khmer"]?.trim(),
        gender: row.Gender ? genderMap[row.Gender.toLowerCase()] : undefined,
        position: row.Position?.trim(),
        department: row.Department?.trim(),
        email: row.Email?.trim(),
        checkInCode: this.toQrCode(),
        source: "UPLOAD",
      }));

    if (!data.length) return { count: 0 };
    await this.prisma.meetingParticipant.createMany({ data });
    return { count: data.length };
  }

  async copyParticipantsFromImport(
    tenantId: string | null,
    meetingId: string,
    importId: string,
    placeId?: string,
  ) {
    await this.assertMeeting(tenantId, meetingId);
    if (placeId) await this.assertPlace(meetingId, placeId);
    const rows = await this.prisma.registrationImportRow.findMany({
      where: { importId, import: { tenantId, target: "MEETING" } },
    });

    if (!rows.length) return { count: 0 };

    await this.prisma.meetingParticipant.createMany({
      data: rows.map((row) => ({
        meetingId,
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

  async createParticipant(
    tenantId: string | null,
    meetingId: string,
    dto: JoinMeetingDto,
  ) {
    await this.assertMeeting(tenantId, meetingId);
    if (dto.participantId) {
      throw new BadRequestException("participantId is not used when creating a participant.");
    }
    if (dto.placeId) await this.assertPlace(meetingId, dto.placeId);
    if (dto.shiftId) await this.assertShift(meetingId, dto.shiftId);

    return this.prisma.meetingParticipant.create({
      data: {
        meetingId,
        placeId: dto.placeId,
        shiftId: dto.shiftId,
        fullNameEn: dto.fullNameEn,
        fullNameKm: dto.fullNameKm,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
        email: dto.email,
        status: "INVITED",
        checkInCode: this.toQrCode(),
        source: "MANUAL",
      },
    });
  }

  async joinParticipant(
    tenantId: string | null,
    meetingId: string,
    participantId: string,
  ) {
    await this.assertMeeting(tenantId, meetingId);
    return this.prisma.meetingParticipant.update({
      where: { id: participantId },
      data: { status: "JOINED", joinedAt: new Date() },
    });
  }

  async cancelParticipant(
    tenantId: string | null,
    meetingId: string,
    participantId: string,
  ) {
    await this.assertMeeting(tenantId, meetingId);
    return this.prisma.meetingParticipant.update({
      where: { id: participantId },
      data: { status: "CANCELLED", joinedAt: null },
    });
  }

  async getPublicByCode(code: string) {
    const qr = await this.prisma.meetingQrCode.findUnique({
      where: { code },
      include: {
        place: true,
        meeting: {
          include: {
            chairpersons: true,
            places: true,
            shifts: true,
            participants: true,
          },
        },
      },
    });
    if (!qr?.active) throw new NotFoundException("Meeting QR code not found");
    return { ...qr.meeting, scanPlace: qr.place };
  }

  async joinByCode(code: string, dto: JoinMeetingDto) {
    const meeting = await this.getPublicByCode(code);

    if (meeting.mode === EventMode.BULK_REGISTRATION) {
      const distanceMeters = this.assertLocation(meeting.scanPlace ?? meeting, dto);
      if (!dto.participantId) {
        throw new BadRequestException("Please choose a registered participant.");
      }

      const participant = await this.prisma.meetingParticipant.findFirst({
        where: {
          id: dto.participantId,
          meetingId: meeting.id,
          placeId: meeting.scanPlace?.id || undefined,
        },
      });

      if (!participant) throw new NotFoundException("Participant not found");
      if (participant.status === "JOINED") {
        throw new BadRequestException({
          error: "Already Joined",
          message: "This participant already joined the meeting.",
        });
      }

      return this.prisma.meetingParticipant.update({
        where: { id: participant.id },
        data: {
          status: "JOINED",
          joinedAt: new Date(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          distanceMeters,
        },
      });
    }

    const checkInCode = this.toQrCode();
    const shiftId = dto.shiftId
      ? (await this.assertShift(meeting.id, dto.shiftId)).id
      : undefined;
    const participant = await this.prisma.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        placeId: meeting.scanPlace?.id,
        shiftId,
        fullNameEn: dto.fullNameEn,
        fullNameKm: dto.fullNameKm,
        gender: dto.gender,
        position: dto.position,
        department: dto.department,
        email: dto.email,
        status: "INVITED",
        checkInCode,
        source:
          meeting.mode === EventMode.OPEN_REGISTRATION
            ? "OPEN_REGISTRATION"
            : "PRE_REGISTRATION",
      },
    });

    return {
      ...participant,
      qrImage: await this.toParticipantQrImage(checkInCode),
    };
  }

  async joinParticipantByCode(tenantId: string | null, checkInCode: string) {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { checkInCode },
      include: { meeting: true },
    });

    if (!participant || participant.meeting.tenantId !== tenantId) {
      throw new NotFoundException("Participant QR code not found");
    }
    if (participant.status === "JOINED") {
      throw new BadRequestException({
        error: "Already Joined",
        message: "This participant already joined the meeting.",
      });
    }

    return this.prisma.meetingParticipant.update({
      where: { id: participant.id },
      data: {
        status: "JOINED",
        joinedAt: new Date(),
        distanceMeters: 0,
      },
    });
  }

  private assertLocation(
    meeting: {
      requireLocation: boolean;
      latitude: unknown;
      longitude: unknown;
      radiusMeters: number;
      locationName?: string | null;
    },
    dto: JoinMeetingDto,
  ) {
    if (!meeting.requireLocation) return 0;

    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new BadRequestException({
        error: "Location Required",
        message: "Current location is required for this check-in.",
      });
    }

    const distanceMeters = this.distanceMeters(
      Number(meeting.latitude),
      Number(meeting.longitude),
      dto.latitude,
      dto.longitude,
    );

    if (distanceMeters > meeting.radiusMeters) {
      throw new BadRequestException({
        error: "Outside Check In Range",
        message: `You are ${distanceMeters}m from ${meeting.locationName ?? "the venue"}. Check-in is allowed within ${meeting.radiusMeters}m.`,
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

  private assertChairpersons(chairpersons?: unknown[]) {
    if (!chairpersons?.length) {
      throw new BadRequestException("At least one meeting chairperson is required.");
    }
  }

  private async assertMeeting(tenantId: string | null, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, tenantId },
    });
    if (!meeting) throw new NotFoundException("Meeting not found");
    return meeting;
  }

  private async assertPlace(meetingId: string, placeId: string) {
    const place = await this.prisma.meetingPlace.findFirst({
      where: { id: placeId, meetingId },
    });
    if (!place) throw new NotFoundException("Meeting place not found");
    return place;
  }

  private toQrImage(code: string) {
    return QRCode.toDataURL(
      `${process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000"}/en/meeting-scan/${code}`,
    );
  }

  private async assertShift(meetingId: string, shiftId: string) {
    const shift = await this.prisma.meetingShift.findFirst({
      where: { id: shiftId, meetingId },
    });
    if (!shift) throw new NotFoundException("Meeting shift not found");
    return shift;
  }

  private toTimeDate(value: string) {
    const time = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${time}.000Z`);
  }

  private toParticipantQrImage(code: string) {
    return QRCode.toDataURL(
      `${process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000"}/en/participant-qr/${code}`,
    );
  }

  private toQrCode() {
    return randomBytes(18).toString("base64url");
  }

  private get include() {
    return {
      chairpersons: { orderBy: { createdAt: "asc" as const } },
      places: { include: { qrCodes: true }, orderBy: { createdAt: "asc" as const } },
      shifts: { orderBy: { createdAt: "asc" as const } },
      qrCodes: true,
      participants: { orderBy: { fullNameEn: "asc" as const } },
      _count: { select: { chairpersons: true, participants: true } },
    };
  }
}
