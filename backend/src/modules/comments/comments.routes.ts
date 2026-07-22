import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { csrfGuard } from "../../middleware/csrf.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  listCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
} from "./comments.controller.js";

// Routes under /pages/:pageId/comments — mergeParams for :pageId.
export const pageCommentsRouter = Router({ mergeParams: true });
pageCommentsRouter.use(requireAuth);
pageCommentsRouter.get("/", asyncHandler(listCommentsHandler));
pageCommentsRouter.post("/", csrfGuard, asyncHandler(createCommentHandler));

// Routes under /comments
export const commentsRouter = Router();
commentsRouter.use(requireAuth);
commentsRouter.patch("/:commentId", csrfGuard, asyncHandler(updateCommentHandler));
commentsRouter.delete("/:commentId", csrfGuard, asyncHandler(deleteCommentHandler));
