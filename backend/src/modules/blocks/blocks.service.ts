import type { Prisma, BlockType } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { toBlockDTO } from "../pages/pages.dto.js";
import { refreshPageContentText } from "../pages/pages.service.js";
import {
  computeOrder,
  gapTooSmall,
  renormalize,
  type Anchor,
} from "./order.js";
import { badRequest, notFound } from "../../utils/errors.js";

/**
 * Block business rules: creation (with computed order), update, delete
 * (cascades children), and reorder/reparent with a cycle guard.
 */

/** Resolve sibling anchors from before_id/after_id within a page+parent scope. */
async function resolveAnchors(
  pageId: string,
  parentId: string | null,
  beforeId?: string,
  afterId?: string,
): Promise<{ before: Anchor | null; after: Anchor | null }> {
  const ids = [beforeId, afterId].filter(Boolean) as string[];
  if (ids.length === 0) return { before: null, after: null };

  const rows = await getPrisma().block.findMany({
    where: { id: { in: ids }, page_id: pageId, parent_block_id: parentId },
    select: { id: true, order: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r.order] as const));

  const before =
    beforeId && byId.has(beforeId)
      ? { id: beforeId, order: byId.get(beforeId)! }
      : null;
  const after =
    afterId && byId.has(afterId)
      ? { id: afterId, order: byId.get(afterId)! }
      : null;
  return { before, after };
}

/** Create a block, computing `order` from anchors if omitted. */
export async function createBlock(
  pageId: string,
  userId: string,
  input: {
    type: string;
    content: Record<string, unknown>;
    parent_block_id?: string | null;
    order?: number;
    before_id?: string;
    after_id?: string;
  },
) {
  // Access check + load page once.
  await getAccessiblePage(pageId, userId, { minAccess: "EDITOR" });

  // Validate a parent block (if any) belongs to this page.
  let parentId: string | null = null;
  if (input.parent_block_id) {
    const parent = await getPrisma().block.findUnique({
      where: { id: input.parent_block_id },
      select: { page_id: true },
    });
    if (!parent || parent.page_id !== pageId) {
      throw badRequest("Invalid parent block.");
    }
    parentId = input.parent_block_id;
  }

  // Compute order.
  let order = input.order;
  if (order === undefined) {
    const siblings = await getPrisma().block.findMany({
      where: { page_id: pageId, parent_block_id: parentId },
      orderBy: [{ order: "asc" }],
      select: { id: true, order: true },
    });
    const { before, after } = await resolveAnchors(
      pageId,
      parentId,
      input.before_id,
      input.after_id,
    );
    try {
      order = computeOrder(before, after, siblings);
    } catch {
      throw badRequest("Invalid before/after anchors.");
    }
  }

  const block = await getPrisma().block.create({
    data: {
      page_id: pageId,
      parent_block_id: parentId,
      type: input.type as BlockType,
      content: input.content as Prisma.InputJsonValue,
      order,
      created_by: userId,
    },
  });
  await refreshPageContentText(pageId);
  return toBlockDTO(block);
}

/** List a page's blocks ordered by `order`. */
export async function listBlocks(pageId: string, userId: string) {
  await getAccessiblePage(pageId, userId);
  const blocks = await getPrisma().block.findMany({
    where: { page_id: pageId },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });
  return blocks.map(toBlockDTO);
}

/** Update a block's content/type. */
export async function updateBlock(
  blockId: string,
  userId: string,
  input: { content?: Record<string, unknown>; type?: string },
) {
  const block = await loadBlockInAccessiblePage(blockId, userId);
  const data: Prisma.BlockUpdateInput = {};
  if (input.type) data.type = input.type as BlockType;
  if (input.content) data.content = input.content as Prisma.InputJsonValue;

  const updated = await getPrisma().block.update({
    where: { id: block.id },
    data,
  });
  await refreshPageContentText(block.page_id);
  return toBlockDTO(updated);
}

/** Delete a block (cascades its children via the FK). */
export async function deleteBlock(blockId: string, userId: string): Promise<void> {
  const block = await loadBlockInAccessiblePage(blockId, userId);
  await getPrisma().block.delete({ where: { id: block.id } });
  await refreshPageContentText(block.page_id);
}

