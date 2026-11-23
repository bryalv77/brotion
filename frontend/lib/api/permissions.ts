import { request } from "@/lib/api/client";
import type { BlockDTO, PageDTO, PermissionDTO } from "@notion-clone/shared";

export function listPermissions(pageId: string): Promise<PermissionDTO[]> {
  return request<{ permissions: PermissionDTO[] }>(`pages/${pageId}/permissions`).then(
    (r) => r.permissions,
  );
}

/** Publish: create a read-only public link for the page. */
export function createPublicLink(pageId: string): Promise<PermissionDTO> {
  return request<{ permission: PermissionDTO }>(`pages/${pageId}/permissions`, {
    method: "POST",
    body: JSON.stringify({ share_type: "PUBLIC_LINK", access: "VIEWER" }),
  }).then((r) => r.permission);
}

export function deletePermission(pageId: string, permissionId: string): Promise<void> {
  return request<void>(`pages/${pageId}/permissions/${permissionId}`, { method: "DELETE" });
}

export function getSharedPage(token: string): Promise<{ page: PageDTO; blocks: BlockDTO[] }> {
  return request<{ page: PageDTO; blocks: BlockDTO[] }>(`shared/${token}`);
}
