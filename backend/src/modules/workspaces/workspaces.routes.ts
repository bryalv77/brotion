import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  listWorkspacesHandler,
  createWorkspaceHandler,
  getWorkspaceHandler,
} from "./workspaces.controller.js";

export const workspacesRouter = Router();

// All workspace routes require authentication.
workspacesRouter.use(requireAuth);

workspacesRouter.get("/", asyncHandler(listWorkspacesHandler));
workspacesRouter.post("/", csrfGuard, asyncHandler(createWorkspaceHandler));
workspacesRouter.get("/:workspaceId", asyncHandler(getWorkspaceHandler));
