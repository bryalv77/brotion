import type { Request, Response } from "express";
import { ok, created } from "../../utils/http.js";
import { createWorkspaceSchema } from "./workspaces.schema.js";
import {
  listWorkspacesForUser,
  createWorkspace,
  getWorkspace,
} from "./workspaces.service.js";

/** GET /workspaces */
export async function listWorkspacesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaces = await listWorkspacesForUser(req.user!.id);
  ok(res, { workspaces });
}

/** POST /workspaces */
export async function createWorkspaceHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const input = createWorkspaceSchema.parse(req.body);
  const workspace = await createWorkspace(req.user!.id, input);
  created(res, { workspace });
}

/** GET /workspaces/:workspaceId */
export async function getWorkspaceHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const workspace = await getWorkspace(req.params.workspaceId, req.user!.id);
  ok(res, { workspace });
}
