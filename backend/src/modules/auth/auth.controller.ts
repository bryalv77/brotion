import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import { REFRESH_COOKIE } from "../../security/cookies.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  type IssuedSession,
} from "./auth.service.js";

/**
 * Native (Expo) clients can't use httpOnly cookies, so they opt in to receiving
 * the session tokens in the response body via `X-Client-Platform: native`.
 * The browser app never sends that header, so its tokens stay JS-inaccessible.
 */
function isNative(req: Request): boolean {
  return req.get("X-Client-Platform") === "native";
}

function sessionBody(req: Request, session: IssuedSession) {
  if (!isNative(req)) return { user: session.user };
  return {
    user: session.user,
    tokens: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    },
  };
}

/** Refresh token may arrive in a cookie (web) or a header (native). */
function presentedRefreshToken(req: Request): string | undefined {
  return req.get("X-Refresh-Token") ?? req.cookies?.[REFRESH_COOKIE];
}

/** POST /auth/register */
export async function registerHandler(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const session = await register(res, input);
  created(res, sessionBody(req, session));
}

/** POST /auth/login */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const session = await login(res, input);
  ok(res, sessionBody(req, session));
}

/** POST /auth/logout */
export async function logoutHandler(req: Request, res: Response): Promise<void> {
  await logout(res, presentedRefreshToken(req));
  noContent(res);
}

/** POST /auth/refresh */
export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const session = await refresh(res, presentedRefreshToken(req));
  ok(res, sessionBody(req, session));
}

/** GET /me */
export async function meHandler(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees req.user is set; getCurrentUser re-validates existence.
  const user = await getCurrentUser(req.user!.id);
  ok(res, { user });
}
