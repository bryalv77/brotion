import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import { toDatabaseViewDTO } from "./databases.dto.js";
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
} from "./databases.schema.js";
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
} from "./databases.service.js";
import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from "./templates.service.js";

/** POST /pages/:pageId/databases */
export async function createDatabaseHandler(req: Request, res: Response): Promise<void> {
  const input = createDatabaseSchema.parse(req.body);
  const db = await createDatabase(req.params.pageId, req.user!.id, input);
  created(res, { database: db });
}

/** GET /pages/:pageId/databases */
export async function listPageDatabasesHandler(req: Request, res: Response): Promise<void> {
  const list = await listPageDatabases(req.params.pageId, req.user!.id);
  ok(res, { databases: list });
}

/** GET /databases/:databaseId?view_id= */
export async function getDatabaseHandler(req: Request, res: Response): Promise<void> {
  const viewId = req.query.view_id ? String(req.query.view_id) : undefined;
  const db = await getDatabase(req.params.databaseId, req.user!.id, { viewId });
  ok(res, { database: db });
}

/** PATCH /databases/:databaseId */
export async function updateDatabaseHandler(req: Request, res: Response): Promise<void> {
  const input = updateDatabaseSchema.parse(req.body);
  const db = await updateDatabase(req.params.databaseId, req.user!.id, input);
  ok(res, { database: db });
}

/** DELETE /databases/:databaseId */
export async function deleteDatabaseHandler(req: Request, res: Response): Promise<void> {
  await deleteDatabase(req.params.databaseId, req.user!.id);
  noContent(res);
}

/** POST /databases/:databaseId/properties */
export async function addPropertyHandler(req: Request, res: Response): Promise<void> {
  const input = createPropertySchema.parse(req.body);
  const prop = await addProperty(req.params.databaseId, req.user!.id, input);
  created(res, { property: prop });
}

/** PATCH /databases/:databaseId/properties/:propertyId */
export async function updatePropertyHandler(req: Request, res: Response): Promise<void> {
  const input = updatePropertySchema.parse(req.body);
  const prop = await updateProperty(
    req.params.databaseId,
    req.params.propertyId,
    req.user!.id,
    input,
  );
  ok(res, { property: prop });
}

/** DELETE /databases/:databaseId/properties/:propertyId */
export async function deletePropertyHandler(req: Request, res: Response): Promise<void> {
  await deleteProperty(req.params.databaseId, req.params.propertyId, req.user!.id);
  noContent(res);
}

/** POST /databases/:databaseId/properties/:propertyId/move */
export async function movePropertyHandler(req: Request, res: Response): Promise<void> {
  const input = reorderSchema.parse(req.body);
  const properties = await moveProperty(
    req.params.databaseId,
    req.params.propertyId,
    req.user!.id,
    input,
  );
  ok(res, { properties });
}

/** POST /databases/:databaseId/rows */
export async function addRowHandler(req: Request, res: Response): Promise<void> {
  const input = createRowSchema.parse(req.body ?? {});
  const row = await addRow(req.params.databaseId, req.user!.id, {
    templateId: input.template_id,
  });
  created(res, { row });
}

/** DELETE /rows/:rowPageId */
export async function deleteRowHandler(req: Request, res: Response): Promise<void> {
  await deleteRow(req.params.rowPageId, req.user!.id);
  noContent(res);
}

/** POST /databases/:databaseId/rows/:rowPageId/move */
export async function moveRowHandler(req: Request, res: Response): Promise<void> {
  const input = reorderSchema.parse(req.body);
  await moveRow(
    req.params.databaseId,
    req.params.rowPageId,
    req.user!.id,
    input,
  );
  noContent(res);
}

/** PATCH /rows/:rowPageId/properties/:propertyId */
export async function updatePropertyValueHandler(req: Request, res: Response): Promise<void> {
  const input = updatePropertyValueSchema.parse(req.body);
  const result = await updatePropertyValue(
    req.params.rowPageId,
    req.params.propertyId,
    req.user!.id,
    input.value,
  );
  ok(res, { value: result.value, computed: result.computed });
}

// ── Views ──────────────────────────────────────────────────────────────────

/** POST /databases/:databaseId/views */
export async function createViewHandler(req: Request, res: Response): Promise<void> {
  const input = createViewSchema.parse(req.body);
  const view = await createView(req.params.databaseId, req.user!.id, input);
  created(res, { view: toDatabaseViewDTO(view) });
}

/** PATCH /databases/:databaseId/views/:viewId */
export async function updateViewHandler(req: Request, res: Response): Promise<void> {
  const input = updateViewSchema.parse(req.body);
  const view = await updateView(
    req.params.databaseId,
    req.params.viewId,
    req.user!.id,
    input,
  );
  ok(res, { view: toDatabaseViewDTO(view) });
}

/** DELETE /databases/:databaseId/views/:viewId */
export async function deleteViewHandler(req: Request, res: Response): Promise<void> {
  await deleteView(req.params.databaseId, req.params.viewId, req.user!.id);
  noContent(res);
}

/** POST /databases/:databaseId/views/:viewId/move */
export async function moveViewHandler(req: Request, res: Response): Promise<void> {
  const input = reorderSchema.parse(req.body);
  await moveView(req.params.databaseId, req.params.viewId, req.user!.id, input);
  noContent(res);
}

// ── Templates ───────────────────────────────────────────────────────────────

/** POST /databases/:databaseId/templates */
export async function createTemplateHandler(req: Request, res: Response): Promise<void> {
  const input = createTemplateSchema.parse(req.body ?? {});
  const template = await createTemplate(req.params.databaseId, req.user!.id, input);
  created(res, { template });
}

/** GET /databases/:databaseId/templates */
export async function listTemplatesHandler(req: Request, res: Response): Promise<void> {
  const templates = await listTemplates(req.params.databaseId, req.user!.id);
  ok(res, { templates });
}

/** GET /databases/:databaseId/templates/:templateId */
export async function getTemplateHandler(req: Request, res: Response): Promise<void> {
  const template = await getTemplate(req.params.templateId, req.user!.id);
  ok(res, { template });
}

/** PATCH /databases/:databaseId/templates/:templateId */
export async function updateTemplateHandler(req: Request, res: Response): Promise<void> {
  const input = updateTemplateSchema.parse(req.body ?? {});
  const template = await updateTemplate(
    req.params.templateId,
    req.user!.id,
    input,
  );
  ok(res, { template });
}

/** DELETE /databases/:databaseId/templates/:templateId */
export async function deleteTemplateHandler(req: Request, res: Response): Promise<void> {
  await deleteTemplate(req.params.templateId, req.user!.id);
  noContent(res);
}
