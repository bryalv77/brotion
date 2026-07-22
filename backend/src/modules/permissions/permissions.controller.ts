import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import { notFound } from "../../utils/errors.js";
import { createPermissionSchema } from "./permissions.schema.js";
import {
  listPermissions,
  createPermission,
  deletePermission,
  getPageByShareToken,
} from "./permissions.service.js";

/** GET /pages/:pageId/permissions */
export async function listPermissionsHandler(req: Request, res: Response): Promise<void> {
  const perms = await listPermissions(req.params.pageId, req.user!.id);
  ok(res, { permissions: perms });
}

/** POST /pages/:pageId/permissions */
export async function createPermissionHandler(req: Request, res: Response): Promise<void> {
  const input = createPermissionSchema.parse(req.body);
  const perm = await createPermission(req.params.pageId, req.user!.id, input);
  created(res, { permission: perm });
}

/** DELETE /pages/:pageId/permissions/:permissionId */
export async function deletePermissionHandler(req: Request, res: Response): Promise<void> {
  await deletePermission(req.params.pageId, req.params.permissionId, req.user!.id);
  noContent(res);
}

/** GET /shared/:token — public read-only page. */
export async function getSharedPageHandler(req: Request, res: Response): Promise<void> {
  const result = await getPageByShareToken(req.params.token);
  if (!result) throw notFound("Shared page not found or link is invalid.");
  ok(res, result);
}
