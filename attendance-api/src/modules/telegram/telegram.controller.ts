import { Body, Controller, Headers, Post } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { TelegramService } from "./telegram.service";

@Controller("telegram")
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Public()
  @Post("webhook")
  handleWebhook(
    @Body() update: unknown,
    @Headers("x-telegram-bot-api-secret-token") secret?: string,
  ) {
    return this.telegram.handleWebhook(update, secret);
  }
}
