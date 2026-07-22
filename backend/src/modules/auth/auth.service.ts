import type { Response } from "express";
import type { User } from "@prisma/client";
import type { UserDTO } from "@notion-clone/shared";
import argon2 from "argon2";
import { getPrisma } from "../../prisma/client.js";
import { hashPassword, verifyPassword } from "../../security/password.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../security/tokens.js";
import { signAccessToken } from "../../security/jwt.js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "../../security/cookies.js";
import { env } from "../../config/env.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../users/users.service.js";
import { toUserDTO } from "../users/users.dto.js";
import { conflict, unauthorized } from "../../utils/errors.js";

/**
 * Auth business rules. Controllers stay thin: validate input, call these, then
 * shape the HTTP response via the `ok`/`created`/`noContent` helpers.
 */

/** Mint access JWT + create a Session row, set both cookies on the response. */
async function issueSession(res: Response, user: User): Promise<UserDTO> {
  const accessToken = signAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const refreshHash = await hashRefreshToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await getPrisma().session.create({
    data: {
      user_id: user.id,
      refresh_token_hash: refreshHash,
      expires_at: expiresAt,
    },
  });

  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  return toUserDTO(user);
}

export async function register(
  res: Response,
  input: { email: string; password: string; name?: string },
): Promise<UserDTO> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw conflict("An account with that email already exists.");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
  });
  return issueSession(res, user);
}

export async function login(
  res: Response,
  input: { email: string; password: string },
): Promise<UserDTO> {
  // Deliberately identical message for unknown-email vs wrong-password.
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw unauthorized("Invalid email or password.");
  }
  const valid = await verifyPassword(user.password_hash, input.password);
  if (!valid) {
    throw unauthorized("Invalid email or password.");
  }
  return issueSession(res, user);
}

export interface RefreshResult {
  user: UserDTO;
  /** Whether a fresh refresh cookie was issued (rotation). */
  rotated: boolean;
}

/**
 * Rotate the refresh token: the presented session is revoked and a new one
 * issued. If the presented token matches a session already revoked, we treat it
 * as invalid (possible theft) → 401 + clear cookie.
 */
export async function refresh(res: Response, rawToken?: string): Promise<RefreshResult> {
  if (!rawToken) throw unauthorized();

  // Look up the active session whose stored hash verifies against the token.
  // We search by candidate rows that are not expired, then argon2-verify.
  const candidates = await getPrisma().session.findMany({
    where: {
      expires_at: { gt: new Date() },
      revoked_at: null,
    },
    include: { user: true },
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const c of candidates) {
    if (await argon2.verify(c.refresh_token_hash, rawToken)) {
      matched = c;
      break;
    }
  }
  if (!matched) throw unauthorized();

  // Revoke the consumed session (rotation).
  await getPrisma().session.update({
    where: { id: matched.id },
    data: { revoked_at: new Date() },
  });

  const dto = await issueSession(res, matched.user);
  return { user: dto, rotated: true };
}

export async function logout(res: Response, rawToken?: string): Promise<void> {
  // Best-effort revoke; always succeeds (idempotent logout).
  if (rawToken) {
    const candidates = await getPrisma().session.findMany({
      where: { revoked_at: null },
    });
    for (const c of candidates) {
      if (await argon2.verify(c.refresh_token_hash, rawToken)) {
        await getPrisma().session.update({
          where: { id: c.id },
          data: { revoked_at: new Date() },
        });
        break;
      }
    }
  }
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

export async function getCurrentUser(userId: string): Promise<UserDTO> {
  const user = await findUserById(userId);
  if (!user) throw unauthorized();
  return toUserDTO(user);
}
