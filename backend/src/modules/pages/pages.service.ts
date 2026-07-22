import type { Prisma } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import {
  assertWorkspaceMember,
  getAccessiblePage,
} from "../auth/permissions.service.js";
import { toPageDTO, toPageSummaryDTO } from "./pages.dto.js";
import { badRequest, notFound } from "../../utils/errors.js";

/**
 * Page business rules: tree navigation, trash/restore, duplicate, and the
 * search-text denormalization maintenance.
 */

/** List children of a parent (or roots) in a workspace. Excludes trash. */
export async function listChildPages(
  workspaceId: string,
  userId: string,
  parentId: string | null,
) {
  await assertWorkspaceMember(workspaceId, userId);
  const rows = await getPrisma().page.findMany({
    where: {
      workspace_id: workspaceId,
      parent_id: parentId ?? null,
      is_deleted: false,
    },
    orderBy: [{ title: "asc" }, { created_at: "asc" }],
  });
  // Cheap has_children via a single count grouping.
  const childCounts = await getPrisma().page.groupBy({
    by: ["parent_id"],
    where: {
      workspace_id: workspaceId,
      parent_id: { in: rows.map((r) => r.id) },
      is_deleted: false,
    },
    _count: { _all: true },
  });
  const countMap = new Map(
    childCounts.map((c) => [c.parent_id, c._count._all] as const),
  );
  return rows.map((r) =>
    toPageSummaryDTO({ ...r, _childCount: countMap.get(r.id) ?? 0 }),
  );
}

/** Create a page under a workspace (optionally under a parent page). */
export async function createPage(
  workspaceId: string,
  userId: string,
  input: { parent_id?: string | null; title?: string; icon?: string; cover_url?: string },
) {
  await assertWorkspaceMember(workspaceId, userId);

  // If a parent is given, validate it exists in the same workspace.
  if (input.parent_id) {
    const parent = await getPrisma().page.findUnique({
      where: { id: input.parent_id },
      select: { workspace_id: true, is_deleted: true },
    });
    if (!parent || parent.workspace_id !== workspaceId || parent.is_deleted) {
      throw badRequest("Invalid parent page.");
    }
  }

  const page = await getPrisma().page.create({
    data: {
      workspace_id: workspaceId,
      parent_id: input.parent_id ?? null,
      title: input.title ?? "",
      icon: input.icon ?? null,
      cover_url: input.cover_url ?? null,
      created_by: userId,
      last_updated_by: userId,
    },
  });
  return toPageDTO(page);
}

/** Get a page + its blocks (ordered by `order`). */
export async function getPageWithBlocks(pageId: string, userId: string) {
  const { page } = await getAccessiblePage(pageId, userId);
  const blocks = await getPrisma().block.findMany({
    where: { page_id: pageId },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });
  // Lazy import to avoid a circular dep with the blocks dto helper.
  const { toBlockDTO } = await import("./pages.dto.js");
  return { page: toPageDTO(page), blocks: blocks.map(toBlockDTO) };
}

/** Partial update of page metadata. */
export async function updatePage(
  pageId: string,
  userId: string,
  input: { title?: string; icon?: string | null; cover_url?: string | null },
) {
  const { page } = await getAccessiblePage(pageId, userId, { minAccess: "EDITOR" });
  const data: Prisma.PageUpdateInput = {
    updator: { connect: { id: userId } },
  };
  if (input.title !== undefined) data.title = input.title;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.cover_url !== undefined) data.cover_url = input.cover_url;

  const updated = await getPrisma().page.update({
    where: { id: page.id },
    data,
  });
  return toPageDTO(updated);
}

/** Soft-delete (trash) a page. Idempotent. */
export async function trashPage(pageId: string, userId: string) {
  const { page } = await getAccessiblePage(pageId, userId, {
    includeDeleted: true,
    minAccess: "EDITOR",
  });
  await getPrisma().page.update({
    where: { id: page.id },
    data: { is_deleted: true, deleted_at: new Date(), deleted_by: userId },
  });
}

