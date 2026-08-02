import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  instantiatePageTemplateHandler,
  listPageTemplatesHandler,
} from "./page-templates.controller.js";

// GET /page-templates — static metadata, not workspace-scoped.
export const pageTemplatesRouter = Router();
pageTemplatesRouter.use(requireAuth);
pageTemplatesRouter.get("/", asyncHandler(listPageTemplatesHandler));

// Nested under /workspaces/:workspaceId/page-templates — mergeParams lets us
// read the parent :workspaceId from the app.use() mount path.
export const workspacePageTemplatesRouter = Router({ mergeParams: true });
workspacePageTemplatesRouter.use(requireAuth);
workspacePageTemplatesRouter.post(
  "/:templateId/instantiate",
  csrfGuard,
  asyncHandler(instantiatePageTemplateHandler),
);
