import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createBlockHandler,
  listBlocksHandler,
  updateBlockHandler,
  deleteBlockHandler,
  reorderBlockHandler,
} from "./blocks.controller.js";

// Routes under /pages/:pageId/blocks — mergeParams for :pageId from mount path.
export const pageBlocksRouter = Router({ mergeParams: true });
pageBlocksRouter.use(requireAuth);
pageBlocksRouter.get("/", asyncHandler(listBlocksHandler));
pageBlocksRouter.post("/", csrfGuard, asyncHandler(createBlockHandler));
pageBlocksRouter.post("/reorder", csrfGuard, asyncHandler(reorderBlockHandler));

// Routes under /blocks
export const blocksRouter = Router();
blocksRouter.use(requireAuth);
blocksRouter.patch("/:blockId", csrfGuard, asyncHandler(updateBlockHandler));
blocksRouter.delete("/:blockId", csrfGuard, asyncHandler(deleteBlockHandler));
