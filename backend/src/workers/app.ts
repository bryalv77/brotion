import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorResponse } from "./http.js";
import type { AppEnv } from "./types.js";
import type { Env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { workspacesRoutes } from "./routes/workspaces.js";
import { workspacePagesRoutes, pagesRoutes } from "./routes/pages.js";
import { blocksRoutes, pageBlocksRoutes } from "./routes/blocks.js";
import { searchRoutes } from "./routes/search.js";
import { databasesRoutes, pageDatabasesRoutes, rowsRoutes } from "./routes/databases.js";
import { commentsRoutes, pageCommentsRoutes } from "./routes/comments.js";
import { pagePermissionsRoutes, sharedRoutes } from "./routes/permissions.js";
import { pageTemplatesRoutes, workspaceTemplatesRoutes } from "./routes/pageTemplates.js";
import { filesRoutes, attachmentsRoutes } from "./routes/files.js";
import { importRoutes } from "./routes/import.js";
import { exportRoutes } from "./routes/export.js";

export function createWorkerApp(bindings: Env): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.onError((err, c) => errorResponse(c, err));

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (
          !origin ||
          origin === "null" ||
          origin === bindings.CLIENT_ORIGIN ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return origin ?? bindings.CLIENT_ORIGIN ?? "*";
        }
        return "";
      },
      credentials: true,
      allowHeaders: [
        "Content-Type",
        "X-Requested-With",
        "Authorization",
        "X-Client-Platform",
        "X-Refresh-Token",
      ],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  app.get("/", (c) => c.json({ name: "notion-clone-backend", status: "running" }));

  const api = "/api/v1";
  app.route(`${api}/health`, healthRoutes);
  app.route(`${api}/auth`, authRoutes);
  app.route(`${api}/me`, authRoutes); // /me is inside authRoutes
  app.route(`${api}/workspaces`, workspacesRoutes);
  app.route(`${api}/workspaces/:workspaceId/pages`, workspacePagesRoutes);
  app.route(`${api}/workspaces/:workspaceId/trash`, workspacePagesRoutes);
  app.route(`${api}/workspaces/:workspaceId/search`, searchRoutes);
  app.route(`${api}/workspaces/:workspaceId/import`, importRoutes);
  app.route(`${api}/workspaces/:workspaceId/page-templates`, workspaceTemplatesRoutes);
  app.route(`${api}/page-templates`, pageTemplatesRoutes);
  app.route(`${api}/pages`, pagesRoutes);
  app.route(`${api}/pages/:pageId/blocks`, pageBlocksRoutes);
  app.route(`${api}/pages/:pageId/permissions`, pagePermissionsRoutes);
  app.route(`${api}/pages/:pageId/comments`, pageCommentsRoutes);
  app.route(`${api}/pages/:pageId/export`, exportRoutes);
  app.route(`${api}/pages/:pageId/attachments`, attachmentsRoutes);
  app.route(`${api}/pages/:pageId/databases`, pageDatabasesRoutes);
  app.route(`${api}/blocks`, blocksRoutes);
  app.route(`${api}/comments`, commentsRoutes);
  app.route(`${api}/databases`, databasesRoutes);
  app.route(`${api}/rows`, rowsRoutes);
  app.route(`${api}/shared`, sharedRoutes);
  app.route(`${api}/files`, filesRoutes);

  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404),
  );

  return app;
}
