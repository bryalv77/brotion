import { deleteCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import {
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "../security/cookies.js";
import type { AppEnv } from "./types.js";

type C = Context<AppEnv>;

export function setSessionCookies(
  c: C,
  tokens: { accessToken: string; refreshToken: string },
): void {
  const access = accessCookieOptions();
  const refresh = refreshCookieOptions();
  setCookie(c, ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite:
      access.sameSite === "none"
        ? "none"
        : access.sameSite === "strict"
          ? "strict"
          : "lax",
    secure: Boolean(access.secure),
    path: access.path ?? "/",
    maxAge: access.maxAge ? Math.floor(access.maxAge / 1000) : undefined,
  });
  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite:
      refresh.sameSite === "none"
        ? "none"
        : refresh.sameSite === "strict"
          ? "strict"
          : "lax",
    secure: Boolean(refresh.secure),
    path: refresh.path ?? "/",
    maxAge: refresh.maxAge ? Math.floor(refresh.maxAge / 1000) : undefined,
  });
}

export function clearSessionCookies(c: C): void {
  deleteCookie(c, ACCESS_COOKIE, { path: "/" });
  deleteCookie(c, REFRESH_COOKIE, { path: "/" });
}
