import type { Request, Response, NextFunction } from "express";
import { ACCESS_COOKIE } from "../security/cookies.js";
import { verifyAccessToken } from "../security/jwt.js";
import { findUserById } from "../modules/users/users.service.js";
import { unauthorized } from "../utils/errors.js";

/**
 * Require a valid access-token cookie. Populates `req.user` on success.
 *
 * Stateless: verifies the JWT without a DB hit, then loads the user to ensure
 * the account still exists (and to populate `req.user` for handlers). On any
 * failure → 401 (client should call /auth/refresh).
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Browser: httpOnly cookie. Native (Expo): bearer token from secure storage.
    const authHeader = req.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : undefined;
    const token = bearer ?? req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      next(unauthorized());
      return;
    }

    const payload = await verifyAccessToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      next(unauthorized());
      return;
    }

    req.user = user;
    next();
  } catch {
    next(unauthorized());
  }
}
