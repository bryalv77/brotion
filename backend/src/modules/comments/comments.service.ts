import type { Prisma } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { toCommentDTO } from "./comments.dto.js";
import { notFound } from "../../utils/errors.js";

/**
 * Comment business rules.
 *
 * Access:
 * - READ (list): any user with VIEWER+ access to the page.
 * - CREATE: any user with VIEWER+ access (commenting is not a content mutation).
 * - UPDATE body / DELETE: only the comment author or workspace OWNER.
 * - RESOLVE: any EDITOR+.
 */

/** List all comments on a page (with author info). Requires VIEWER+. */
export async function listComments(pageId: string, userId: string) {
  await getAccessiblePage(pageId, userId, { minAccess: "VIEWER" });
  const comments = await getPrisma().comment.findMany({
    where: { page_id: pageId },
    include: { user: true },
    orderBy: [{ resolved: "asc" }, { created_at: "asc" }],
  });
  return comments.map(toCommentDTO);
}

/** Create a comment on a block. Requires VIEWER+ access to the page. */
export async function createComment(
  pageId: string,
  userId: string,
  input: { block_id: string; body: unknown[] },
) {
  await getAccessiblePage(pageId, userId, { minAccess: "VIEWER" });

  const comment = await getPrisma().comment.create({
    data: {
      page_id: pageId,
      block_id: input.block_id,
      user_id: userId,
      body: input.body as Prisma.InputJsonValue,
    },
    include: { user: true },
  });
  return toCommentDTO(comment);
}

/**
 * Update a comment (edit body and/or resolve).
 * - Resolving: EDITOR+ on the page.
 * - Editing body: only the comment author or OWNER.
 */
export async function updateComment(
  commentId: string,
  userId: string,
  input: { body?: unknown[]; resolved?: boolean },
) {
  const comment = await loadCommentInAccessiblePage(commentId, userId);
  const data: Prisma.CommentUpdateInput = {};

  if (input.body !== undefined) {
    // Body edits are author-only (or OWNER).
    if (comment.user_id !== userId) {
      const { access } = await getAccessiblePage(comment.page_id, userId, {
        minAccess: "OWNER",
      });
      void access;
    }
    data.body = input.body as Prisma.InputJsonValue;
  }

  if (input.resolved !== undefined) {
    // Resolving requires EDITOR+ (enforced by loadCommentInAccessiblePage).
    data.resolved = input.resolved;
  }

  const updated = await getPrisma().comment.update({
    where: { id: comment.id },
    data,
    include: { user: true },
  });
  return toCommentDTO(updated);
}

/** Delete a comment. Author-only (or OWNER). */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const comment = await loadCommentInAccessiblePage(commentId, userId);

  if (comment.user_id !== userId) {
    // Not the author → must be OWNER.
    await getAccessiblePage(comment.page_id, userId, { minAccess: "OWNER" });
  }
  await getPrisma().comment.delete({ where: { id: comment.id } });
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function loadCommentInAccessiblePage(commentId: string, userId: string) {
  const comment = await getPrisma().comment.findUnique({
    where: { id: commentId },
    select: { id: true, page_id: true, user_id: true },
  });
  if (!comment) throw notFound("Comment not found.");
  await getAccessiblePage(comment.page_id, userId, { minAccess: "EDITOR" });
  return comment;
}
