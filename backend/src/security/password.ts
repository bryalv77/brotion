import { constantTimeEqual, fromBase64Url, toBase64Url } from "./encoding.js";

/**
 * Password hashing with PBKDF2-SHA256 via WebCrypto — pure platform crypto, no
 * native module and no runtime WebAssembly (which Cloudflare Workers forbids).
 * Hash format: `$pbkdf2$<iterations>$<saltB64>$<hashB64>`.
 */
const ITERATIONS = 100_000;
const encoder = new TextEncoder();

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(plain, salt, ITERATIONS);
  return `$pbkdf2$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(stored: string, plain: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[1] !== "pbkdf2") return false;
  const iterations = Number(parts[2]);
  if (!Number.isSafeInteger(iterations) || iterations <= 0) return false;
  try {
    const salt = fromBase64Url(parts[3]);
    const expected = fromBase64Url(parts[4]);
    const actual = await derive(plain, salt, iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}
