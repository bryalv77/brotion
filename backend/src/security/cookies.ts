import type { CookieOptions } from "express";
import { env } from "../config/env.js";

/**
 * Cookie helpers. Both tokens live in httpOnly cookies (never readable by JS).
 *
 * - SameSite=Lax: blocks cross-site POST from a foreign form (CSRF baseline),
 *   while still allowing top-level navigations.
 * - Secure: only set when COOKIE_SECURE=true (i.e. HTTPS / production).
 * - Path=/: scoped to the whole app.
 */
const ACCESS_TTL_SECONDS = parseTtlToSeconds(env.JWT_ACCESS_TTL);
const REFRESH_TTL_SECONDS = env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60;

const baseOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.COOKIE_SECURE === "true",
  path: "/",
});

export function accessCookieOptions(): CookieOptions {
  return { ...baseOptions(), maxAge: ACCESS_TTL_SECONDS * 1000 };
}

export function refreshCookieOptions(): CookieOptions {
  return { ...baseOptions(), maxAge: REFRESH_TTL_SECONDS * 1000 };
}

export const ACCESS_COOKIE = "nc_access";
export const REFRESH_COOKIE = "nc_refresh";

/** Parse the JWT_ACCESS_TTL string (e.g. "15m", "1h", "3600s") to seconds. */
function parseTtlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900; // default 15m
  const n = Number(match[1]);
  switch (match[2]) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 900;
  }
}