/** Restore a page from trash. */
export async function restorePage(pageId: string, userId: string) {
  const { page } = await getAccessiblePage(pageId, userId, {
    includeDeleted: true,
    minAccess: "EDITOR",
  });
  const restored = await getPrisma().page.update({
    where: { id: page.id },
    data: { is_deleted: false, deleted_at: null, deleted_by: null },
  });
  return toPageDTO(restored);
}

/**
 * Permanently delete a page + all descendants + their blocks. OWNER only.
 * Recurses the subtree manually (in a transaction) since the self-FK is
 * `ON DELETE NO ACTION` to avoid accidental cascade drops.
 */
export async function permanentDeletePage(pageId: string, userId: string) {
  const { page, access } = await getAccessiblePage(pageId, userId, {
    includeDeleted: true,
    minAccess: "OWNER",
  });
  void access; // minAccess: OWNER already enforces the check above.

  // Collect the whole subtree (BFS) to delete bottom-up.
  const ids = await collectSubtreeIds(page.id);
  await getPrisma().$transaction(async (tx) => {
    // Delete blocks first (cascade would also work, but be explicit + safe).
    await tx.block.deleteMany({ where: { page_id: { in: ids } } });
    // Delete pages leaf-first to satisfy the self-FK NO ACTION.
    for (const id of [...ids].reverse()) {
      await tx.page.delete({ where: { id } }).catch(() => {
        /* ignore rows already gone */
      });
    }
  });
}

/** Deep-copy a page + its blocks to a sibling. */
export async function duplicatePage(pageId: string, userId: string) {
  const { page } = await getAccessiblePage(pageId, userId, { minAccess: "EDITOR" });

  const srcBlocks = await getPrisma().block.findMany({
    where: { page_id: page.id },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });

  const copy = await getPrisma().$transaction(async (tx) => {
    const newPage = await tx.page.create({
      data: {
        workspace_id: page.workspace_id,
        parent_id: page.parent_id,
        title: page.title ? `${page.title} (copy)` : "",
        icon: page.icon,
        cover_url: page.cover_url,
        content_text: page.content_text,
        created_by: userId,
        last_updated_by: userId,
      },
    });
    // Clone blocks, remapping parent_block_id into the new tree.
    const idMap = new Map<string, string>();
    for (const b of srcBlocks) {
      const newId = idMap.get(b.id) ?? crypto.randomUUID();
      idMap.set(b.id, newId);
      const newParent = b.parent_block_id
        ? idMap.get(b.parent_block_id) ?? null
        : null;
      await tx.block.create({
        data: {
          id: newId,
          page_id: newPage.id,
          parent_block_id: newParent,
          type: b.type,
          content: b.content as Prisma.InputJsonValue,
          order: b.order,
          created_by: userId,
        },
      });
    }
    return newPage;
  });

  return toPageDTO(copy);
}

/** Recompute a page's content_text from its text-bearing blocks (for search). */
export async function refreshPageContentText(pageId: string): Promise<void> {
  const blocks = await getPrisma().block.findMany({
    where: { page_id: pageId },
    select: { content: true },
  });
  const text = blocks.map((b) => extractText(b.content)).filter(Boolean).join(" ");
  await getPrisma().page.update({
    where: { id: pageId },
    data: { content_text: text },
  });
}

/** BFS the subtree of page ids rooted at `rootId` (inclusive). */
async function collectSubtreeIds(rootId: string): Promise<string[]> {
  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const batch = queue.splice(0, queue.length);
    ids.push(...batch);
    const children = await getPrisma().page.findMany({
      where: { parent_id: { in: batch } },
      select: { id: true },
    });
    queue.push(...children.map((c) => c.id));
  }
  return ids;
}

/** Extract searchable plain text from a block's content JSON. */
export function extractText(content: unknown): string {
  if (typeof content !== "object" || content === null) return "";
  const c = content as Record<string, unknown>;
  if (typeof c.text === "string") return c.text; // code blocks
  if (Array.isArray(c.rich_text)) {
    return c.rich_text
      .map((r) =>
        typeof r === "object" && r !== null && "text" in r
          ? String((r as Record<string, unknown>).text ?? "")
          : "",
      )
      .join(" ");
  }
  return "";
}

// Guard import to avoid unused warning when not used directly in this file.
void notFound;
