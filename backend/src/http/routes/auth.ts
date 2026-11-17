import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types.js";
import { ok } from "../http.js";
import { csrfGuard } from "../middleware.js";
import { setSessionCookies, clearSessionCookies } from "../cookies.js";
import {
  register,
  login,
  refresh,
  logout,
  type IssuedSession,
} from "../../modules/auth/auth.service.js";
import { registerSchema, loginSchema } from "../../modules/auth/auth.schema.js";
import { REFRESH_COOKIE } from "../../security/cookies.js";

export const authRoutes = new Hono<AppEnv>();

function isNative(c: { req: { header: (name: string) => string | undefined } }): boolean {
  return c.req.header("X-Client-Platform") === "native";
}

function sessionBody(c: { req: { header: (name: string) => string | undefined } }, session: IssuedSession) {
  if (!isNative(c)) return { user: session.user };
  return {
    user: session.user,
    tokens: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    },
  };
}

function presentedRefreshToken(c: { req: { header: (name: string) => string | undefined } }): string | undefined {
  return (
    c.req.header("X-Refresh-Token") ??
    getCookie(c as never, REFRESH_COOKIE) ??
    undefined
  );
}

authRoutes.post("/register", csrfGuard, async (c) => {
  const input = registerSchema.parse(await c.req.json());
  const session = await register(input);
  setSessionCookies(c, session);
  return ok(c, sessionBody(c, session), 201);
});

authRoutes.post("/login", csrfGuard, async (c) => {
  const input = loginSchema.parse(await c.req.json());
  const session = await login(input);
  setSessionCookies(c, session);
  return ok(c, sessionBody(c, session));
});

authRoutes.post("/logout", csrfGuard, async (c) => {
  await logout(presentedRefreshToken(c));
  clearSessionCookies(c);
  return c.body(null, 204);
});

authRoutes.post("/refresh", csrfGuard, async (c) => {
  const session = await refresh(presentedRefreshToken(c));
  setSessionCookies(c, session);
  return ok(c, sessionBody(c, session));
});
