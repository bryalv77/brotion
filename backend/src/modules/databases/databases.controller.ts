import type { Request, Response } from "express";
import { ok, created, noContent } from "../../utils/http.js";
import {
  createDatabaseSchema,
  updateDatabaseSchema,
  createPropertySchema,
  updatePropertySchema,
  updatePropertyValueSchema,
} from "./databases.schema.js";
import {
  createDatabase,
  getDatabase,
  listPageDatabases,
  updateDatabase,
  deleteDatabase,
  addProperty,
  updateProperty,
  addRow,
  updatePropertyValue,
} from "./databases.service.js";

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

/** GET /databases/:databaseId */
export async function getDatabaseHandler(req: Request, res: Response): Promise<void> {
  const db = await getDatabase(req.params.databaseId, req.user!.id);
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

/** POST /databases/:databaseId/rows */
export async function addRowHandler(req: Request, res: Response): Promise<void> {
  const row = await addRow(req.params.databaseId, req.user!.id);
  created(res, { row });
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
