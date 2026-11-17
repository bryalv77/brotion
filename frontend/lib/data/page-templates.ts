import type { PageDTO, PageTemplateSummaryDTO } from "@notion-clone/shared";
import * as api from "@/lib/api/page-templates";
import * as local from "./local/misc";
import { isLocalMode } from "./mode";

/** Repository seam over the page-template gallery. */

export function listPageTemplates(): Promise<PageTemplateSummaryDTO[]> {
  return isLocalMode() ? local.listPageTemplates() : api.listPageTemplates();
}

export function instantiatePageTemplate(
  workspaceId: string,
  templateId: string,
  parentId: string | null,
): Promise<PageDTO> {
  return isLocalMode()
    ? local.instantiatePageTemplate()
    : api.instantiatePageTemplate(workspaceId, templateId, parentId);
}
