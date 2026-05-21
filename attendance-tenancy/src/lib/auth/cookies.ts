export const ACCESS_TOKEN_COOKIE = "tenancy_access_token";
export const REFRESH_TOKEN_COOKIE = "tenancy_refresh_token";

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
