import { Injectable } from "@nestjs/common";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Column, Font, Photo, Text, qrcode, sone } from "sone";

type AttendeeCardInput = {
  fullNameEn: string;
  fullNameKm?: string | null;
  organization?: string | null;
  checkInCode: string;
};

const CARD_WIDTH = 1920;
const CARD_HEIGHT = 2780;
const FONT_NAME = "KantumruyPro";
const QR_BOX_SIZE = 720;
let fontLoaded = false;

@Injectable()
export class AttendeeCardService {
  async renderPng(input: AttendeeCardInput) {
    await this.loadFont();
    const displayKhmerName = input.fullNameKm?.trim() || input.fullNameEn;
    const displayEnglishName =
      input.fullNameKm?.trim() && input.fullNameEn ? input.fullNameEn : "";
    const qr = qrcode(input.checkInCode, {
      pixelSize: 18,
      whiteColor: "#ffffff",
      blackColor: "#0876cf",
    });

    const card = Column(
      Photo(this.publicAsset("card_no_qr.png"))
        .size(CARD_WIDTH, CARD_HEIGHT)
        .scaleType("cover")
        .position("absolute")
        .left(0)
        .top(0),
      Column(Photo(qr).size(596, 596))
        .padding(56)
        .bg("#ffffff")
        .rounded(42)
        .borderWidth(7)
        .borderColor("#40d5f7")
        .position("absolute")
        .left((CARD_WIDTH - QR_BOX_SIZE) / 2)
        .top(1292),
      Column(
        Text(displayKhmerName)
          .font(FONT_NAME)
          .size(displayKhmerName.length > 24 ? 70 : 84)
          .weight("bold")
          .color("#ffffff")
          .textWrap("balance")
          .maxWidth(1260),
        displayEnglishName
          ? Text(displayEnglishName)
              .font(FONT_NAME)
              .size(46)
              .weight("bold")
              .color("#e6f7ff")
              .textWrap("balance")
              .maxWidth(1260)
              .marginTop(22)
          : Text(""),
        input.organization
          ? Text(input.organization)
              .font(FONT_NAME)
              .size(42)
              .color("#d6efff")
              .textWrap("balance")
              .maxWidth(1260)
              .marginTop(18)
          : Text(""),
      )
        .alignItems("center")
        .justifyContent("center")
        .size(1380, 290)
        .padding(20, 64)
        .position("absolute")
        .left(270)
        .top(2218),
    )
      .size(CARD_WIDTH, CARD_HEIGHT)
      .alignItems("center")
      .bg("#003c98");

    return sone(card, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      background: "#003c98",
    }).png();
  }

  private async loadFont() {
    if (fontLoaded || Font.has(FONT_NAME)) return;
    await Font.load(FONT_NAME, [
      this.publicAsset("KantumruyPro-VariableFont_wght.ttf"),
      this.publicAsset("KantumruyPro-Italic-VariableFont_wght.ttf"),
    ]);
    fontLoaded = true;
  }

  private publicAsset(fileName: string) {
    const candidates = [
      join(process.cwd(), "public", fileName),
      join(process.cwd(), "attendance-api", "public", fileName),
      resolve(__dirname, "..", "..", "..", "..", "public", fileName),
    ];
    const asset = candidates.find((path) => existsSync(path));
    return asset ?? candidates[0];
  }
}
