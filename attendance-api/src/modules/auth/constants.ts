export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
export const REFRESH_TOKEN_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

export const jwtAccessSecret = () => process.env.JWT_SECRET ?? "dev-secret";
export const jwtRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET ?? `${jwtAccessSecret()}-refresh`;
