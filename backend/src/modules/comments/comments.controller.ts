import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import { createCommentSchema, updateCommentSchema } from "./comments.schema.js";
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
} from "./comments.service.js";

/** GET /pages/:pageId/comments */
export async function listCommentsHandler(req: Request, res: Response): Promise<void> {
  const comments = await listComments(req.params.pageId, req.user!.id);
  ok(res, { comments });
}

/** POST /pages/:pageId/comments */
export async function createCommentHandler(req: Request, res: Response): Promise<void> {
  const input = createCommentSchema.parse(req.body);
  const comment = await createComment(req.params.pageId, req.user!.id, input);
  created(res, { comment });
}

/** PATCH /comments/:commentId */
export async function updateCommentHandler(req: Request, res: Response): Promise<void> {
  const input = updateCommentSchema.parse(req.body);
  const comment = await updateComment(req.params.commentId, req.user!.id, input);
  ok(res, { comment });
}

/** DELETE /comments/:commentId */
export async function deleteCommentHandler(req: Request, res: Response): Promise<void> {
  await deleteComment(req.params.commentId, req.user!.id);
  noContent(res);
}
