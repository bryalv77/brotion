import { request } from "./client.js";
import type { BlockDTO, BlockType } from "@notion-clone/shared";

export type { BlockType };

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
  return request<{ block: BlockDTO }>(`pages/${pageId}/blocks`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.block);
}

export function updateBlock(
  blockId: string,
  body: { content?: Record<string, unknown>; type?: BlockType },
): Promise<BlockDTO> {
  return request<{ block: BlockDTO }>(`blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((r) => r.block);
}

export function deleteBlock(blockId: string): Promise<void> {
  return request<void>(`blocks/${blockId}`, { method: "DELETE" });
}
