import type { BlockDTO, BlockType } from "@notion-clone/shared";
import * as api from "@/lib/api/blocks";
import * as local from "./local/blocks";
import { isLocalMode } from "./mode";

export type { BlockType };

/** Repository seam over blocks (guest → local store, user → API). */

export function createBlock(
  pageId: string,
  body: {
    type: BlockType;
    content: Record<string, unknown>;
    parent_block_id?: string | null;
    before_id?: string;
    after_id?: string;
  },
): Promise<BlockDTO> {
  return isLocalMode()
    ? local.createBlock(pageId, body)
    : api.createBlock(pageId, body);
}

export function updateBlock(
  blockId: string,
  body: { content?: Record<string, unknown>; type?: BlockType },
): Promise<BlockDTO> {
  return isLocalMode()
    ? local.updateBlock(blockId, body)
    : api.updateBlock(blockId, body);
}

export function deleteBlock(blockId: string): Promise<void> {
  return isLocalMode() ? local.deleteBlock(blockId) : api.deleteBlock(blockId);
}
