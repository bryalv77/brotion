import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { toDatabaseDTO } from "./databases.dto.js";
import { badRequest, notFound } from "../../utils/errors.js";
import {
  collectDependencies,
  detectCycle,
  evaluateCell,
  evaluateCellCached,
  type AllValuesByName,
  type FormulaProperty,
} from "../formulas/engine.js";
import type { ComputedCell } from "@notion-clone/shared";

/**
 * Database business rules: create, get (with properties + rows), update,
 * delete, add property, add row, update cell value.
 *
 * For `formula` properties the engine in `../formulas` is consulted:
 * - on `getDatabase` we populate each row's `computed` map.
 * - on `updatePropertyValue` we re-evaluate the row's formula cells and
 *   return them in the response so the client can update optimistically.
 * - on `addProperty` with `type: "formula"` we parse the expression,
 *   collect its property references, and run a cycle check against the
 *   existing formula properties.
 */

// ── Create / read / update / delete ────────────────────────────────────────

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

/** List all databases hosted on a page (no rows, just metadata). */
export async function listPageDatabases(pageId: string, userId: string) {
  await getAccessiblePage(pageId, userId, { minAccess: "VIEWER" });
  const dbs = await getPrisma().database.findMany({
    where: { page_id: pageId },
    include: { properties: { orderBy: { order: "asc" } } },
    orderBy: { created_at: "asc" },
  });
  return dbs.map((db) => toDatabaseDTO({ ...db, rows: [] }));
}

/** Get a database with its properties + rows (with values + computed cells). */
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

  // Populate `computed` for any formula properties.
  const formulaProps = db.properties.filter((p) => p.type === "formula");
  const computed: Record<string, Record<string, ComputedCell>> = {};
  if (formulaProps.length > 0 && rows.length > 0) {
    const propMeta: FormulaProperty[] = db.properties.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));

    // For each formula property, figure out which property names it
    // references (transitively). We need an all-rows view of those
    // properties so aggregations like sum(prop("Price")) can iterate
    // over the whole sheet.
    const referencedNames = new Set<string>();
    for (const fp of formulaProps) {
      const source = readFormulaSource(fp.options);
      for (const dep of safeCollectDependencies(source)) {
        referencedNames.add(dep);
      }
    }
    const referencedProps = db.properties.filter((p) => referencedNames.has(p.name));
    const allValues = await loadAllValuesByName(referencedProps);

    const fpEngines: Array<FormulaProperty & { source: string }> = formulaProps.map(
      (p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        source: readFormulaSource(p.options),
      }),
    );

    for (const row of rows) {
      const valuesByName: Record<string, unknown> = {};
      for (const v of row.property_values) {
        const prop = db.properties.find((p) => p.id === v.property_id);
        if (prop) valuesByName[prop.name] = v.value;
      }
      const rowInput = { properties: propMeta, values: valuesByName, allValues };
      const cells: Record<string, ComputedCell> = {};
      for (const fp of fpEngines) {
        cells[fp.id] = evaluateCellCached(fp.source, rowInput, fp.id);
      }
      computed[row.id] = cells;
    }
  }

  return toDatabaseDTO({ ...db, rows, computed });
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

// ── Properties ─────────────────────────────────────────────────────────────

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

  if (input.type === "formula") {
    const source = readFormulaSource(input.options);
    // Per the spec, parse errors are reported at evaluation time, not at
    // column-creation time. The engine wraps the source in a per-cell
    // `{ error: { code: "parse", … } }`. We do still run the cycle check
    // since that's a structural property of the database schema, not a
    // per-cell failure mode.
    const deps = safeCollectDependencies(source);
    const existing = db.properties
      .filter((p) => p.type === "formula")
      .map((p) => ({
        name: p.name,
        source: readFormulaSource(p.options),
      }));
    const cycle = detectCycle(input.name, deps, existing);
    if (cycle !== null) {
      throw badRequest(
        `Formula creates a circular dependency via "${cycle}"`,
        { code: "FORMULA_CYCLE" },
      );
    }
  }

  const order = db.properties.length;
  // For `select` columns, default `options.options` to [] if not provided
  // so the cell can still render a (currently empty) dropdown.
  const storedOptions = input.type === "select"
    ? (input.options ?? { options: [] })
    : input.options;

  const prop = await getPrisma().property.create({
    data: {
      database_id: databaseId,
      name: input.name,
      type: input.type as "text" | "number" | "select" | "date" | "checkbox" | "url" | "formula",
      options: storedOptions as never,
      order,
    },
  });
  return prop;
}

/**
 * Update a property's `name` and/or `options`. For formula properties this
 * re-parses the expression, re-collects deps, and re-runs the cycle check.
 */
