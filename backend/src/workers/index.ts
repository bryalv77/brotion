import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";
import type { Env } from "./env.js";
import { initWorkerEnv } from "./env.js";
import { runWithPrisma } from "../prisma/client.js";
import type { AppEnv } from "./types.js";
import type { Hono } from "hono";

/**
 * Cloudflare Workers entrypoint. Bindings are copied into process.env before
 * the app is dynamically imported, because config/env.ts validates them at
 * module load time. Each request gets its own Neon pool/client because Workers
 * forbid reusing I/O objects across requests.
 */
let appPromise: Promise<Hono<AppEnv>> | null = null;

export default {
  async fetch(request: Request, bindings: Env, ctx: ExecutionContext): Promise<Response> {
    process.env.WORKERS = "1";
    initWorkerEnv(bindings);

    if (!appPromise) {
      appPromise = import("./app.js").then(({ createWorkerApp }) =>
        createWorkerApp(bindings),
      );
    }
    const app = await appPromise;

    const pool = new Pool({ connectionString: bindings.DATABASE_URL });
    const prisma = new PrismaClient({ adapter: new PrismaNeon(pool) });

    const response = await runWithPrisma(prisma, () =>
      app.fetch(request, bindings, ctx),
    );

    // Close the request-scoped DB resources after the response is streamed.
    ctx.waitUntil(
      prisma
        .$disconnect()
        .catch(() => undefined)
        .finally(() => pool.end())
        .catch(() => undefined),
    );

    return response;
  },
};
