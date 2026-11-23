import type { BlockDTO, BlockType } from "@notion-clone/shared";
import { getLocalStore } from "@/lib/local/store";
import { newId } from "@/lib/local/ids";
import { computeOrder, type Anchor } from "@notion-clone/shared";
import { badRequest, notFound } from "./util";

/** Local (guest) block operations. Mirrors lib/api/blocks.ts. */

export async function createBlock(
  pageId: string,
  body: {
    type: BlockType;
    content: Record<string, unknown>;
    parent_block_id?: string | null;
    before_id?: string;
    after_id?: string;
  },
): Promise<BlockDTO> {
  const store = getLocalStore();
  const page = await store.getPage(pageId);
  if (!page) throw notFound("Page not found.");

  let parentId: string | null = null;
  if (body.parent_block_id) {
    const parent = await store.getBlock(body.parent_block_id);
    if (!parent || parent.page_id !== pageId) {
      throw badRequest("Invalid parent block.");
    }
    parentId = body.parent_block_id;
  }

  const siblings = (await store.listBlocks(pageId)).filter(
    (b) => (b.parent_block_id ?? null) === parentId,
  );
  const byId = new Map(siblings.map((s) => [s.id, s] as const));
  const before = body.before_id && byId.has(body.before_id)
    ? ({ id: body.before_id, order: byId.get(body.before_id)!.order } satisfies Anchor)
    : null;
  const after = body.after_id && byId.has(body.after_id)
    ? ({ id: body.after_id, order: byId.get(body.after_id)!.order } satisfies Anchor)
    : null;

  let order: number;
  try {
    order = computeOrder(before, after, siblings);
  } catch {
    throw badRequest("Invalid before/after anchors.");
  }

  const now = new Date().toISOString();
  const block: BlockDTO = {
    id: newId(),
    page_id: pageId,
    parent_block_id: parentId,
    type: body.type,
    content: body.content as unknown as BlockDTO["content"],
    order,
    created_at: now,
    updated_at: now,
  };
  await store.putBlock(block);
  return block;
}

export async function updateBlock(
  blockId: string,
  body: { content?: Record<string, unknown>; type?: BlockType },
): Promise<BlockDTO> {
  const store = getLocalStore();
  const block = await store.getBlock(blockId);
  if (!block) throw notFound("Block not found.");
  const next: BlockDTO = { ...block, updated_at: new Date().toISOString() };
  if (body.type) next.type = body.type;
  if (body.content) next.content = body.content as unknown as BlockDTO["content"];
  await store.putBlock(next);
  return next;
}

export async function deleteBlock(blockId: string): Promise<void> {
  const store = getLocalStore();
  const block = await store.getBlock(blockId);
  if (!block) throw notFound("Block not found.");
  await store.deleteBlockCascade(blockId);
}

export async function reorderBlock(
  pageId: string,
  body: { block_id: string; before_id?: string; after_id?: string },
): Promise<BlockDTO> {
  const store = getLocalStore();
  const block = await store.getBlock(body.block_id);
  if (!block || block.page_id !== pageId) throw notFound("Block not found.");
  const siblings = (await store.listBlocks(pageId)).filter(
    (b) => (b.parent_block_id ?? null) === (block.parent_block_id ?? null) && b.id !== block.id,
  );
  const before = siblings.find((b) => b.id === body.before_id); // block that will follow
  const after = siblings.find((b) => b.id === body.after_id); // block that will precede
  const order =
    before && after
      ? (before.order + after.order) / 2
      : before
        ? before.order - 0.5
        : after
          ? after.order + 1
          : block.order;
  const next: BlockDTO = { ...block, order, updated_at: new Date().toISOString() };
  await store.putBlock(next);
  return next;
}
