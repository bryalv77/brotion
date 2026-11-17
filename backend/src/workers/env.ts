/** Bindings declared in wrangler.toml / wrangler secret put. */
export interface Env {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_ACCESS_TTL?: string;
  JWT_REFRESH_TTL_DAYS?: string;
  COOKIE_SECURE?: string;
  CLIENT_ORIGIN?: string;
  MAX_UPLOAD_BYTES?: string;
  BUCKET: R2Bucket;
}

let initialized = false;

/**
 * Wire Workers bindings into the existing modules. Services keep importing
 * `env` from config/env.ts and `getPrisma()`, so they need no changes. The
 * per-request Prisma client is created in index.ts.
 */
export function initWorkerEnv(bindings: Env): void {
  if (initialized) return;
  initialized = true;

  // Wrangler defines NODE_ENV=production at build time; don't reassign it.
  process.env.WORKERS = "1";
  process.env.DATABASE_URL = bindings.DATABASE_URL;
  if (bindings.JWT_ACCESS_SECRET) process.env.JWT_ACCESS_SECRET = bindings.JWT_ACCESS_SECRET;
  if (bindings.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = bindings.JWT_REFRESH_SECRET;
  if (bindings.JWT_ACCESS_TTL) process.env.JWT_ACCESS_TTL = bindings.JWT_ACCESS_TTL;
  if (bindings.JWT_REFRESH_TTL_DAYS) process.env.JWT_REFRESH_TTL_DAYS = bindings.JWT_REFRESH_TTL_DAYS;
  if (bindings.CLIENT_ORIGIN) process.env.CLIENT_ORIGIN = bindings.CLIENT_ORIGIN;
  if (bindings.COOKIE_SECURE) process.env.COOKIE_SECURE = bindings.COOKIE_SECURE;
  if (bindings.MAX_UPLOAD_BYTES) process.env.MAX_UPLOAD_BYTES = bindings.MAX_UPLOAD_BYTES;
}
