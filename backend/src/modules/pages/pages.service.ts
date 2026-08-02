import type { Prisma } from "@prisma/client";
import type { PageSummaryDTO } from "@notion-clone/shared";
import { getPrisma } from "../../prisma/client.js";
import {
  assertWorkspaceMember,
  getAccessiblePage,
} from "../auth/permissions.service.js";
import { toPageDTO, toPageSummaryDTO } from "./pages.dto.js";
import { badRequest, notFound, unprocessableEntity } from "../../utils/errors.js";

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
      is_template: false,
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
      is_template: false,
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

/** List trashed pages in a workspace. */
export async function listTrashedPages(workspaceId: string, userId: string) {
  await assertWorkspaceMember(workspaceId, userId);
  const rows = await getPrisma().page.findMany({
    where: {
      workspace_id: workspaceId,
      is_deleted: true,
      is_template: false,
    },
    orderBy: [{ deleted_at: "desc" }],
  });
  return rows.map((r) => toPageSummaryDTO({ ...r, _childCount: 0 }));
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

  // If this page is a database row and its title changed, mirror the title into
  // the row's primary "Name" text cell (rows ARE pages — keep them in sync).
  if (input.title !== undefined && updated.database_id) {
    const nameProp = await getPrisma().property.findFirst({
      where: { database_id: updated.database_id, name: "Name", type: "text" },
      select: { id: true },
    });
    if (nameProp) {
      await getPrisma().propertyValue.upsert({
        where: {
          page_id_property_id: { page_id: pageId, property_id: nameProp.id },
        },
        update: { value: input.title as never },
        create: {
          page_id: pageId,
          property_id: nameProp.id,
          value: input.title as never,
        },
      });
    }
  }

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

/**
 * Is `candidateParentId` a descendant of `pageId`? Walks the candidate's
 * `parent_id` chain upward; if we hit `pageId`, reparenting under the
 * candidate would form a cycle. (Mirrors blocks' isDescendant.)
 */
export async function isPageDescendant(
  pageId: string,
  candidateParentId: string,
): Promise<boolean> {
  let current: string | null = candidateParentId;
  const guard = new Set<string>();
  while (current !== null) {
    const id: string = current;
    if (id === pageId) return true;
    if (guard.has(id)) return false; // safety against a pre-existing cycle
    guard.add(id);
    const row = await getPrisma().page.findUnique({
      where: { id },
      select: { parent_id: true },
    });
    current = row?.parent_id ?? null;
  }
  return false;
}

/**
 * Move (reparent) a page. `new_parent_id === null` moves it to the workspace
 * root. Children of the moved page come along for the ride automatically
 * (containment is via parent_id, so no recursive rewrite is needed).
 *
 * Guards: same workspace + not-deleted parent, no self-parent, no cycle.
 */
export async function movePage(
  pageId: string,
  userId: string,
  input: { new_parent_id: string | null },
) {
  const { page } = await getAccessiblePage(pageId, userId, {
    minAccess: "EDITOR",
  });

  const newParentId = input.new_parent_id;

  // No-op: already under this parent.
  if (newParentId === page.parent_id) {
    return toPageDTO(page);
  }

  if (newParentId !== null) {
    const parent = await getPrisma().page.findUnique({
      where: { id: newParentId },
      select: { workspace_id: true, is_deleted: true },
    });
    if (!parent) throw notFound("Parent page not found.");
    if (parent.workspace_id !== page.workspace_id) {
      throw unprocessableEntity(
        "Cannot move a page to another workspace.",
        { code: "CROSS_WORKSPACE" },
      );
    }
    if (parent.is_deleted) {
      throw unprocessableEntity("Cannot move under a deleted page.", {
        code: "PARENT_DELETED",
      });
    }
    if (newParentId === page.id) {
      throw unprocessableEntity("A page cannot be its own parent.", {
        code: "CYCLE",
      });
    }
    if (await isPageDescendant(page.id, newParentId)) {
      throw unprocessableEntity("Reparenting would create a cycle.", {
        code: "CYCLE",
      });
    }
  }

  await assertWorkspaceMember(page.workspace_id, userId);

  const updated = await getPrisma().page.update({
    where: { id: page.id },
    data: {
      parent_id: newParentId,
      last_updated_by: userId,
    },
  });
  return toPageDTO(updated);
}

/**
 * Ancestors of a page (root→leaf, excluding self). Used for breadcrumbs.
 * Walks parent_id upward with a visited-set guard against pre-existing cycles.
 */
export async function getPageAncestors(
  pageId: string,
  userId: string,
): Promise<PageSummaryDTO[]> {
  // Access check first — non-members get 403/404, never a chain.
  await getAccessiblePage(pageId, userId);

  const chain: Array<{
    id: string;
    title: string;
    icon: string | null;
    parent_id: string | null;
  }> = [];
  const guard = new Set<string>();
  let current: string | null = pageId;
  while (current !== null) {
    const id: string = current;
    if (guard.has(id)) break; // safety against a pre-existing cycle
    guard.add(id);
    const row = await getPrisma().page.findUnique({
      where: { id },
      select: { id: true, title: true, icon: true, parent_id: true, is_template: true },
    });
    if (!row) break;
    // A hidden template body page (and anything above it) must never surface in
    // breadcrumbs — stop the walk here.
    if (row.is_template) break;
    // Skip the starting page itself — breadcrumbs are ancestors only.
    if (row.id !== pageId) chain.push(row);
    current = row.parent_id;
  }
  // chain is nearest-ancestor-first; breadcrumbs read root→leaf.
  chain.reverse();
  // Build PageSummaryDTO inline: we only selected the 4 breadcrumb fields, and
  // has_children isn't surfaced in the breadcrumb UI.
  return chain.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    parent_id: p.parent_id,
    has_children: false,
  }));
}
