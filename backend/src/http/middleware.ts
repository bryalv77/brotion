import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyAccessToken } from "../security/jwt.js";
import { findUserById } from "../modules/users/users.service.js";
import { ACCESS_COOKIE } from "../security/cookies.js";
import { forbidden, unauthorized } from "../utils/errors.js";
import type { AppEnv } from "./types.js";

/** Mutating requests must carry the CSRF header. */
export const csrfGuard = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.header("X-Requested-With") !== "XMLHttpRequest") {
    throw forbidden("Missing required security header.");
  }
  await next();
});

/** Accept the cookie (web) or a bearer token (native Expo clients). */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  const token = bearer ?? getCookie(c, ACCESS_COOKIE);
  if (!token) throw unauthorized();

  const user = await verifyAccessToken(token)
    .then((payload) => findUserById(payload.sub))
    .catch(() => null);
  if (!user) throw unauthorized();
  c.set("user", user);
  await next();
});
