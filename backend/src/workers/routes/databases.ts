import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { ok, created, noContent } from "../http.js";
import { requireAuth, csrfGuard } from "../middleware.js";
import {
  createDatabaseSchema,
  updateDatabaseSchema,
  createPropertySchema,
  updatePropertySchema,
  updatePropertyValueSchema,
  reorderSchema,
  createViewSchema,
  updateViewSchema,
  createRowSchema,
  createTemplateSchema,
  updateTemplateSchema,
} from "../../modules/databases/databases.schema.js";
import { toDatabaseViewDTO } from "../../modules/databases/databases.dto.js";
import {
  createDatabase,
  getDatabase,
  listPageDatabases,
  updateDatabase,
  deleteDatabase,
  addProperty,
  updateProperty,
  deleteProperty,
  moveProperty,
  addRow,
  deleteRow,
  moveRow,
  updatePropertyValue,
  createView,
  updateView,
  deleteView,
  moveView,
} from "../../modules/databases/databases.service.js";
import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../modules/databases/templates.service.js";

/** Routes mounted at `/pages/:pageId/databases`. */
export const pageDatabasesRoutes = new Hono<AppEnv>();
pageDatabasesRoutes.use("*", requireAuth);

pageDatabasesRoutes.get("/", async (c) => {
  const list = await listPageDatabases(c.req.param("pageId")!, c.get("user").id);
  return ok(c, { databases: list });
});

pageDatabasesRoutes.post("/", csrfGuard, async (c) => {
  const input = createDatabaseSchema.parse(await c.req.json());
  const db = await createDatabase(c.req.param("pageId")!, c.get("user").id, input);
  return created(c, { database: db });
});

/** Routes mounted at `/databases`. */
export const databasesRoutes = new Hono<AppEnv>();
databasesRoutes.use("*", requireAuth);

databasesRoutes.get("/:databaseId", async (c) => {
  const viewId = c.req.query("view_id") || undefined;
  const db = await getDatabase(c.req.param("databaseId")!, c.get("user").id, { viewId });
  return ok(c, { database: db });
});

databasesRoutes.patch("/:databaseId", csrfGuard, async (c) => {
  const input = updateDatabaseSchema.parse(await c.req.json());
  const db = await updateDatabase(c.req.param("databaseId")!, c.get("user").id, input);
  return ok(c, { database: db });
});

databasesRoutes.delete("/:databaseId", csrfGuard, async (c) => {
  await deleteDatabase(c.req.param("databaseId")!, c.get("user").id);
  return noContent(c);
});

// ── Properties ──────────────────────────────────────────────────────────────

databasesRoutes.post("/:databaseId/properties", csrfGuard, async (c) => {
  const input = createPropertySchema.parse(await c.req.json());
  const prop = await addProperty(c.req.param("databaseId")!, c.get("user").id, input);
  return created(c, { property: prop });
});

databasesRoutes.patch("/:databaseId/properties/:propertyId", csrfGuard, async (c) => {
  const input = updatePropertySchema.parse(await c.req.json());
  const prop = await updateProperty(
    c.req.param("databaseId")!,
    c.req.param("propertyId")!,
    c.get("user").id,
    input,
  );
  return ok(c, { property: prop });
});

databasesRoutes.delete("/:databaseId/properties/:propertyId", csrfGuard, async (c) => {
  await deleteProperty(
    c.req.param("databaseId")!,
    c.req.param("propertyId")!,
    c.get("user").id,
  );
  return noContent(c);
});

databasesRoutes.post("/:databaseId/properties/:propertyId/move", csrfGuard, async (c) => {
  const input = reorderSchema.parse(await c.req.json());
  const properties = await moveProperty(
    c.req.param("databaseId")!,
    c.req.param("propertyId")!,
    c.get("user").id,
    input,
  );
  return ok(c, { properties });
});

// ── Rows ────────────────────────────────────────────────────────────────────

