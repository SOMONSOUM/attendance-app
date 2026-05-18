import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtAccessSecret } from "../constants";
import type { AccessTokenPayload } from "../types/auth-user";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtAccessSecret(),
    });
  }

  validate(payload: AccessTokenPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      permissions: payload.permissions ?? [],
    };
  }
}
