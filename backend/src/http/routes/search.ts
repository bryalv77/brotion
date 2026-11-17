import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok } from "../http.js";
import { requireAuth } from "../middleware.js";
import { badRequest } from "../../utils/errors.js";
import { searchPages } from "../../modules/search/search.service.js";

/** Mounted at `/workspaces/:workspaceId/search`. */
export const searchRoutes = new Hono<AppEnv>();

searchRoutes.get("/", requireAuth, async (c) => {
  const q = c.req.query("q") ?? "";
  if (!q.trim()) {
    throw badRequest("Query parameter `q` must not be empty.");
  }

  const limitRaw = c.req.query("limit");
  const limit = limitRaw ? Number(limitRaw) : 20;
  const results = await searchPages(
    c.req.param("workspaceId")!,
    c.get("user").id,
    q,
    Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : 20,
  );
  return ok(c, { results });
});
