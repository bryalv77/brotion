import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import { createPageSchema, updatePageSchema } from "./pages.schema.js";
import {
  listChildPages,
  createPage,
  getPageWithBlocks,
  updatePage,
  trashPage,
  restorePage,
  permanentDeletePage,
  duplicatePage,
} from "./pages.service.js";

/** GET /workspaces/:workspaceId/pages?parent_id=&include_deleted= */
export async function listPagesHandler(req: Request, res: Response): Promise<void> {
  const parentId = req.query.parent_id ? String(req.query.parent_id) : null;
  const pages = await listChildPages(
    req.params.workspaceId,
    req.user!.id,
    parentId,
  );
  ok(res, { pages });
}

/** POST /workspaces/:workspaceId/pages */
export async function createPageHandler(req: Request, res: Response): Promise<void> {
  const input = createPageSchema.parse(req.body);
  const page = await createPage(req.params.workspaceId, req.user!.id, input);
  created(res, { page });
}

/** GET /pages/:pageId */
export async function getPageHandler(req: Request, res: Response): Promise<void> {
  const result = await getPageWithBlocks(req.params.pageId, req.user!.id);
  ok(res, result);
}

/** PATCH /pages/:pageId */
export async function updatePageHandler(req: Request, res: Response): Promise<void> {
  const input = updatePageSchema.parse(req.body);
  const page = await updatePage(req.params.pageId, req.user!.id, input);
  ok(res, { page });
}

/** DELETE /pages/:pageId?permanent=false|true */
export async function deletePageHandler(req: Request, res: Response): Promise<void> {
  const permanent = String(req.query.permanent ?? "false") === "true";
  if (permanent) {
    await permanentDeletePage(req.params.pageId, req.user!.id);
  } else {
    await trashPage(req.params.pageId, req.user!.id);
  }
  noContent(res);
}

/** POST /pages/:pageId/restore */
export async function restorePageHandler(req: Request, res: Response): Promise<void> {
  const page = await restorePage(req.params.pageId, req.user!.id);
  ok(res, { page });
}

/** POST /pages/:pageId/duplicate */
export async function duplicatePageHandler(req: Request, res: Response): Promise<void> {
  const page = await duplicatePage(req.params.pageId, req.user!.id);
  created(res, { page });
}
