import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { exportPageHandler } from "./export.controller.js";

// Routes under /pages/:pageId/export — mergeParams for :pageId.
export const exportRouter = Router({ mergeParams: true });
exportRouter.use(requireAuth);
exportRouter.get("/", asyncHandler(exportPageHandler));
