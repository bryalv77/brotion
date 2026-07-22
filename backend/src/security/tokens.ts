import { randomBytes } from "node:crypto";
import argon2 from "argon2";

/**
 * Refresh tokens: opaque, random 32-byte values, URL-safe base64 for the cookie.
 * Only the argon2 hash is stored in `sessions.refresh_token_hash` — never the
 * raw token (same pattern as password storage).
 */

/** Generate a new raw refresh token to hand to the client. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash a refresh token for storage. */
export function hashRefreshToken(token: string): Promise<string> {
  // Lighter params than passwords are fine here — the token is already 256 bits
  // of entropy; the hash just prevents DB-read => token-reuse.
  return argon2.hash(token, { type: argon2.argon2id });
}
