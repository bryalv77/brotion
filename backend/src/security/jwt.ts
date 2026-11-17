import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";

/**
 * Stateless access tokens (JWT, HS256). jose uses WebCrypto, so tokens are
 * issued and verified identically in Node and in Cloudflare Workers.
 * Existing tokens from the old `jsonwebtoken` implementation remain valid.
 */

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
}

function secretKey(): Uint8Array {
  const secret = env.JWT_ACCESS_SECRET;
  if (env.NODE_ENV === "production" && !secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is required in production (set a ≥32-char random string).",
    );
  }
  return new TextEncoder().encode(
    secret ?? "dev-only-access-secret-not-for-production-use-32chars",
  );
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(secretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  if (typeof payload.sub !== "string") {
    throw new Error("Invalid access token: missing subject");
  }
  return payload as AccessTokenPayload;
}
