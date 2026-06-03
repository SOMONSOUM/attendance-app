import { BadRequestException, Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";

type SendCardEmailInput = {
  to?: string | null;
  fullNameEn: string;
  contextName: string;
  cardImage: string;
};

@Injectable()
export class RegistrationDeliveryService {
  telegramUrl(checkInCode: string) {
    const configured = process.env.TELEGRAM_BOT_USERNAME?.trim();
    if (!configured) return null;
    const username = configured.replace(/^@/, "");
    return `https://t.me/${username}?start=${encodeURIComponent(checkInCode)}`;
  }

  async sendCardEmail(input: SendCardEmailInput) {
    const to = input.to?.trim();
    if (!to) {
      throw new BadRequestException("Email address is required for email delivery.");
    }

    const host = process.env.SMTP_HOST?.trim();
    const from = process.env.SMTP_FROM?.trim();
    if (!host || !from) {
      throw new BadRequestException("Email delivery is not configured.");
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure =
      process.env.SMTP_SECURE === "true" || (!process.env.SMTP_SECURE && port === 465);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const card = this.dataUrlToBuffer(input.cardImage);
    await transporter.sendMail({
      from,
      to,
      subject: `Your personal QR card for ${input.contextName}`,
      text: [
        `Hello ${input.fullNameEn},`,
        "",
        `Your personal QR card for ${input.contextName} is attached.`,
        "Please bring it with you for check-in.",
      ].join("\n"),
      html: [
        `<p>Hello ${this.escapeHtml(input.fullNameEn)},</p>`,
        `<p>Your personal QR card for <strong>${this.escapeHtml(input.contextName)}</strong> is attached.</p>`,
        "<p>Please bring it with you for check-in.</p>",
      ].join(""),
      attachments: [
        {
          filename: "personal-qr-card.png",
          content: card,
          contentType: "image/png",
        },
      ],
    });
  }

  private dataUrlToBuffer(dataUrl: string) {
    const [, payload] = dataUrl.split(",");
    if (!payload) {
      throw new BadRequestException("Invalid card image.");
    }
    return Buffer.from(payload, "base64");
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
