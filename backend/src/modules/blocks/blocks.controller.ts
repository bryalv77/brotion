import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import {
  createBlockSchema,
  updateBlockSchema,
  reorderBlockSchema,
} from "./blocks.schema.js";
import {
  createBlock,
  listBlocks,
  updateBlock,
  deleteBlock,
  reorderBlock,
} from "./blocks.service.js";

/** POST /pages/:pageId/blocks */
export async function createBlockHandler(req: Request, res: Response): Promise<void> {
  const input = createBlockSchema.parse(req.body);
  const block = await createBlock(req.params.pageId, req.user!.id, input);
  created(res, { block });
}

/** GET /pages/:pageId/blocks */
export async function listBlocksHandler(req: Request, res: Response): Promise<void> {
  const blocks = await listBlocks(req.params.pageId, req.user!.id);
  ok(res, { blocks });
}

/** PATCH /blocks/:blockId */
export async function updateBlockHandler(req: Request, res: Response): Promise<void> {
  const input = updateBlockSchema.parse(req.body);
  const block = await updateBlock(req.params.blockId, req.user!.id, input);
  ok(res, { block });
}

/** DELETE /blocks/:blockId */
export async function deleteBlockHandler(req: Request, res: Response): Promise<void> {
  await deleteBlock(req.params.blockId, req.user!.id);
  noContent(res);
}

/** POST /pages/:pageId/blocks/reorder */
export async function reorderBlockHandler(req: Request, res: Response): Promise<void> {
  const input = reorderBlockSchema.parse(req.body);
  const block = await reorderBlock(req.params.pageId, req.user!.id, input);
  ok(res, { block });
}
