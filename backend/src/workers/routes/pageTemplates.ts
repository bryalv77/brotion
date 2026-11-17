import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import { instantiatePageTemplateSchema } from "../../modules/page-templates/page-templates.schema.js";
import {
  listPageTemplates,
  instantiatePageTemplate,
} from "../../modules/page-templates/page-templates.service.js";

/** Routes mounted at `/page-templates`. */
export const pageTemplatesRoutes = new Hono<AppEnv>();
pageTemplatesRoutes.use("*", requireAuth);

pageTemplatesRoutes.get("/", (c) => {
  return ok(c, { templates: listPageTemplates() });
});

/** Routes mounted at `/workspaces/:workspaceId/page-templates`. */
export const workspaceTemplatesRoutes = new Hono<AppEnv>();
workspaceTemplatesRoutes.use("*", requireAuth);

workspaceTemplatesRoutes.post("/:templateId/instantiate", csrfGuard, async (c) => {
  const input = instantiatePageTemplateSchema.parse(await c.req.json());
  const page = await instantiatePageTemplate(
    c.req.param("templateId")!,
    c.req.param("workspaceId")!,
    c.get("user").id,
    input,
  );
  return created(c, { page });
});
