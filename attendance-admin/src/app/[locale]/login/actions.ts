"use server";

import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  authCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import type { AuthSession } from "@/lib/auth/tokens";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_VERSION = "v1";

type LoginInput = {
  email: string;
  password: string;
};

export async function loginAdmin(input: LoginInput) {
  const response = await fetch(`${API_URL}/api/${API_VERSION}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Unable to login");
  }

  const session = payload.data as AuthSession;
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...authCookieOptions,
    maxAge: 60 * 15,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });

  return session.user;
}
