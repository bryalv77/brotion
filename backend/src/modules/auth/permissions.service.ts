import type { WorkspaceRole, PageAccess } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import { forbidden, notFound } from "../../utils/errors.js";

/**
 * Permission helpers shared by workspaces/pages/blocks/search/files/comments.
 *
 * Access model (composes Task 3's workspace-only model with Task 4's page-level
 * permissions):
 *
 * 1. Workspace membership → implicit EDITOR (OWNER = OWNER on all pages).
 * 2. Explicit page permissions (per-user or public-link) on this page or any
 *    ancestor with `inherit=true` → take the highest.
 * 3. Combine: the effective access is the highest of (workspace role mapping,
 *    explicit permission). No access at all → 403.
 */

/** Rank access levels for comparison (higher = more permission). */
const ACCESS_RANK: Record<PageAccess, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

/** Map a workspace role to the implicit page access it grants. */
function roleToAccess(role: WorkspaceRole): PageAccess {
  if (role === "OWNER") return "OWNER";
  return "EDITOR"; // ADMIN + MEMBER → EDITOR on pages
}

/** Resolve the user's role in a workspace, or throw 403 if not a member. */
export async function assertWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole> {
  const membership = await getPrisma().workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspaceId, user_id: userId } },
    select: { role: true },
  });
  if (!membership) throw forbidden("You are not a member of this workspace.");
  return membership.role;
}

/** Resolve a workspace by id, confirming membership. Throws 404/403. */
export async function getAccessibleWorkspace(workspaceId: string, userId: string) {
  const role = await assertWorkspaceMember(workspaceId, userId);
  const workspace = await getPrisma().workspace.findUnique({
    where: { id: workspaceId },
  });
  if (!workspace) throw notFound("Workspace not found.");
  return { workspace, role };
}

/**
 * Resolve a user's effective PageAccess to a page, composing workspace
 * membership with explicit page permissions (including inherited ones from
 * ancestors). Returns null if the user has no access at all.
 */
export async function resolveEffectiveAccess(
  pageId: string,
  userId: string,
): Promise<PageAccess | null> {
  const page = await getPrisma().page.findUnique({
    where: { id: pageId },
    include: { workspace: { include: { members: true } } },
  });
  if (!page) return null;

  // 1. Workspace membership.
  const membership = page.workspace.members.find((m) => m.user_id === userId);
  let best: PageAccess | null = membership ? roleToAccess(membership.role) : null;

  // 2. Walk up the ancestor chain collecting inherited permissions for this user.
  const ancestorIds = await collectAncestorIds(pageId);
  const perms = await getPrisma().pagePermission.findMany({
    where: {
      page_id: { in: [pageId, ...ancestorIds] },
      user_id: userId,
    },
  });
  for (const p of perms) {
    // Only inherited perms from ancestors apply; direct perms on this page
    // always apply regardless of `inherit`.
    if (p.page_id !== pageId && !p.inherit) continue;
    if (best === null || ACCESS_RANK[p.access] > ACCESS_RANK[best]) {
      best = p.access;
    }
  }

  return best;
}

/**
 * Load a page and confirm the caller has at least `minAccess` (default VIEWER).
 * Throws 404 if the page doesn't exist, 403 if insufficient access.
 */
export async function getAccessiblePage(
  pageId: string,
  userId: string,
  opts: { includeDeleted?: boolean; minAccess?: PageAccess } = {},
) {
  const minAccess = opts.minAccess ?? "VIEWER";
  const page = await getPrisma().page.findUnique({
    where: { id: pageId },
  });
  if (!page) throw notFound("Page not found.");
  if (page.is_deleted && !opts.includeDeleted) throw notFound("Page not found.");

  const access = await resolveEffectiveAccess(pageId, userId);
  if (access === null) throw forbidden("You don't have access to this page.");
  if (ACCESS_RANK[access] < ACCESS_RANK[minAccess]) {
    throw forbidden(`This action requires ${minAccess} access.`);
  }
  return { page, access };
}

/** True for OWNER (only owners can manage permissions / permanently delete). */
export function isOwner(role: WorkspaceRole): boolean {
  return role === "OWNER";
}

/** Walk up parent_id chain collecting ancestor page ids (not including self). */
async function collectAncestorIds(pageId: string): Promise<string[]> {
  const ids: string[] = [];
  const guard = new Set<string>();
  let current: string | null = pageId;
  while (current !== null) {
    const id: string = current;
    if (guard.has(id)) break;
    guard.add(id);
    const row = await getPrisma().page.findUnique({
      where: { id },
      select: { parent_id: true },
    });
    current = row?.parent_id ?? null;
    if (current) ids.push(current);
  }
  return ids;
}
