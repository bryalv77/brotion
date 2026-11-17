import type { BlockDTO, BlockType } from "@notion-clone/shared";
import { getLocalStore } from "@/lib/local/store";
import { newId } from "@/lib/local/ids";
import { badRequest, computeOrder, notFound, type Anchor } from "./util";

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
