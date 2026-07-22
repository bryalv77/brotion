import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { searchHandler } from "./search.controller.js";

// Mounted at /workspaces/:workspaceId/search — mergeParams for :workspaceId.
export const searchRouter = Router({ mergeParams: true });

// Mounted at /workspaces/:workspaceId/search by app.ts.
searchRouter.use(requireAuth);
searchRouter.get("/", asyncHandler(searchHandler));
