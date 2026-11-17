import type { AppBindings } from "../http/types.js";

/** Bindings declared in wrangler.toml / wrangler secret put. */
export interface Env extends AppBindings {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_ACCESS_TTL?: string;
  JWT_REFRESH_TTL_DAYS?: string;
  COOKIE_SECURE?: string;
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
  for (const [key, value] of Object.entries(bindings)) {
    if (typeof value === "string") process.env[key] = value;
  }
}
