import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EventMode, Gender, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import { MeetingsRepository } from "./meetings.repository";
import { AttendeeCardService } from "../attendance/attendee-card.service";
import { RegistrationDeliveryService } from "../notifications/registration-delivery.service";
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
  Organization?: string;
  "Phone Number"?: string;
  Phone?: string;
  Email?: string;
};

const genderMap: Record<string, Gender> = {
  male: "MALE",
  m: "MALE",
  female: "FEMALE",
  f: "FEMALE",
  other: "OTHER",
};

type ScheduleStatus = "LIVE" | "UPCOMING" | "ENDED";
type ScheduleShift = { startTime: Date; endTime: Date };
type Schedulable = {
  startsAt: Date;
  endsAt: Date;
  shifts?: ScheduleShift[];
};

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: MeetingsRepository,
    private readonly attendeeCard: AttendeeCardService,
    private readonly delivery: RegistrationDeliveryService,
  ) {}

  async create(tenantId: string | null, userId: string, dto: CreateMeetingDto) {
    this.assertChairpersons(dto.chairpersons);
    const separateQrByPlace = Boolean(dto.separateQrByPlace);
    const allowLocation = true;
    const code = this.toQrCode();

    const meeting = await this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          tenantId,
          createdById: userId,
          name: dto.name,
          description: dto.description,
          mode: dto.mode,
          personalQrEnabled: dto.personalQrEnabled,
          personalQrDeliveryMethods: dto.personalQrDeliveryMethods,
          separateQrByPlace,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          chairpersons: undefined,
          shifts: {
            create:
              dto.shifts?.map((shift) => ({
                name: shift.name,
                startTime: this.toTimeDate(shift.startTime),
                endTime: this.toTimeDate(shift.endTime),
              })) ?? [],
          },
          qrCodes: undefined,
          places: undefined,
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

      for (const chairperson of dto.chairpersons) {
        const chairpersonData = await this.toMeetingChairpersonData(
          tx,
          tenantId,
          chairperson,
        );
        await tx.chairperson.create({
          data: { ...chairpersonData, meetingId: meeting.id },
        });
      }

      if (separateQrByPlace) {
        for (const place of dto.places ?? []) {
          const placeData = await this.toMeetingPlaceData(
            tx,
            tenantId,
            allowLocation,
            place,
          );
          await tx.meetingPlace.create({
            data: { ...placeData, meetingId: meeting.id },
          });
        }
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
      } else {
        const defaultPlace = await tx.meetingPlace.create({
          data: this.toDefaultMeetingPlaceData(meeting.id, allowLocation, dto),
        });
        await tx.meetingQrCode.create({
          data: { meetingId: meeting.id, placeId: defaultPlace.id, code },
        });
      }

      return tx.meeting.findUniqueOrThrow({
        where: { id: meeting.id },
        include: this.include,
      });
    });
    return this.withPrimaryPlace(meeting);
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

    return paginated(
      items.map((meeting) => this.withPrimaryPlace(meeting)),
      totalItems,
      page,
      pageSize,
    );
  }

  async update(tenantId: string | null, meetingId: string, dto: UpdateMeetingDto) {
    const existing = await this.assertMeeting(tenantId, meetingId);
    if (dto.chairpersons) this.assertChairpersons(dto.chairpersons);

    const meeting = await this.prisma.$transaction(async (tx) => {
      if (dto.chairpersons) {
        await tx.chairperson.deleteMany({ where: { meetingId } });
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
      const allowLocation = true;
      const meeting = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          name: dto.name,
          description: dto.description,
          mode: dto.mode,
          personalQrEnabled: dto.personalQrEnabled,
          personalQrDeliveryMethods: dto.personalQrDeliveryMethods,
          separateQrByPlace: dto.separateQrByPlace,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
          chairpersons: undefined,
          shifts: dto.shifts
            ? {
                create: dto.shifts.map((shift) => ({
                  name: shift.name,
                  startTime: this.toTimeDate(shift.startTime),
                  endTime: this.toTimeDate(shift.endTime),
                })),
              }
            : undefined,
          places: undefined,
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

      if (dto.chairpersons) {
        for (const chairperson of dto.chairpersons) {
          const chairpersonData = await this.toMeetingChairpersonData(
            tx,
            tenantId,
            chairperson,
          );
          await tx.chairperson.create({
            data: { ...chairpersonData, meetingId },
          });
        }
      }

      if (dto.places && separateQrByPlace) {
        for (const place of dto.places) {
          const placeData = await this.toMeetingPlaceData(
            tx,
            tenantId,
            allowLocation,
            place,
          );
          await tx.meetingPlace.create({
            data: { ...placeData, meetingId },
          });
        }
      }

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
        const defaultPlace =
          (await tx.meetingPlace.findFirst({
            where: { meetingId },
            orderBy: { createdAt: "asc" },
          })) ??
          (await tx.meetingPlace.create({
            data: this.toDefaultMeetingPlaceData(meetingId, allowLocation, dto),
          }));
        if (!dto.places) {
          await tx.meetingPlace.update({
            where: { id: defaultPlace.id },
            data: this.toDefaultMeetingPlaceData(meetingId, allowLocation, dto),
          });
        }
        const existingQr = await tx.meetingQrCode.findFirst({
          where: { meetingId, active: true },
        });
        if (!existingQr) {
          await tx.meetingQrCode.create({
            data: { meetingId, placeId: defaultPlace.id, code: this.toQrCode() },
          });
        }
      }

      return tx.meeting.findUniqueOrThrow({
        where: { id: meeting.id },
        include: this.include,
      });
    });
    return this.withPrimaryPlace(meeting);
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
      qrUrl: this.toMeetingScanUrl(qrs[0].code),
      qrImage: await this.toQrImage(qrs[0].code),
      qrCodes: await Promise.all(
        qrs.map(async (qr) => ({
          id: qr.id,
          code: qr.code,
          qrUrl: this.toMeetingScanUrl(qr.code),
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
        phoneNumber: (row["Phone Number"] ?? row.Phone)?.trim(),
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
        phoneNumber: row.phoneNumber,
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
        title: dto.title,
        position: dto.position,
        organization: dto.organization,
        phoneNumber: dto.phoneNumber,
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
    if (!qr?.active || !qr.meeting) {
      throw new NotFoundException("Meeting QR code not found");
    }
    return { ...this.withPrimaryPlace(qr.meeting), scanPlace: qr.place };
  }

  async joinByCode(code: string, dto: JoinMeetingDto) {
    const meeting = await this.getPublicByCode(code);
    this.assertMeetingDateWindow(meeting);
    this.assertDeliveryOption(
      meeting.personalQrEnabled !== false,
      meeting.personalQrDeliveryMethods,
      dto,
    );
    const activeShift = dto.shiftId
      ? this.assertActiveShift(meeting, dto.shiftId)
      : this.assertScanWindow(meeting);

    if (meeting.mode === EventMode.BULK_REGISTRATION) {
      const distanceMeters = this.assertLocation(
        meeting.scanPlace ?? null,
        dto,
      );
      if (!dto.participantId) {
        throw new BadRequestException("Please choose a registered participant.");
      }

      const participant = await this.prisma.meetingParticipant.findFirst({
        where: {
          id: dto.participantId,
          meetingId: meeting.id,
          placeId: meeting.separateQrByPlace
            ? meeting.scanPlace?.id || undefined
            : undefined,
        },
      });

      if (!participant) throw new NotFoundException("Participant not found");
      if (participant.status === "JOINED") {
        throw new BadRequestException({
          error: "Already Joined",
          message: "This participant already joined the meeting.",
        });
      }
      const participantShift = participant.shiftId
        ? this.assertActiveShift(meeting, participant.shiftId)
        : activeShift;

      return this.prisma.meetingParticipant.update({
        where: { id: participant.id },
        data: {
          status: "JOINED",
          joinedAt: new Date(),
          shiftId: participant.shiftId ?? participantShift?.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
          distanceMeters,
        },
      });
    }

    const checkInCode = this.toQrCode();
    const shiftId = dto.shiftId
      ? (await this.assertShift(meeting.id, dto.shiftId)).id
      : activeShift?.id;
    const participant = await this.prisma.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        placeId: meeting.scanPlace?.id,
        shiftId,
        fullNameEn: dto.fullNameEn,
        fullNameKm: dto.fullNameKm,
        gender: dto.gender,
        title: dto.title,
        position: dto.position,
        organization: dto.organization,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        status: "INVITED",
        checkInCode,
        source:
          meeting.mode === EventMode.OPEN_REGISTRATION
            ? "OPEN_REGISTRATION"
            : "PRE_REGISTRATION",
      },
    });

    const personalQrEnabled = meeting.personalQrEnabled !== false;
    const cardImage = personalQrEnabled
      ? await this.toParticipantCardImage({
          fullNameEn: participant.fullNameEn,
          fullNameKm: participant.fullNameKm,
          organization: participant.organization,
          checkInCode,
        })
      : null;
    return {
      ...participant,
      qrImage: personalQrEnabled ? await this.toParticipantQrImage(checkInCode) : null,
      cardImage,
      delivery: personalQrEnabled
        ? await this.toDeliveryPayload(dto.deliveryMethod, checkInCode, {
            cardImage,
            contextName: meeting.name,
            email: participant.email,
            fullNameEn: participant.fullNameEn,
          })
        : null,
    };
  }

  async participantCard(
    tenantId: string | null,
    meetingId: string,
    participantId: string,
  ) {
    const participant = await this.prisma.meetingParticipant.findFirst({
      where: { id: participantId, meetingId, meeting: { tenantId } },
    });
    if (!participant?.checkInCode) {
      throw new NotFoundException("Participant QR code not found");
    }

    return this.attendeeCard.renderPng({
      fullNameEn: participant.fullNameEn,
      fullNameKm: participant.fullNameKm,
      organization: participant.organization,
      checkInCode: participant.checkInCode,
    });
  }

  async participantCardByCode(checkInCode: string) {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { checkInCode },
    });
    if (!participant?.checkInCode) {
      throw new NotFoundException("Participant QR code not found");
    }

    return this.attendeeCard.renderPng({
      fullNameEn: participant.fullNameEn,
      fullNameKm: participant.fullNameKm,
      organization: participant.organization,
      checkInCode: participant.checkInCode,
    });
  }

  async joinParticipantByCode(
    tenantId: string | null,
    checkInCode: string,
    meetingId?: string,
  ) {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { checkInCode },
      include: { meeting: { include: { shifts: true } } },
    });

    if (
      !participant ||
      participant.meeting.tenantId !== tenantId ||
      (meetingId && participant.meetingId !== meetingId)
    ) {
      throw new NotFoundException("Participant QR code not found");
    }
    if (participant.status === "JOINED") {
      throw new BadRequestException({
        error: "Already Joined",
        message: "This participant already joined the meeting.",
      });
    }
    this.assertMeetingDateWindow(participant.meeting);
    const activeShift = participant.shiftId
      ? this.assertActiveShift(participant.meeting, participant.shiftId)
      : this.assertScanWindow(participant.meeting);

    return this.prisma.meetingParticipant.update({
      where: { id: participant.id },
      data: {
        status: "JOINED",
        joinedAt: new Date(),
        shiftId: participant.shiftId ?? activeShift?.id,
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
    } | null,
    dto: JoinMeetingDto,
  ) {
    if (!meeting?.requireLocation) return 0;

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
    return QRCode.toDataURL(this.toMeetingScanUrl(code));
  }

  private toMeetingScanUrl(code: string) {
    return `${this.attendanceAppUrl()}/en/meeting-scan/${code}`;
  }

  private async assertShift(meetingId: string, shiftId: string) {
    const shift = await this.prisma.meetingShift.findFirst({
      where: { id: shiftId, meetingId },
    });
    if (!shift) throw new NotFoundException("Meeting shift not found");
    return shift;
  }

  private assertScanWindow(meeting: {
    startsAt: Date;
    endsAt: Date;
    shifts: { id: string; startTime: Date; endTime: Date }[];
  }) {
    this.assertMeetingDateWindow(meeting);

    if (!meeting.shifts.length) return null;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const activeShift = meeting.shifts.find((shift) =>
      this.isWithinShift(nowMinutes, shift.startTime, shift.endTime),
    );

    if (!activeShift) {
      throw new BadRequestException({
        error: "Invalid Shift Time",
        message: "Check-in can only be confirmed during an active meeting shift.",
      });
    }

    return activeShift;
  }

  private assertActiveShift(
    meeting: {
      startsAt: Date;
      endsAt: Date;
      shifts: { id: string; startTime: Date; endTime: Date }[];
    },
    shiftId: string,
  ) {
    this.assertMeetingDateWindow(meeting);
    const shift = meeting.shifts.find((item) => item.id === shiftId);
    if (!shift) throw new NotFoundException("Meeting shift not found");

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (this.isWithinShift(nowMinutes, shift.startTime, shift.endTime)) {
      return shift;
    }

    throw new BadRequestException({
      error: "Invalid Shift Time",
      message: "Check-in can only be confirmed during the assigned meeting shift.",
    });
  }

  private assertMeetingDateWindow(meeting: { startsAt: Date; endsAt: Date }) {
    const now = new Date();
    const meetingStartDate = this.startOfDay(meeting.startsAt);
    const meetingEndDate = this.endOfDay(meeting.endsAt);

    if (now < meetingStartDate) {
      throw new BadRequestException({
        error: "Meeting Not Started",
        message: "This meeting has not started yet.",
      });
    }

    if (now > meetingEndDate) {
      throw new BadRequestException({
        error: "Meeting Ended",
        message: "This meeting has already ended.",
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

  private toTimeDate(value: string) {
    const time = value.length === 5 ? `${value}:00` : value;
    return new Date(`1970-01-01T${time}.000Z`);
  }

  private toParticipantQrImage(code: string) {
    return QRCode.toDataURL(code);
  }

  private async toParticipantCardImage(input: {
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
    return (process.env.ATTENDANCE_APP_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );
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
    dto: JoinMeetingDto,
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

  private async toMeetingPlaceData(
    tx: Prisma.TransactionClient,
    tenantId: string | null,
    allowLocation: boolean,
    place: NonNullable<CreateMeetingDto["places"]>[number],
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
    place: NonNullable<CreateMeetingDto["places"]>[number],
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

  private toDefaultMeetingPlaceData(
    meetingId: string,
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
      (requireLocation ? "Meeting venue" : "Registration desk");
    return {
      meetingId,
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
    meeting: T,
  ) {
    const primaryPlace = meeting.places?.[0];
    const schedule = this.scheduleState(meeting);
    return {
      ...meeting,
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

  private async toMeetingChairpersonData(
    tx: Prisma.TransactionClient,
    tenantId: string | null,
    chairperson: CreateMeetingDto["chairpersons"][number],
  ) {
    const catalogChairperson = chairperson.catalogChairpersonId
      ? await tx.chairperson.findFirst({
          where: { id: chairperson.catalogChairpersonId, tenantId },
        })
      : await tx.chairperson.create({
          data: {
            tenantId,
            honorificTitleEn: chairperson.honorificTitleEn.trim(),
            honorificTitleKm: chairperson.honorificTitleKm.trim(),
            firstNameEn: chairperson.firstNameEn.trim(),
            firstNameKm: chairperson.firstNameKm.trim(),
            lastNameEn: chairperson.lastNameEn.trim(),
            lastNameKm: chairperson.lastNameKm.trim(),
            position: chairperson.position?.trim() || null,
            organization: chairperson.organization?.trim() || null,
          },
        });

    return {
      catalogChairpersonId: catalogChairperson?.id ?? null,
      honorificTitleEn:
        chairperson.honorificTitleEn?.trim() ||
        catalogChairperson?.honorificTitleEn ||
        "",
      honorificTitleKm:
        chairperson.honorificTitleKm?.trim() ||
        catalogChairperson?.honorificTitleKm ||
        "",
      firstNameEn:
        chairperson.firstNameEn?.trim() || catalogChairperson?.firstNameEn || "",
      firstNameKm:
        chairperson.firstNameKm?.trim() || catalogChairperson?.firstNameKm || "",
      lastNameEn:
        chairperson.lastNameEn?.trim() || catalogChairperson?.lastNameEn || "",
      lastNameKm:
        chairperson.lastNameKm?.trim() || catalogChairperson?.lastNameKm || "",
      position: chairperson.position?.trim() || catalogChairperson?.position || null,
      organization:
        chairperson.organization?.trim() ||
        catalogChairperson?.organization ||
        null,
    };
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
