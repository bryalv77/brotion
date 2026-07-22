import { randomBytes } from "node:crypto";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { toPermissionDTO } from "./permissions.dto.js";

/**
 * Page-permission business rules: list, create (per-user or public link),
 * delete. Only the page OWNER (or workspace OWNER) can manage permissions.
 */

/** List all permissions on a page. Requires OWNER access. */
export async function listPermissions(pageId: string, userId: string) {
  await getAccessiblePage(pageId, userId, { minAccess: "OWNER" });
  const perms = await getPrisma().pagePermission.findMany({
    where: { page_id: pageId },
    orderBy: { created_at: "asc" },
  });
  return perms.map(toPermissionDTO);
}

/** Create a per-user permission or a public link. Requires OWNER access. */
export async function createPermission(
  pageId: string,
  userId: string,
  input: {
    user_id?: string;
    share_type: "USER" | "PUBLIC_LINK";
    access: "EDITOR" | "VIEWER";
    inherit?: boolean;
  },
) {
  await getAccessiblePage(pageId, userId, { minAccess: "OWNER" });

  const token = input.share_type === "PUBLIC_LINK" ? randomBytes(24).toString("base64url") : null;

  const perm = await getPrisma().pagePermission.create({
    data: {
      page_id: pageId,
      user_id: input.user_id ?? null,
      share_type: input.share_type,
      access: input.access,
      inherit: input.inherit ?? true,
      token,
    },
  });
  return toPermissionDTO(perm);
}

/** Delete a permission. Requires OWNER access. */
export async function deletePermission(
  pageId: string,
  permissionId: string,
  userId: string,
): Promise<void> {
  await getAccessiblePage(pageId, userId, { minAccess: "OWNER" });
  await getPrisma().pagePermission.delete({
    where: { id: permissionId, page_id: pageId },
  });
}

/**
 * Resolve a public share token → page + blocks (read-only). Used by the
 * unauthenticated `GET /shared/:token` route.
 */
export async function getPageByShareToken(token: string) {
  const perm = await getPrisma().pagePermission.findUnique({
    where: { token },
    include: { page: true },
  });
  if (!perm || perm.share_type !== "PUBLIC_LINK" || !perm.page || perm.page.is_deleted) {
    return null;
  }
  const blocks = await getPrisma().block.findMany({
    where: { page_id: perm.page.id },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });
  const { toPageDTO } = await import("../pages/pages.dto.js");
  const { toBlockDTO } = await import("../pages/pages.dto.js");
  return {
    page: toPageDTO(perm.page),
    blocks: blocks.map(toBlockDTO),
  };
}