databasesRoutes.post("/:databaseId/rows", csrfGuard, async (c) => {
  // The Express handler used `req.body ?? {}` — all fields are optional.
  const input = createRowSchema.parse(await c.req.json().catch(() => ({})));
  const row = await addRow(c.req.param("databaseId")!, c.get("user").id, {
    templateId: input.template_id,
  });
  return created(c, { row });
});

databasesRoutes.post("/:databaseId/rows/:rowPageId/move", csrfGuard, async (c) => {
  const input = reorderSchema.parse(await c.req.json());
  await moveRow(
    c.req.param("databaseId")!,
    c.req.param("rowPageId")!,
    c.get("user").id,
    input,
  );
  return noContent(c);
});

// ── Views ───────────────────────────────────────────────────────────────────

databasesRoutes.post("/:databaseId/views", csrfGuard, async (c) => {
  const input = createViewSchema.parse(await c.req.json());
  const view = await createView(c.req.param("databaseId")!, c.get("user").id, input);
  return created(c, { view: toDatabaseViewDTO(view) });
});

databasesRoutes.patch("/:databaseId/views/:viewId", csrfGuard, async (c) => {
  const input = updateViewSchema.parse(await c.req.json());
  const view = await updateView(
    c.req.param("databaseId")!,
    c.req.param("viewId")!,
    c.get("user").id,
    input,
  );
  return ok(c, { view: toDatabaseViewDTO(view) });
});

databasesRoutes.delete("/:databaseId/views/:viewId", csrfGuard, async (c) => {
  await deleteView(c.req.param("databaseId")!, c.req.param("viewId")!, c.get("user").id);
  return noContent(c);
});

databasesRoutes.post("/:databaseId/views/:viewId/move", csrfGuard, async (c) => {
  const input = reorderSchema.parse(await c.req.json());
  await moveView(c.req.param("databaseId")!, c.req.param("viewId")!, c.get("user").id, input);
  return noContent(c);
});

// ── Templates ───────────────────────────────────────────────────────────────

databasesRoutes.get("/:databaseId/templates", async (c) => {
  const templates = await listTemplates(c.req.param("databaseId")!, c.get("user").id);
  return ok(c, { templates });
});

databasesRoutes.post("/:databaseId/templates", csrfGuard, async (c) => {
  // The Express handler used `req.body ?? {}` — all fields are optional.
  const input = createTemplateSchema.parse(await c.req.json().catch(() => ({})));
  const template = await createTemplate(c.req.param("databaseId")!, c.get("user").id, input);
  return created(c, { template });
});

databasesRoutes.get("/:databaseId/templates/:templateId", async (c) => {
  const template = await getTemplate(c.req.param("templateId")!, c.get("user").id);
  return ok(c, { template });
});

databasesRoutes.patch("/:databaseId/templates/:templateId", csrfGuard, async (c) => {
  // The Express handler used `req.body ?? {}` — all fields are optional.
  const input = updateTemplateSchema.parse(await c.req.json().catch(() => ({})));
  const template = await updateTemplate(c.req.param("templateId")!, c.get("user").id, input);
  return ok(c, { template });
});

databasesRoutes.delete("/:databaseId/templates/:templateId", csrfGuard, async (c) => {
  await deleteTemplate(c.req.param("templateId")!, c.get("user").id);
  return noContent(c);
});

/** Routes mounted at `/rows`. */
export const rowsRoutes = new Hono<AppEnv>();
rowsRoutes.use("*", requireAuth);

rowsRoutes.patch("/:rowPageId/properties/:propertyId", csrfGuard, async (c) => {
  const input = updatePropertyValueSchema.parse(await c.req.json());
  const result = await updatePropertyValue(
    c.req.param("rowPageId")!,
    c.req.param("propertyId")!,
    c.get("user").id,
    input.value,
  );
  return ok(c, { value: result.value, computed: result.computed });
});

rowsRoutes.delete("/:rowPageId", csrfGuard, async (c) => {
  await deleteRow(c.req.param("rowPageId")!, c.get("user").id);
  return noContent(c);
});
