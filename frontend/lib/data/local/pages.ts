import type {
  BlockDTO,
  CreatePageRequest,
  PageDTO,
  PageSummaryDTO,
} from "@notion-clone/shared";
import { getLocalStore, type LocalPage } from "@/lib/local/store";
import { newId } from "@/lib/local/ids";
import { badRequest, notFound, unprocessable } from "./util";

/**
 * Local (guest) page operations. Mirrors lib/api/pages.ts against the local
 * store, reproducing the server's semantics (trash/restore, subtree delete,
 * move cycle guard, breadcrumbs, database-row title sync).
 */

function toSummary(p: LocalPage, hasChildren: boolean): PageSummaryDTO {
  return {
    id: p.id,
    title: p.title,
    icon: p.icon,
    parent_id: p.parent_id ?? null,
    has_children: hasChildren,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function sortPages(pages: LocalPage[]): LocalPage[] {
  return pages.sort(
    (a, b) =>
      a.title.localeCompare(b.title) || a.created_at.localeCompare(b.created_at),
  );
}

async function requirePage(pageId: string): Promise<LocalPage> {
  const page = await getLocalStore().getPage(pageId);
  if (!page) throw notFound("Page not found.");
  return page;
}

/** Non-deleted, non-template pages of a workspace. */
async function livePages(workspaceId: string): Promise<LocalPage[]> {
  return getLocalStore().findPages(
    (p) => p.workspace_id === workspaceId && !p.is_deleted && !p.is_template,
  );
}

export async function listChildPages(
  workspaceId: string,
  parentId: string | null,
): Promise<PageSummaryDTO[]> {
  const pages = await livePages(workspaceId);
  const children = sortPages(
    pages.filter((p) => (p.parent_id ?? null) === parentId),
  );
  return children.map((c) =>
    toSummary(c, pages.some((p) => p.parent_id === c.id)),
  );
}

export async function getPage(
  pageId: string,
): Promise<{ page: PageDTO; blocks: BlockDTO[] }> {
  const page = await requirePage(pageId);
  const blocks = await getLocalStore().listBlocks(pageId);
  return { page: stripLocal(page), blocks };
}

export async function createPage(
  workspaceId: string,
  body: CreatePageRequest,
): Promise<PageDTO> {
  const store = getLocalStore();
  if (body.parent_id) {
    const parent = await store.getPage(body.parent_id);
    if (
      !parent ||
      parent.workspace_id !== workspaceId ||
      parent.is_deleted
    ) {
      throw badRequest("Invalid parent page.");
    }
  }
  const now = new Date().toISOString();
  const page: LocalPage = {
    id: newId(),
    workspace_id: workspaceId,
    parent_id: body.parent_id ?? null,
    title: body.title ?? "",
    icon: body.icon ?? null,
    has_children: false,
    cover_url: body.cover_url ?? null,
    is_deleted: false,
    created_by: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    row_order: 0,
    is_template: false,
  };
  await store.putPage(page);
  return stripLocal(page);
}

export async function updatePage(
  pageId: string,
  body: { title?: string; icon?: string | null; cover_url?: string; parent_id?: string | null },
): Promise<PageDTO> {
  const store = getLocalStore();
  const page = await requirePage(pageId);
  const next: LocalPage = { ...page, updated_at: new Date().toISOString() };
  if (body.title !== undefined) next.title = body.title;
  if (body.icon !== undefined) next.icon = body.icon;
  if (body.cover_url !== undefined) next.cover_url = body.cover_url;
  if (body.parent_id !== undefined) next.parent_id = body.parent_id;
  await store.putPage(next);

  // Rows ARE pages: mirror a title change into the primary "Name" cell.
  if (body.title !== undefined && next.database_id) {
    const db = await store.getDatabaseDef(next.database_id);
    const nameProp = db?.properties.find(
      (p) => p.name === "Name" && p.type === "text",
    );
    if (nameProp) {
      const existing = await store.getValue(pageId, nameProp.id);
      await store.putValue({
        id: existing?.id ?? newId(),
        page_id: pageId,
        property_id: nameProp.id,
        value: body.title,
      });
    }
  }

  return stripLocal(next);
}

/** Soft-delete (trash). Idempotent. */
export async function deletePage(pageId: string): Promise<void> {
  const page = await requirePage(pageId);
  await getLocalStore().putPage({
    ...page,
    is_deleted: true,
    deleted_at: new Date().toISOString(),
  });
}

export async function restorePage(pageId: string): Promise<PageDTO> {
  const page = await requirePage(pageId);
  const next = {
    ...page,
    is_deleted: false,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
  await getLocalStore().putPage(next);
  return stripLocal(next);
}

/** Permanently delete a page + its whole subtree + blocks/values/databases. */
export async function permanentDeletePage(pageId: string): Promise<void> {
  const store = getLocalStore();
  await requirePage(pageId);

  // BFS the subtree, delete leaf-first like the server (self-references
  // don't exist locally, but the order keeps parent lookups consistent).
  const ids: string[] = [];
  const queue = [pageId];
  while (queue.length) {
    const cur = queue.shift()!;
    ids.push(cur);
    const kids = await store.findPages((p) => p.parent_id === cur);
    queue.push(...kids.map((k) => k.id));
  }
  for (const id of ids.reverse()) {
    await store.deletePageHard(id);
  }
}

export async function movePage(
  pageId: string,
  newParentId: string | null,
): Promise<PageDTO> {
  const store = getLocalStore();
  const page = await requirePage(pageId);
  if (newParentId === (page.parent_id ?? null)) return stripLocal(page);

  if (newParentId !== null) {
    const parent = await store.getPage(newParentId);
    if (!parent) throw notFound("Parent page not found.");
    if (parent.workspace_id !== page.workspace_id) {
      throw unprocessable("Cannot move a page to another workspace.", "CROSS_WORKSPACE");
    }
    if (parent.is_deleted) {
      throw unprocessable("Cannot move under a deleted page.", "PARENT_DELETED");
    }
    if (newParentId === page.id) {
      throw unprocessable("A page cannot be its own parent.", "CYCLE");
    }
    // Cycle guard: walk the candidate's ancestor chain.
    let current: string | null = newParentId;
    const guard = new Set<string>();
    while (current !== null) {
      if (current === pageId) {
        throw unprocessable("Reparenting would create a cycle.", "CYCLE");
      }
      if (guard.has(current)) break;
      guard.add(current);
      const row: LocalPage | null = await store.getPage(current);
      current = row?.parent_id ?? null;
    }
  }

  const next = { ...page, parent_id: newParentId, updated_at: new Date().toISOString() };
  await store.putPage(next);
  return stripLocal(next);
}

/** Ancestor chain root→leaf (excluding self), as the server returns it. */
export async function getPageBreadcrumbs(
  pageId: string,
): Promise<PageSummaryDTO[]> {
  const store = getLocalStore();
  const chain: PageSummaryDTO[] = [];
  const guard = new Set<string>();
  let current: string | null = pageId;
  while (current !== null) {
    if (guard.has(current)) break;
    guard.add(current);
    const row = await store.getPage(current);
    if (!row || row.is_template) break;
    if (row.id !== pageId) {
      chain.push(toSummary(row, false));
    }
    current = row.parent_id ?? null;
  }
  return chain.reverse();
}

export async function listTrashedPages(
  workspaceId: string,
): Promise<PageSummaryDTO[]> {
  const pages = await getLocalStore().findPages(
    (p) => p.workspace_id === workspaceId && p.is_deleted && !p.is_template,
  );
  return pages
    .sort((a, b) => (b.deleted_at ?? "").localeCompare(a.deleted_at ?? ""))
    .map((p) => toSummary(p, false));
}

/** LocalPage → PageDTO for API-shaped returns (drop local-only columns). */
export function stripLocal(p: LocalPage): PageDTO {
  const { deleted_at: _d, row_order: _r, is_template: _t, ...dto } = p;
  return { ...dto, parent_id: p.parent_id ?? null };
}