export async function updateProperty(
  databaseId: string,
  propertyId: string,
  userId: string,
  input: { name?: string; options?: unknown },
) {
  const prop = await getPrisma().property.findUnique({
    where: { id: propertyId },
  });
  if (!prop || prop.database_id !== databaseId) throw notFound("Property not found.");

  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  if (prop.type === "formula") {
    const newOptions = (input.options ?? prop.options) as unknown;
    const source = readFormulaSource(newOptions);
    // Parse errors are surfaced at evaluation time, not at update time.
    const deps = safeCollectDependencies(source);
    // Cycle check, excluding this property itself from the existing set.
    const siblings = await getPrisma().property.findMany({
      where: { database_id: databaseId, NOT: { id: propertyId } },
    });
    const existing = siblings
      .filter((p) => p.type === "formula")
      .map((p) => ({
        name: p.name,
        source: readFormulaSource(p.options),
      }));
    const effectiveName = input.name ?? prop.name;
    const cycle = detectCycle(effectiveName, deps, existing);
    if (cycle !== null) {
      throw badRequest(
        `Formula creates a circular dependency via "${cycle}"`,
        { code: "FORMULA_CYCLE" },
      );
    }
  }

  const updated = await getPrisma().property.update({
    where: { id: propertyId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.options !== undefined ? { options: input.options as never } : {}),
    },
  });
  return updated;
}

function readFormulaSource(options: unknown): string {
  if (
    options !== null &&
    typeof options === "object" &&
    "formula" in options &&
    typeof (options as { formula: unknown }).formula === "string"
  ) {
    return (options as { formula: string }).formula;
  }
  return "";
}

/**
 * Like `collectDependencies` but returns `[]` if the formula doesn't parse.
 * Used at write time so a bad source doesn't block column creation — the
 * engine will surface the parse error per-cell when the row is evaluated.
 */
function safeCollectDependencies(source: string): string[] {
  try {
    return collectDependencies(source);
  } catch {
    return [];
  }
}

// ── Rows + values ──────────────────────────────────────────────────────────

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

/**
 * Update a cell value (property value for a row).
 *
 * If the targeted property is `formula`, the request is rejected — formula
 * values are derived and cannot be set directly.
 *
 * Otherwise, after persisting, we re-evaluate every formula cell on this
 * row and return the result.
 */
export async function updatePropertyValue(
  rowPageId: string,
  propertyId: string,
  userId: string,
  value: unknown,
): Promise<{
  value: unknown;
  computed: Record<string, ComputedCell>;
}> {
  // Load the targeted property so we can reject writes on formula cells.
  const property = await getPrisma().property.findUnique({
    where: { id: propertyId },
    select: { id: true, database_id: true, type: true, name: true },
  });
  if (!property) throw notFound("Property not found.");

  if (property.type === "formula") {
    throw badRequest(
      "Formula values are computed; edit the formula on the property instead.",
      { code: "FORMULA_NOT_EDITABLE" },
    );
  }

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

  // Re-evaluate this row's formula cells.
  const computed = await recomputeRowFormulas(rowPageId, row.database_id);

  return { value: pv.value, computed };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute (or re-compute) every formula cell for a single row.
 * Returns a map keyed by property_id.
 */
async function recomputeRowFormulas(
  rowPageId: string,
  databaseId: string,
): Promise<Record<string, ComputedCell>> {
  const properties = await getPrisma().property.findMany({
    where: { database_id: databaseId },
    orderBy: { order: "asc" },
  });
  const formulaProps = properties.filter((p) => p.type === "formula");
  if (formulaProps.length === 0) return {};

  const values = await getPrisma().propertyValue.findMany({
    where: { page_id: rowPageId },
  });

  const valuesByName: Record<string, unknown> = {};
  for (const v of values) {
    const prop = properties.find((p) => p.id === v.property_id);
    if (prop) valuesByName[prop.name] = v.value;
  }
  const propMeta: FormulaProperty[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  // Build the all-rows view for properties referenced by any formula in
  // this database so aggregations (sum/avg/min/max/count over a column)
  // can iterate over the whole sheet.
  const referencedNames = new Set<string>();
  for (const fp of formulaProps) {
    for (const dep of safeCollectDependencies(readFormulaSource(fp.options))) {
      referencedNames.add(dep);
    }
  }
  const referencedProps = properties.filter((p) => referencedNames.has(p.name));
  const allValues = await loadAllValuesByName(referencedProps);

  const rowInput = { properties: propMeta, values: valuesByName, allValues };

  const out: Record<string, ComputedCell> = {};
  for (const fp of formulaProps) {
    const source = readFormulaSource(fp.options);
    out[fp.id] = evaluateCell(source, rowInput, fp.id);
  }
  return out;
}

/**
 * Load all values for the given properties, keyed by property NAME, as a
 * list of raw values. Includes nulls (the engine filters them out for
 * aggregations). Empty/missing properties come back as `[]`.
 */
async function loadAllValuesByName(
  properties: Array<{ id: string; name: string }>,
): Promise<AllValuesByName> {
  const out: AllValuesByName = {};
  for (const p of properties) out[p.name] = [];
  if (properties.length === 0) return out;

  const values = await getPrisma().propertyValue.findMany({
    where: { property_id: { in: properties.map((p) => p.id) } },
  });
  for (const v of values) {
    const prop = properties.find((p) => p.id === v.property_id);
    if (prop) out[prop.name].push(v.value);
  }
  return out;
}
