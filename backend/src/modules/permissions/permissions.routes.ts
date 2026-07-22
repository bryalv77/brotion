import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  listPermissionsHandler,
  createPermissionHandler,
  deletePermissionHandler,
  getSharedPageHandler,
} from "./permissions.controller.js";

// Routes under /pages/:pageId/permissions — require auth (OWNER enforced in service).
export const pagePermissionsRouter = Router({ mergeParams: true });
pagePermissionsRouter.use(requireAuth);
pagePermissionsRouter.get("/", asyncHandler(listPermissionsHandler));
pagePermissionsRouter.post("/", csrfGuard, asyncHandler(createPermissionHandler));
pagePermissionsRouter.delete("/:permissionId", csrfGuard, asyncHandler(deletePermissionHandler));

// Public share route under /shared/:token — no auth required.
export const sharedRouter = Router();
sharedRouter.get("/:token", asyncHandler(getSharedPageHandler));
