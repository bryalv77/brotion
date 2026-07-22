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
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      next(unauthorized());
      return;
    }

    const payload = verifyAccessToken(token);
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
