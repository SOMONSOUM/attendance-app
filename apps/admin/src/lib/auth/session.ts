import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./cookies";

export async function getAdminAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getAdminRefreshToken() {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}
