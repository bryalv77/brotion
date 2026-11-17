/**
 * Node entrypoint. dotenv MUST run before config/env.ts is evaluated, so it is
 * imported for its side effects first.
 */
import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./http/app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { disconnectPrisma } from "./prisma/client.js";
import { diskBucket } from "./node/diskBucket.js";

const bindings = { CLIENT_ORIGIN: env.CLIENT_ORIGIN, BUCKET: diskBucket() };
const app = createApp(bindings);

const server = serve(
  { fetch: (req) => app.fetch(req, bindings), port: env.PORT },
  () => logger.info(`🚀 Backend ready at http://localhost:${env.PORT} (api: /api/v1)`),
);

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
