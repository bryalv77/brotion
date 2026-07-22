import type { Comment, User } from "@prisma/client";
import type { CommentDTO } from "@notion-clone/shared";
import { toUserDTO } from "../users/users.dto.js";

type CommentWithUser = Comment & { user: User };

export function toCommentDTO(c: CommentWithUser): CommentDTO {
  return {
    id: c.id,
    block_id: c.block_id,
    page_id: c.page_id,
    user: toUserDTO(c.user),
    body: c.body as unknown as CommentDTO["body"],
    resolved: c.resolved,
    created_at: c.created_at.toISOString(),
    updated_at: c.updated_at.toISOString(),
  };
}
