import jwt, { type JwtPayload } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env.js";

/**
 * Stateless access tokens (JWT). Short-lived (15m default). The subject is the
 * user id. No DB lookup is needed to verify — that's the point.
 *
 * Secrets are validated as required in production here (first call site), so a
 * misconfigured prod deploy fails loudly on the first auth attempt rather than
 * silently issuing unsigned tokens.
 */

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // user id
}

function accessSecret(): string {
  const secret = env.JWT_ACCESS_SECRET;
  if (env.NODE_ENV === "production" && !secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is required in production (set a ≥32-char random string).",
    );
  }
  // Fall back to a dev-only secret so local dev without .env secrets still works.
  return secret ?? "dev-only-access-secret-not-for-production-use-32chars";
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, accessSecret(), {
    // env string like "15m" — asserted to ms's StringValue brand.
    expiresIn: env.JWT_ACCESS_TTL as StringValue,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, accessSecret()) as AccessTokenPayload;
  if (typeof payload.sub !== "string") {
    throw new Error("Invalid access token: missing subject");
  }
  return payload;
}
