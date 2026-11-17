import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created, noContent } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import {
  createPageSchema,
  updatePageSchema,
  movePageSchema,
} from "../../modules/pages/pages.schema.js";
import {
  listChildPages,
  listTrashedPages,
  createPage,
  getPageWithBlocks,
  updatePage,
  trashPage,
  restorePage,
  permanentDeletePage,
  duplicatePage,
  movePage,
  getPageAncestors,
} from "../../modules/pages/pages.service.js";

/** Mounted at `/workspaces/:workspaceId/pages`. */
export const workspacePagesRoutes = new Hono<AppEnv>();

workspacePagesRoutes.get("/", requireAuth, async (c) => {
  const parentId = c.req.query("parent_id") || null;
  const pages = await listChildPages(
    c.req.param("workspaceId")!,
    c.get("user").id,
    parentId,
  );
  return ok(c, { pages });
});

/** Mounted at `/workspaces/:workspaceId/trash`. */
export const workspaceTrashRoutes = new Hono<AppEnv>();

workspaceTrashRoutes.get("/", requireAuth, async (c) => {
  const pages = await listTrashedPages(
    c.req.param("workspaceId")!,
    c.get("user").id,
  );
  return ok(c, { pages });
});

workspacePagesRoutes.post("/", requireAuth, csrfGuard, async (c) => {
  const body = createPageSchema.parse(await c.req.json());
  const page = await createPage(
    c.req.param("workspaceId")!,
    c.get("user").id,
    body,
  );
  return created(c, { page });
});

/** Routes under `/pages`. */
export const pagesRoutes = new Hono<AppEnv>();

pagesRoutes.get("/:pageId", requireAuth, async (c) => {
  const result = await getPageWithBlocks(
    c.req.param("pageId")!,
    c.get("user").id,
  );
  return ok(c, result);
});

pagesRoutes.patch("/:pageId", requireAuth, csrfGuard, async (c) => {
  const body = updatePageSchema.parse(await c.req.json());
  const page = await updatePage(
    c.req.param("pageId")!,
    c.get("user").id,
    body,
  );
  return ok(c, { page });
});

pagesRoutes.delete("/:pageId", requireAuth, csrfGuard, async (c) => {
  const permanent = c.req.query("permanent") === "true";
  if (permanent) {
    await permanentDeletePage(c.req.param("pageId")!, c.get("user").id);
  } else {
    await trashPage(c.req.param("pageId")!, c.get("user").id);
  }
  return noContent(c);
});

pagesRoutes.post("/:pageId/restore", requireAuth, csrfGuard, async (c) => {
  const page = await restorePage(c.req.param("pageId")!, c.get("user").id);
  return ok(c, { page });
});

pagesRoutes.post("/:pageId/duplicate", requireAuth, csrfGuard, async (c) => {
  const page = await duplicatePage(c.req.param("pageId")!, c.get("user").id);
  return created(c, { page });
});

pagesRoutes.post("/:pageId/move", requireAuth, csrfGuard, async (c) => {
  const body = movePageSchema.parse(await c.req.json());
  const page = await movePage(
    c.req.param("pageId")!,
    c.get("user").id,
    body,
  );
  return ok(c, { page });
});

pagesRoutes.get("/:pageId/ancestors", requireAuth, async (c) => {
  const breadcrumbs = await getPageAncestors(
    c.req.param("pageId")!,
    c.get("user").id,
  );
  return ok(c, { breadcrumbs });
});
