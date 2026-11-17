import type { User } from "@prisma/client";
import type { UserDTO } from "@notion-clone/shared";

import { getPrisma } from "../../prisma/client.js";
import { hashPassword, verifyPassword } from "../../security/password.js";
import {
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from "../../security/tokens.js";
import { signAccessToken } from "../../security/jwt.js";
import { env } from "../../config/env.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../users/users.service.js";
import { toUserDTO } from "../users/users.dto.js";
import { conflict, unauthorized } from "../../utils/errors.js";

/**
 * Auth business rules. Route handlers stay thin: validate input, call these, then
 * shape the HTTP response via the `ok`/`created`/`noContent` helpers.
 */

/**
 * Session material returned to callers. The web app ignores the tokens (they
 * live in httpOnly cookies); the native clients (Expo iOS/Android) persist them
 * in secure storage and send them as bearer/refresh headers.
 */
export interface IssuedSession {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

/** Mint access JWT + create a Session row; the HTTP layer sets the cookies. */
async function issueSession(user: User): Promise<IssuedSession> {
  const accessToken = await signAccessToken(user.id);
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

  return { user: toUserDTO(user), accessToken, refreshToken };
}

export async function register(
  input: { email: string; password: string; name?: string },
): Promise<IssuedSession> {
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
  return issueSession(user);
}

export async function login(
  input: { email: string; password: string },
): Promise<IssuedSession> {
  // Deliberately identical message for unknown-email vs wrong-password.
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw unauthorized("Invalid email or password.");
  }
  const valid = await verifyPassword(user.password_hash, input.password);
  if (!valid) {
    throw unauthorized("Invalid email or password.");
  }
  return issueSession(user);
}

export interface RefreshResult extends IssuedSession {
  /** Whether a fresh refresh cookie was issued (rotation). */
  rotated: boolean;
}

/**
 * Rotate the refresh token: the presented session is revoked and a new one
 * issued. If the presented token matches a session already revoked, we treat it
 * as invalid (possible theft) → 401 + clear cookie.
 */
export async function refresh(rawToken?: string): Promise<RefreshResult> {
  if (!rawToken) throw unauthorized();

  // Look up the active session whose stored hash verifies against the token.
  // We search by candidate rows that are not expired, then verify the hash.
  const candidates = await getPrisma().session.findMany({
    where: {
      expires_at: { gt: new Date() },
      revoked_at: null,
    },
    include: { user: true },
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const c of candidates) {
    if (await verifyRefreshToken(c.refresh_token_hash, rawToken)) {
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

  const session = await issueSession(matched.user);
  return { ...session, rotated: true };
}

export async function logout(rawToken?: string): Promise<void> {
  // Best-effort revoke; always succeeds (idempotent logout).
  if (rawToken) {
    const candidates = await getPrisma().session.findMany({
      where: { revoked_at: null },
    });
    for (const c of candidates) {
      if (await verifyRefreshToken(c.refresh_token_hash, rawToken)) {
        await getPrisma().session.update({
          where: { id: c.id },
          data: { revoked_at: new Date() },
        });
        break;
      }
    }
  }
}

export async function getCurrentUser(userId: string): Promise<UserDTO> {
  const user = await findUserById(userId);
  if (!user) throw unauthorized();
  return toUserDTO(user);
}
