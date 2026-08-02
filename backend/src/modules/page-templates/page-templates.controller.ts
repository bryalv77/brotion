import type { Request, Response } from "express";
import { ok, created } from "../../utils/http.js";
import { instantiatePageTemplateSchema } from "./page-templates.schema.js";
import { instantiatePageTemplate, listPageTemplates } from "./page-templates.service.js";

/** GET /page-templates */
export function listPageTemplatesHandler(_req: Request, res: Response): void {
  ok(res, { templates: listPageTemplates() });
}

/** POST /workspaces/:workspaceId/page-templates/:templateId/instantiate */
export async function instantiatePageTemplateHandler(req: Request, res: Response): Promise<void> {
  const input = instantiatePageTemplateSchema.parse(req.body);
  const page = await instantiatePageTemplate(
    req.params.templateId,
    req.params.workspaceId,
    req.user!.id,
    input,
  );
  created(res, { page });
}
