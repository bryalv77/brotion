/**
 * Server entrypoint. dotenv MUST run before config/env.ts is evaluated, so we
 * import it for its side effects first. In ESM, side-effect imports run before
 * other static imports in source order — keeping dotenv at the top guarantees
 * process.env is populated before the zod schema parses it.
 */
import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { disconnectPrisma } from "./prisma/client.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Backend ready at http://localhost:${env.PORT} (api: /api/v1)`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectPrisma();
    logger.info("Process exited");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
