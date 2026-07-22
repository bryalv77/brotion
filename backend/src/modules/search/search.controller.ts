import type { Request, Response } from "express";
import { ok } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";
import { searchPages } from "./search.service.js";

/** GET /workspaces/:workspaceId/search?q=&limit= */
export async function searchHandler(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (!q.trim()) {
    throw badRequest("Query parameter `q` must not be empty.");
  }
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const results = await searchPages(
    req.params.workspaceId,
    req.user!.id,
    q,
    Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : 20,
  );
  ok(res, { results });
}
