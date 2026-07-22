import type { Page, Block } from "@prisma/client";
import type {
  PageDTO,
  PageSummaryDTO,
  BlockDTO,
} from "@notion-clone/shared";
import type { BlockContent } from "@notion-clone/shared";

/** Map a page + its child count to the sidebar/tree summary shape. */
export function toPageSummaryDTO(
  page: Page & { _childCount?: number },
): PageSummaryDTO {
  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    parent_id: page.parent_id,
    has_children: Boolean(page._childCount && page._childCount > 0),
  };
}

/** Full page DTO. */
export function toPageDTO(page: Page): PageDTO {
  return {
    ...toPageSummaryDTO(page),
    workspace_id: page.workspace_id,
    cover_url: page.cover_url,
    is_deleted: page.is_deleted,
    created_by: page.created_by,
    created_at: page.created_at.toISOString(),
    updated_at: page.updated_at.toISOString(),
  };
}

export function toBlockDTO(block: Block): BlockDTO {
  return {
    id: block.id,
    page_id: block.page_id,
    parent_block_id: block.parent_block_id,
    type: block.type,
    content: block.content as unknown as BlockContent,
    order: block.order,
    created_at: block.created_at.toISOString(),
    updated_at: block.updated_at.toISOString(),
  };
}
