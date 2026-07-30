import { request } from "./client.js";
import type {
  PageDTO,
  PageSummaryDTO,
  BlockDTO,
  CreatePageRequest,
  UpdatePageRequest,
} from "@notion-clone/shared";

export function listChildPages(
  workspaceId: string,
  parentId: string | null,
): Promise<PageSummaryDTO[]> {
  const qs = parentId ? `?parent_id=${parentId}` : "";
  return request<{ pages: PageSummaryDTO[] }>(
    `workspaces/${workspaceId}/pages${qs}`,
  ).then((r) => r.pages);
}

export function getPage(pageId: string): Promise<{ page: PageDTO; blocks: BlockDTO[] }> {
  return request<{ page: PageDTO; blocks: BlockDTO[] }>(`pages/${pageId}`);
}

export function createPage(
  workspaceId: string,
  body: CreatePageRequest,
): Promise<PageDTO> {
  return request<{ page: PageDTO }>(`workspaces/${workspaceId}/pages`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.page);
}

export function updatePage(
  pageId: string,
  body: UpdatePageRequest,
): Promise<PageDTO> {
  return request<{ page: PageDTO }>(`pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((r) => r.page);
}

export function deletePage(pageId: string): Promise<void> {
  return request<void>(`pages/${pageId}`, { method: "DELETE" });
}

export function restorePage(pageId: string): Promise<PageDTO> {
  return request<{ page: PageDTO }>(`pages/${pageId}/restore`, {
    method: "POST",
    body: "{}",
  }).then((r) => r.page);
}

export function permanentDeletePage(pageId: string): Promise<void> {
  return request<void>(`pages/${pageId}?permanent=true`, { method: "DELETE" });
}

export function listTrashedPages(workspaceId: string): Promise<PageSummaryDTO[]> {
  return request<{ pages: PageSummaryDTO[] }>(
    `workspaces/${workspaceId}/trash`,
  ).then((r) => r.pages);
}
