import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created, noContent } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { createCommentSchema, updateCommentSchema } from "../../modules/comments/comments.schema.js";
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
} from "../../modules/comments/comments.service.js";

/** Routes mounted at `/pages/:pageId/comments`. */
export const pageCommentsRoutes = new Hono<AppEnv>();
pageCommentsRoutes.use("*", requireAuth);

pageCommentsRoutes.get("/", async (c) => {
  const comments = await listComments(c.req.param("pageId")!, c.get("user").id);
  return ok(c, { comments });
});

pageCommentsRoutes.post("/", csrfGuard, async (c) => {
  const input = createCommentSchema.parse(await c.req.json());
  const comment = await createComment(c.req.param("pageId")!, c.get("user").id, input);
  return created(c, { comment });
});

/** Routes mounted at `/comments`. */
export const commentsRoutes = new Hono<AppEnv>();
commentsRoutes.use("*", requireAuth);

commentsRoutes.patch("/:commentId", csrfGuard, async (c) => {
  const input = updateCommentSchema.parse(await c.req.json());
  const comment = await updateComment(c.req.param("commentId")!, c.get("user").id, input);
  return ok(c, { comment });
});

commentsRoutes.delete("/:commentId", csrfGuard, async (c) => {
  await deleteComment(c.req.param("commentId")!, c.get("user").id);
  return noContent(c);
});