/**
 * Reorder (and optionally reparent) a block. Computes a new `order` between
 * the given anchors under `new_parent_block_id` (default: current parent).
 *
 * Cycle guard: if reparenting would make the block a descendant of itself,
 * throws 422.
 */
export async function reorderBlock(
  pageId: string,
  userId: string,
  input: {
    block_id: string;
    before_id?: string;
    after_id?: string;
    new_parent_block_id?: string | null;
  },
) {
  await getAccessiblePage(pageId, userId, { minAccess: "EDITOR" });

  const block = await getPrisma().block.findUnique({
    where: { id: input.block_id },
  });
  if (!block || block.page_id !== pageId) throw notFound("Block not found.");

  const newParentId =
    input.new_parent_block_id !== undefined
      ? input.new_parent_block_id
      : block.parent_block_id;

  // Cycle guard: new parent must not be the block itself or one of its descendants.
  if (newParentId) {
    if (newParentId === block.id) {
      throw badRequest("A block cannot be its own parent.", { code: "CYCLE" });
    }
    if (await isDescendant(block.id, newParentId)) {
      throw badRequest("Reparenting would create a cycle.", { code: "CYCLE" });
    }
    // Validate the new parent belongs to this page.
    const parent = await getPrisma().block.findUnique({
      where: { id: newParentId },
      select: { page_id: true },
    });
    if (!parent || parent.page_id !== pageId) {
      throw badRequest("Invalid new parent block.");
    }
  }

  // Compute new order among the (new) parent's children.
  const siblings = await getPrisma().block.findMany({
    where: {
      page_id: pageId,
      parent_block_id: newParentId,
      id: { not: block.id },
    },
    orderBy: [{ order: "asc" }],
    select: { id: true, order: true },
  });
  const { before, after } = await resolveAnchors(
    pageId,
    newParentId,
    input.before_id,
    input.after_id,
  );
  let newOrder: number;
  try {
    newOrder = computeOrder(before, after, siblings);
  } catch {
    throw badRequest("Invalid before/after anchors.");
  }

  // Renormalize if the chosen gap is too small (defensive).
  if (before && after && gapTooSmall(before, after)) {
    const orderedIds = siblings
      .filter((s) => s.id !== block.id)
      .map((s) => s.id);
    const norm = renormalize(orderedIds);
    await getPrisma().$transaction(async (tx) => {
      for (const [id, ord] of norm) {
        await tx.block.update({ where: { id }, data: { order: ord } });
      }
      // Place the moved block at the (now integer-spaced) midpoint.
      await tx.block.update({
        where: { id: block.id },
        data: { parent_block_id: newParentId, order: newOrder },
      });
    });
  } else {
    await getPrisma().block.update({
      where: { id: block.id },
      data: { parent_block_id: newParentId, order: newOrder },
    });
  }

  const updated = await getPrisma().block.findUnique({
    where: { id: block.id },
  });
  return toBlockDTO(updated!);
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function loadBlockInAccessiblePage(blockId: string, userId: string) {
  const block = await getPrisma().block.findUnique({
    where: { id: blockId },
    select: { id: true, page_id: true },
  });
  if (!block) throw notFound("Block not found.");
  // Reuses the page-access check (membership).
  await getAccessiblePage(block.page_id, userId, { minAccess: "EDITOR" });
  return block;
}

/**
 * Is `candidateParentId` a descendant of `blockId`? Walk up the candidate's
 * ancestor chain; if we hit `blockId`, reparenting would form a cycle.
 */
async function isDescendant(blockId: string, candidateParentId: string): Promise<boolean> {
  let current: string | null = candidateParentId;
  const guard = new Set<string>();
  while (current !== null) {
    const id: string = current;
    if (id === blockId) return true;
    if (guard.has(id)) return false; // safety against pre-existing cycle
    guard.add(id);
    const row = await getPrisma().block.findUnique({
      where: { id },
      select: { parent_block_id: true },
    });
    current = row?.parent_block_id ?? null;
  }
  return false;
}
