import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  listPagesHandler,
  createPageHandler,
  getPageHandler,
  updatePageHandler,
  deletePageHandler,
  restorePageHandler,
  duplicatePageHandler,
} from "./pages.controller.js";

// Routes nested under /workspaces/:workspaceId/pages — mergeParams lets us read
// the parent :workspaceId from the app.use() mount path.
export const workspacePagesRouter = Router({ mergeParams: true });
workspacePagesRouter.use(requireAuth);
workspacePagesRouter.get("/", asyncHandler(listPagesHandler));
workspacePagesRouter.post("/", csrfGuard, asyncHandler(createPageHandler));

// Routes under /pages
export const pagesRouter = Router();
pagesRouter.use(requireAuth);
pagesRouter.get("/:pageId", asyncHandler(getPageHandler));
pagesRouter.patch("/:pageId", csrfGuard, asyncHandler(updatePageHandler));
pagesRouter.delete("/:pageId", csrfGuard, asyncHandler(deletePageHandler));
pagesRouter.post("/:pageId/restore", csrfGuard, asyncHandler(restorePageHandler));
pagesRouter.post("/:pageId/duplicate", csrfGuard, asyncHandler(duplicatePageHandler));
