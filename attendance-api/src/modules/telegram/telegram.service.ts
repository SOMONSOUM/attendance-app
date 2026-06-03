import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { AttendeeCardService } from "../attendance/attendee-card.service";
import { PrismaService } from "../prisma/prisma.service";

type TelegramMessage = {
  chat?: { id?: number | string };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendeeCard: AttendeeCardService,
  ) {}

  async handleWebhook(update: unknown, secret?: string) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (expectedSecret && secret !== expectedSecret) {
      throw new BadRequestException("Invalid Telegram webhook secret.");
    }

    const message = (update as TelegramUpdate)?.message;
    const chatId = message?.chat?.id;
    const text = message?.text?.trim() ?? "";
    if (!chatId || !text.startsWith("/start")) {
      return { ok: true };
    }

    const checkInCode = text.split(/\s+/)[1];
    if (!checkInCode) {
      await this.sendText(chatId, "Please submit the registration form first, then open this bot link again.");
      return { ok: true };
    }

    const payload = await this.findRegistration(checkInCode);
    if (!payload) {
      await this.sendText(chatId, "We could not find a personal QR card for this registration.");
      return { ok: true };
    }

    const card = await this.attendeeCard.renderPng({
      fullNameEn: payload.fullNameEn,
      fullNameKm: payload.fullNameKm,
      organization: payload.organization,
      checkInCode,
    });
    await this.sendPhoto(
      chatId,
      card,
      `Registration successful for ${payload.contextName}. Please bring this personal QR card for check-in.`,
    );
    return { ok: true };
  }

  private async findRegistration(checkInCode: string) {
    const eventRegistration = await this.prisma.eventRegistration.findUnique({
      where: { checkInCode },
      include: { event: true },
    });
    if (eventRegistration) {
      return {
        fullNameEn: eventRegistration.fullNameEn,
        fullNameKm: eventRegistration.fullNameKm,
        organization: eventRegistration.organization,
        contextName: eventRegistration.event.name,
      };
    }

    const meetingParticipant = await this.prisma.meetingParticipant.findUnique({
      where: { checkInCode },
      include: { meeting: true },
    });
    if (!meetingParticipant) return null;
    return {
      fullNameEn: meetingParticipant.fullNameEn,
      fullNameKm: meetingParticipant.fullNameKm,
      organization: meetingParticipant.organization,
      contextName: meetingParticipant.meeting.name,
    };
  }

  private async sendText(chatId: number | string, text: string) {
    await this.telegramFetch("sendMessage", {
      chat_id: chatId,
      text,
    });
  }

  private async sendPhoto(chatId: number | string, card: Buffer, caption: string) {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("caption", caption);
    form.append(
      "photo",
      new Blob([new Uint8Array(card)], { type: "image/png" }),
      "personal-qr-card.png",
    );
    await this.telegramFetch("sendPhoto", form);
  }

  private async telegramFetch(method: string, body: FormData | Record<string, unknown>) {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) {
      this.logger.warn("Telegram bot token is not configured.");
      return;
    }

    const isForm = body instanceof FormData;
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: isForm ? undefined : { "Content-Type": "application/json" },
      body: isForm ? body : JSON.stringify(body),
    });
    if (!response.ok) {
      const message = await response.text();
      this.logger.error(`Telegram ${method} failed: ${message}`);
    }
  }
}
