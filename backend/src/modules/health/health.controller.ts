import type { Request, Response } from "express";
import { ok } from "../../utils/http.js";

/**
 * GET /api/v1/health
 * Deliberately DB-free so the server boots and reports healthy even when
 * Postgres is down (see spec 001 open question / plan §6).
 */
export function health(_req: Request, res: Response): void {
  ok(res, { status: "ok" });
}
