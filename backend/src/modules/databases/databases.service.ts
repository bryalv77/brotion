import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { toDatabaseDTO } from "./databases.dto.js";
import { notFound } from "../../utils/errors.js";

/**
 * Database business rules: create, get (with properties + rows), update,
 * delete, add property, add row, update cell value.
 */

/** Create a database on a page. */
export async function createDatabase(
  pageId: string,
  userId: string,
  input: { title?: string; icon?: string },
) {
  const { page } = await getAccessiblePage(pageId, userId, { minAccess: "EDITOR" });

  const db = await getPrisma().database.create({
    data: {
      workspace_id: page.workspace_id,
      page_id: page.id,
      title: input.title ?? "",
      icon: input.icon ?? null,
      created_by: userId,
      properties: {
        create: [{ name: "Name", type: "text", order: 0 }],
      },
    },
    include: { properties: true },
  });
  return toDatabaseDTO({ ...db, rows: [] });
}

/** Get a database with its properties + rows (with values). */
export async function getDatabase(databaseId: string, userId: string) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: {
      properties: { orderBy: { order: "asc" } },
    },
  });
  if (!db) throw notFound("Database not found.");

  // Access check via the hosting page.
  await getAccessiblePage(db.page_id, userId, { minAccess: "VIEWER" });

  // Load rows (pages with database_id) + their property values.
  const rows = await getPrisma().page.findMany({
    where: { database_id: databaseId, is_deleted: false },
    include: { property_values: true },
    orderBy: { created_at: "asc" },
  });

  return toDatabaseDTO({ ...db, rows });
}

/** Update database title/icon. */
export async function updateDatabase(
  databaseId: string,
  userId: string,
  input: { title?: string; icon?: string | null },
) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  const updated = await getPrisma().database.update({
    where: { id: databaseId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    },
    include: { properties: true },
  });
  return toDatabaseDTO({ ...updated, rows: [] });
}

/** Delete a database (cascades properties + values; rows get database_id=null). */
export async function deleteDatabase(databaseId: string, userId: string): Promise<void> {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "OWNER" });
  await getPrisma().database.delete({ where: { id: databaseId } });
}

/** Add a property (column) to a database. */
export async function addProperty(
  databaseId: string,
  userId: string,
  input: { name: string; type: string; options?: unknown },
) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: { properties: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  const order = db.properties.length;
  const prop = await getPrisma().property.create({
    data: {
      database_id: databaseId,
      name: input.name,
      type: input.type as "text" | "number" | "select" | "date" | "checkbox" | "url",
      options: input.options as never,
      order,
    },
  });
  return prop;
}

/** Add a row (creates a Page with database_id). */
export async function addRow(databaseId: string, userId: string) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true, workspace_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  const row = await getPrisma().page.create({
    data: {
      workspace_id: db.workspace_id,
      database_id: databaseId,
      title: "",
      created_by: userId,
      last_updated_by: userId,
    },
  });
  return { page_id: row.id, title: row.title };
}

/** Update a cell value (property value for a row). */
export async function updatePropertyValue(
  rowPageId: string,
  propertyId: string,
  userId: string,
  value: unknown,
) {
  // Access check via the row's database → hosting page.
  const row = await getPrisma().page.findUnique({
    where: { id: rowPageId },
    select: { database_id: true },
  });
  if (!row?.database_id) throw notFound("Row not found.");

  const db = await getPrisma().database.findUnique({
    where: { id: row.database_id },
    select: { page_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  const pv = await getPrisma().propertyValue.upsert({
    where: { page_id_property_id: { page_id: rowPageId, property_id: propertyId } },
    update: { value: value as never },
    create: {
      page_id: rowPageId,
      property_id: propertyId,
      value: value as never,
    },
  });
  return pv;
}
