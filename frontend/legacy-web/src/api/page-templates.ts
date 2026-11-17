import { request } from "./client.js";
import type { PageDTO, PageTemplateSummaryDTO } from "@notion-clone/shared";

export function listPageTemplates(): Promise<PageTemplateSummaryDTO[]> {
  return request<{ templates: PageTemplateSummaryDTO[] }>("page-templates").then(
    (r) => r.templates,
  );
}

export function instantiatePageTemplate(
  workspaceId: string,
  templateId: string,
  parentId: string | null,
): Promise<PageDTO> {
  return request<{ page: PageDTO }>(
    `workspaces/${workspaceId}/page-templates/${templateId}/instantiate`,
    {
      method: "POST",
      body: JSON.stringify({ parent_id: parentId }),
    },
  ).then((r) => r.page);
}
