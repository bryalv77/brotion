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
} from "./auth.service.js";

/** POST /auth/register */
export async function registerHandler(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const user = await register(res, input);
  created(res, { user });
}

/** POST /auth/login */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const user = await login(res, input);
  ok(res, { user });
}

/** POST /auth/logout */
export async function logoutHandler(req: Request, res: Response): Promise<void> {
  await logout(res, req.cookies?.[REFRESH_COOKIE]);
  noContent(res);
}

/** POST /auth/refresh */
export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const { user } = await refresh(res, req.cookies?.[REFRESH_COOKIE]);
  ok(res, { user });
}

/** GET /me */
export async function meHandler(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees req.user is set; getCurrentUser re-validates existence.
  const user = await getCurrentUser(req.user!.id);
  ok(res, { user });
}
