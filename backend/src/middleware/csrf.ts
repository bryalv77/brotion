import type { Request, Response, NextFunction } from "express";
import { forbidden } from "../utils/errors.js";

/**
 * CSRF guard for mutating requests.
 *
 * Defense-in-depth alongside SameSite=Lax cookies: a browser cannot add a
 * custom header (`X-Requested-With`) to a cross-origin request without triggering
 * a CORS preflight, which our CORS policy denies for untrusted origins. So the
 * mere presence of this header proves a same-origin (XHR) call.
 *
 * Apply to mutating routes (POST/PUT/PATCH/DELETE) only — never to GETs.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  if (req.get("X-Requested-With") !== "XMLHttpRequest") {
    next(forbidden("Missing required security header."));
    return;
  }
  next();
}
