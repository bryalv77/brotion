import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttpPkg from "pino-http";
import type { HttpLogger, Options } from "pino-http";
import type { Logger } from "pino";

// pino-http ships as CJS; under NodeNext its synthetic default resolves to the
// module namespace rather than the callable factory the .d.ts describes. Pull
// the callable factory off the runtime namespace and type it explicitly.
type PinoHttpFn = (
  opts?: Options,
  stream?: NodeJS.WritableStream,
) => HttpLogger;
const pinoHttp = (pinoHttpPkg as unknown as {
  pinoHttp: PinoHttpFn;
  default: PinoHttpFn;
}).pinoHttp as (opts?: { logger: Logger } & Options) => HttpLogger;
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./utils/errors.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { meRouter } from "./modules/auth/me.routes.js";
import { workspacesRouter } from "./modules/workspaces/workspaces.routes.js";
import { workspacePagesRouter, pagesRouter } from "./modules/pages/pages.routes.js";
import { pageBlocksRouter, blocksRouter } from "./modules/blocks/blocks.routes.js";
import { searchRouter } from "./modules/search/search.routes.js";
import { filesRouter } from "./modules/files/files.routes.js";
import { pagePermissionsRouter, sharedRouter } from "./modules/permissions/permissions.routes.js";
import { pageCommentsRouter, commentsRouter } from "./modules/comments/comments.routes.js";

/**
 * Express app composition, separated from `server.ts` so it can be imported
 * in tests without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  app.get("/", (_req, res) => {
    res.json({ name: "notion-clone-backend", status: "running" });
  });

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/me", meRouter);
  app.use("/api/v1/workspaces", workspacesRouter);
  app.use("/api/v1/workspaces/:workspaceId/pages", workspacePagesRouter);
  app.use("/api/v1/workspaces/:workspaceId/search", searchRouter);
  app.use("/api/v1/pages", pagesRouter);
  app.use("/api/v1/pages/:pageId/blocks", pageBlocksRouter);
  app.use("/api/v1/pages/:pageId/permissions", pagePermissionsRouter);
  app.use("/api/v1/pages/:pageId/comments", pageCommentsRouter);
  app.use("/api/v1/blocks", blocksRouter);
  app.use("/api/v1/comments", commentsRouter);
  app.use("/api/v1/files", filesRouter);
  app.use("/api/v1/shared", sharedRouter);

  // 404 for unmatched API routes (must come before errorHandler to set the body).
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
  });

  app.use(errorHandler);

  return app;
}
