import type { BlockDTO, CreatePageRequest, PageDTO, PageSummaryDTO } from "@notion-clone/shared";
import * as api from "@/lib/api/pages";
import * as local from "./local/pages";
import { isLocalMode } from "./mode";

/** Repository seam over pages (guest → local store, user → API). */

export function listChildPages(
  workspaceId: string,
  parentId: string | null,
): Promise<PageSummaryDTO[]> {
  return isLocalMode()
    ? local.listChildPages(workspaceId, parentId)
    : api.listChildPages(workspaceId, parentId);
}

export function getPage(
  pageId: string,
): Promise<{ page: PageDTO; blocks: BlockDTO[] }> {
  return isLocalMode() ? local.getPage(pageId) : api.getPage(pageId);
}

export function createPage(
  workspaceId: string,
  body: CreatePageRequest,
): Promise<PageDTO> {
  return isLocalMode()
    ? local.createPage(workspaceId, body)
    : api.createPage(workspaceId, body);
}

export function updatePage(
  pageId: string,
  body: { title?: string; icon?: string; cover_url?: string; parent_id?: string | null },
): Promise<PageDTO> {
  return isLocalMode()
    ? local.updatePage(pageId, body)
    : api.updatePage(pageId, body);
}

export function deletePage(pageId: string): Promise<void> {
  return isLocalMode() ? local.deletePage(pageId) : api.deletePage(pageId);
}

export function restorePage(pageId: string): Promise<PageDTO> {
  return isLocalMode() ? local.restorePage(pageId) : api.restorePage(pageId);
}

export function movePage(
  pageId: string,
  newParentId: string | null,
): Promise<PageDTO> {
  return isLocalMode()
    ? local.movePage(pageId, newParentId)
    : api.movePage(pageId, newParentId);
}

export function getPageBreadcrumbs(pageId: string): Promise<PageSummaryDTO[]> {
  return isLocalMode()
    ? local.getPageBreadcrumbs(pageId)
    : api.getPageBreadcrumbs(pageId);
}

export function permanentDeletePage(pageId: string): Promise<void> {
  return isLocalMode()
    ? local.permanentDeletePage(pageId)
    : api.permanentDeletePage(pageId);
}

export function listTrashedPages(workspaceId: string): Promise<PageSummaryDTO[]> {
  return isLocalMode()
    ? local.listTrashedPages(workspaceId)
    : api.listTrashedPages(workspaceId);
}
