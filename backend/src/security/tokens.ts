import { constantTimeEqual, fromBase64Url, toBase64Url } from "./encoding.js";

/**
 * Refresh tokens: opaque 32-byte random values, URL-safe base64. Only a
 * SHA-256 digest is stored (the token already has 256 bits of entropy, so a
 * slow KDF adds nothing here). WebCrypto only — safe in Node and Workers.
 */
const encoder = new TextEncoder();

export function generateRefreshToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function digest(token: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

export async function hashRefreshToken(token: string): Promise<string> {
  return `$sha256$${toBase64Url(await digest(token))}`;
}

export async function verifyRefreshToken(
  stored: string,
  token: string,
): Promise<boolean> {
  if (!stored.startsWith("$sha256$")) return false;
  try {
    const expected = fromBase64Url(stored.slice("$sha256$".length));
    const actual = await digest(token);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}
