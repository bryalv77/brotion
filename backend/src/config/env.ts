import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 * Fail fast at boot if a required variable is missing or malformed — we never
 * want the server to start with half a config.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  // JWT secrets are required by later tasks; declared now so config shape is stable.
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  COOKIE_SECURE: z
    .union([z.literal("true"), z.literal("false")])
    .default("false"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:\n", parsed.error.flatten());
  throw new Error("Invalid environment configuration. See errors above.");
}

export const env = parsed.data;
export type Env = typeof env;
