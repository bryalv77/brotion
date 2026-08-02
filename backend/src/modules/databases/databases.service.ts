import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { applyViewConfig, type ViewRow } from "./applyViewConfig.js";
import { toDatabaseDTO } from "./databases.dto.js";
import { badRequest, notFound } from "../../utils/errors.js";
import {
  cloneBlocks,
  resolveTemplateForNewRow,
} from "./templates.service.js";
import {
  collectDependencies,
  detectCycle,
  evaluateCell,
  evaluateCellCached,
  type AllValuesByName,
  type FormulaProperty,
} from "../formulas/engine.js";
import type { ComputedCell, ViewConfig } from "@notion-clone/shared";

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
      views: {
        // Every database starts with one default Table view.
        create: [{ name: "Table", type: "table", config: {}, order: 0 }],
      },
    },
    include: {
      properties: true,
      views: { orderBy: { order: "asc" } },
      templates: { orderBy: [{ is_default: "desc" }, { created_at: "asc" }] },
    },
  });
  return toDatabaseDTO({ ...db, rows: [] });
}

/** List all databases hosted on a page (no rows, just metadata). */
export async function listPageDatabases(pageId: string, userId: string) {
  await getAccessiblePage(pageId, userId, { minAccess: "VIEWER" });
  const dbs = await getPrisma().database.findMany({
    where: { page_id: pageId },
    include: {
      properties: { orderBy: { order: "asc" } },
      views: { orderBy: { order: "asc" } },
    },
    orderBy: { created_at: "asc" },
  });
  return dbs.map((db) => toDatabaseDTO({ ...db, rows: [] }));
}

/** Get a database with its properties + rows (with values + computed cells). */
export async function getDatabase(
  databaseId: string,
  userId: string,
  opts: { viewId?: string } = {},
) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: {
      properties: { orderBy: { order: "asc" } },
      views: { orderBy: { order: "asc" } },
      templates: { orderBy: [{ is_default: "desc" }, { created_at: "asc" }] },
    },
  });
  if (!db) throw notFound("Database not found.");

  // Access check via the hosting page.
  await getAccessiblePage(db.page_id, userId, { minAccess: "VIEWER" });

  // Load rows (pages with database_id) + their property values. We also select
  // the page timestamps/owners so system-type properties can be derived.
  const rows = await getPrisma().page.findMany({
    where: { database_id: databaseId, is_deleted: false },
    include: { property_values: true },
    orderBy: [{ row_order: "asc" }, { created_at: "asc" }],
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

  // Inject derived values for system-type properties (created_time/by,
  // last_edited_time/by). These are read straight off the row page — no
  // PropertyValue rows are stored for them.
  const systemProps = db.properties.filter((p) =>
    p.type === "created_time" ||
    p.type === "created_by" ||
    p.type === "last_edited_time" ||
    p.type === "last_edited_by",
  );
  if (systemProps.length > 0) {
    for (const row of rows) {
      for (const sp of systemProps) {
        let derived: unknown = null;
        if (sp.type === "created_time") derived = row.created_at.toISOString();
        else if (sp.type === "last_edited_time") derived = row.updated_at.toISOString();
        else if (sp.type === "created_by") derived = row.created_by;
        else if (sp.type === "last_edited_by") derived = row.last_updated_by;
        // Only inject if no stored value exists.
        const has = row.property_values.some((v) => v.property_id === sp.id);
        if (!has) {
          row.property_values.push({
            id: `system-${sp.id}`,
            page_id: row.id,
            property_id: sp.id,
            value: derived as never,
            created_at: row.created_at,
            updated_at: row.updated_at,
          } as never);
        }
      }
    }
  }

  // Compute rollup cells (aggregate a target property through a relation) and
  // resolve relation cells to [{ page_id, title }] summaries for display.
  const rollupProps = db.properties.filter((p) => p.type === "rollup");
  const relationProps = db.properties.filter((p) => p.type === "relation");
  if ((rollupProps.length > 0 || relationProps.length > 0) && rows.length > 0) {
    // Cache: relation property id → set of target page_ids per source row.
    const relationTargets = new Map<string, string[]>();
    for (const rp of relationProps) {
      for (const row of rows) {
        const cell = row.property_values.find((v) => v.property_id === rp.id);
        const ids = Array.isArray(cell?.value)
          ? (cell!.value as unknown[]).filter((v): v is string => typeof v === "string")
          : [];
        relationTargets.set(`${row.id}:${rp.id}`, ids);
      }
    }

    // Rollups: for each row × rollup property, gather related rows' target
    // property values and aggregate.
    for (const rp of rollupProps) {
      const cfg = (rp.rollup_config ?? null) as {
        relation_property_id: string;
        target_property_id: string;
        aggregation: string;
      } | null;
      if (!cfg) continue;
      for (const row of rows) {
        const targetRowIds = relationTargets.get(`${row.id}:${cfg.relation_property_id}`) ?? [];
        const targetValues: unknown[] = [];
        if (targetRowIds.length > 0) {
          const vals = await getPrisma().propertyValue.findMany({
            where: {
              property_id: cfg.target_property_id,
              page_id: { in: targetRowIds },
            },
            select: { value: true },
          });
          for (const v of vals) targetValues.push(v.value);
        }
        computed[row.id] = computed[row.id] ?? {};
        computed[row.id][rp.id] = aggregate(cfg.aggregation, targetValues);
      }
    }

    // Resolve relation cells to summaries (titles) for display. The raw id
    // arrays remain authoritative; the summary is a convenience for the UI.
    for (const rp of relationProps) {
      for (const row of rows) {
        const cell = row.property_values.find((v) => v.property_id === rp.id);
        const ids = Array.isArray(cell?.value)
          ? (cell!.value as unknown[]).filter((v): v is string => typeof v === "string")
          : [];
        if (ids.length === 0) continue;
        const targets = await getPrisma().page.findMany({
          where: { id: { in: ids } },
          select: { id: true, title: true },
        });
        // Stash the resolved summary in computed so the UI can render chips.
        computed[row.id] = computed[row.id] ?? {};
        computed[row.id][rp.id] = {
          status: "ok",
          value: targets.map((t) => ({ page_id: t.id, title: t.title })),
        };
      }
    }
  }

  // If a view_id is given, filter + sort rows per that view's config.
  let viewRows = rows;
  if (opts.viewId) {
    const view = db.views.find((v) => v.id === opts.viewId) ?? null;
    const config = view
      ? ((view.config ?? {}) as unknown as ViewConfig)
      : null;
    if (config && (config.filters?.length || config.sorts?.length)) {
      const viewRowInput: ViewRow[] = rows.map((r) => {
        const valuesByName: Record<string, unknown> = {};
        for (const v of r.property_values) {
          const prop = db.properties.find((p) => p.id === v.property_id);
          if (prop) valuesByName[prop.name] = v.value;
        }
        const computedByName: Record<string, unknown> = {};
        for (const [propId, cell] of Object.entries(computed[r.id] ?? {})) {
          const prop = db.properties.find((p) => p.id === propId);
          if (prop) computedByName[prop.name] = cell;
        }
        return { page_id: r.id, valuesByName, computedByName };
      });
      const ordered = applyViewConfig(
        viewRowInput,
        db.properties.map((p) => ({ name: p.name, type: p.type })),
        config,
      );
      const order = new Map(ordered.map((r, i) => [r.page_id, i] as const));
      viewRows = rows
        .filter((r) => order.has(r.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }
  }

  return toDatabaseDTO({ ...db, rows: viewRows, computed });
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
    include: {
      properties: true,
      views: { orderBy: { order: "asc" } },
      templates: { orderBy: [{ is_default: "desc" }, { created_at: "asc" }] },
    },
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

// ── Views ──────────────────────────────────────────────────────────────────

/** Resolve a database + enforce EDITOR access; returns the db row. */
async function loadDbForEdit(databaseId: string, userId: string) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: { views: { orderBy: { order: "asc" } } },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });
  return db;
}

/** Create a view on a database. Defaults to a Table view named "Table". */
export async function createView(
  databaseId: string,
  userId: string,
  input: { name?: string; type?: string; config?: unknown },
) {
  const db = await loadDbForEdit(databaseId, userId);
  const order = db.views.length;
  const view = await getPrisma().databaseView.create({
    data: {
      database_id: databaseId,
      name: input.name ?? "Table",
      type: (input.type ?? "table") as "table" | "list" | "board" | "gallery",
      config: (input.config ?? {}) as never,
      order,
    },
  });
  return view;
}

/** Update a view's name/type/config. */
export async function updateView(
  databaseId: string,
  viewId: string,
  userId: string,
  input: { name?: string; type?: string; config?: unknown },
) {
  const db = await loadDbForEdit(databaseId, userId);
  const view = db.views.find((v) => v.id === viewId);
  if (!view) throw notFound("View not found.");
  const updated = await getPrisma().databaseView.update({
    where: { id: viewId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined
        ? { type: input.type as "table" | "list" | "board" | "gallery" }
        : {}),
      ...(input.config !== undefined ? { config: input.config as never } : {}),
    },
  });
  return updated;
}

/** Delete a view. Rejects if it's the last view — a database keeps ≥1 view. */
export async function deleteView(
  databaseId: string,
  viewId: string,
  userId: string,
): Promise<void> {
  const db = await loadDbForEdit(databaseId, userId);
  if (db.views.length <= 1) {
    throw badRequest("A database must keep at least one view.", {
      code: "LAST_VIEW",
    });
  }
  const view = db.views.find((v) => v.id === viewId);
  if (!view) throw notFound("View not found.");
  await getPrisma().databaseView.delete({ where: { id: viewId } });
}

/** Reorder a view tab via before_id/after_id; re-packs order 1..n. */
export async function moveView(
  databaseId: string,
  viewId: string,
  userId: string,
  input: { before_id?: string; after_id?: string },
) {
  const db = await loadDbForEdit(databaseId, userId);
  const moved = db.views.find((v) => v.id === viewId);
  if (!moved) throw notFound("View not found.");
  const siblings = db.views.filter((v) => v.id !== viewId);

  let insertAt = siblings.length;
  if (input.before_id) {
    const i = siblings.findIndex((v) => v.id === input.before_id);
    if (i === -1) throw badRequest("Invalid before_id anchor.");
    insertAt = i;
  } else if (input.after_id) {
    const i = siblings.findIndex((v) => v.id === input.after_id);
    if (i === -1) throw badRequest("Invalid after_id anchor.");
    insertAt = i + 1;
  }
  siblings.splice(insertAt, 0, moved);

  await getPrisma().$transaction(
    siblings.map((v, i) =>
      getPrisma().databaseView.update({
        where: { id: v.id },
        data: { order: i + 1 },
      }),
    ),
  );
}

/**
 * Delete a property (column). Cascades its values via the FK. Rejects if it's
 * the last property — a database always keeps at least one column.
 */
export async function deleteProperty(
  databaseId: string,
  propertyId: string,
  userId: string,
): Promise<void> {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: { properties: { orderBy: { order: "asc" } } },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  if (db.properties.length <= 1) {
    throw badRequest("A database must keep at least one property.", {
      code: "LAST_PROPERTY",
    });
  }
  await getPrisma().property.delete({ where: { id: propertyId } });
}

/**
 * Reorder a property (column) relative to siblings via before_id/after_id
 * anchors. Re-packs all siblings to evenly-spaced integer orders (1, 2, 3, …)
 * so column order stays robust. Returns the full reordered property set.
 */
export async function moveProperty(
  databaseId: string,
  propertyId: string,
  userId: string,
  input: { before_id?: string; after_id?: string },
) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: { properties: { orderBy: { order: "asc" } } },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  const siblings = db.properties.filter((p) => p.id !== propertyId);
  const moved = db.properties.find((p) => p.id === propertyId);
  if (!moved) throw notFound("Property not found.");

  // Resolve anchor indices.
  let insertAt = siblings.length; // default: end
  if (input.before_id) {
    const i = siblings.findIndex((p) => p.id === input.before_id);
    if (i === -1) throw badRequest("Invalid before_id anchor.");
    insertAt = i;
  } else if (input.after_id) {
    const i = siblings.findIndex((p) => p.id === input.after_id);
    if (i === -1) throw badRequest("Invalid after_id anchor.");
    insertAt = i + 1;
  }

  siblings.splice(insertAt, 0, moved);

  // Re-pack to 1..n.
  await getPrisma().$transaction(
    siblings.map((p, i) =>
      getPrisma().property.update({
        where: { id: p.id },
        data: { order: i + 1 },
      }),
    ),
  );

  return siblings.map((p) => ({ ...p, order: siblings.indexOf(p) + 1 }));
}

// ── Properties ─────────────────────────────────────────────────────────────

/**
 * Normalize select/multi_select/status options into the structured
 * `{ options: [{ value, color? }] }` shape, tolerating the legacy `string[]`.
 */
function normalizeSelectOptions(
  type: string,
  options: unknown,
): unknown {
  if (type !== "select" && type !== "multi_select" && type !== "status") {
    return options;
  }
  if (
    options &&
    typeof options === "object" &&
    "options" in options &&
    Array.isArray((options as { options: unknown[] }).options)
  ) {
    const arr = (options as { options: unknown[] }).options.map((o) =>
      typeof o === "string" ? { value: o } : (o as { value: string; color?: string }),
    );
    return { options: arr };
  }
  return { options: [] };
}

/** Add a property (column) to a database. */
export async function addProperty(
  databaseId: string,
  userId: string,
  input: {
    name: string;
    type: string;
    options?: unknown;
    relation_database_id?: string;
    rollup_config?: {
      relation_property_id: string;
      target_property_id: string;
      aggregation: string;
    };
  },
) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    include: { properties: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  if (input.type === "formula") {
    const source = readFormulaSource(input.options);
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

  // Relation: validate the target db is in the same workspace.
  let relationDatabaseId: string | null = null;
  if (input.type === "relation") {
    if (!input.relation_database_id) {
      throw badRequest("Relation properties require relation_database_id.", {
        code: "RELATION_TARGET_REQUIRED",
      });
    }
    const target = await getPrisma().database.findUnique({
      where: { id: input.relation_database_id },
      select: { workspace_id: true },
    });
    if (!target || target.workspace_id !== db.workspace_id) {
      throw badRequest("Relation target must be a database in the same workspace.", {
        code: "RELATION_TARGET_INVALID",
      });
    }
    relationDatabaseId = input.relation_database_id;
  }

  // Rollup: validate the referenced relation + target property exist on this db.
  let rollupConfig: unknown = null;
  if (input.type === "rollup") {
    if (!input.rollup_config) {
      throw badRequest("Rollup properties require rollup_config.", {
        code: "ROLLUP_CONFIG_REQUIRED",
      });
    }
    rollupConfig = input.rollup_config;
  }

  const order = db.properties.length;
  const storedOptions = normalizeSelectOptions(input.type, input.options);

  const prop = await getPrisma().property.create({
    data: {
      database_id: databaseId,
      name: input.name,
      type: input.type as never,
      options: storedOptions as never,
      relation_database_id: relationDatabaseId,
      rollup_config: rollupConfig as never,
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

/**
 * Add a row (creates a Page with database_id). If a template applies — either
 * an explicit `templateId` or, when none is given, the database's default
 * template — the template's block body is deep-copied onto the new row and its
 * `default_values` are seeded. With no template, the row is empty (legacy
 * behavior). The new row is independent of the template from creation on.
 */
export async function addRow(
  databaseId: string,
  userId: string,
  opts: { templateId?: string | null } = {},
) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true, workspace_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  // Resolve the template (explicit id, else the db's default, else none).
  const template = await resolveTemplateForNewRow(databaseId, opts.templateId ?? null);

  // row_order = current max + 1 so new rows append to the end.
  const last = await getPrisma().page.findFirst({
    where: { database_id: databaseId, is_deleted: false },
    orderBy: { row_order: "desc" },
    select: { row_order: true },
  });
  const rowOrder = (last?.row_order ?? 0) + 1.0;

  const row = await getPrisma().$transaction(async (tx) => {
    // Resolve an initial title: the "Name" default (if any) drives the row's
    // title, matching the title↔Name sync in updatePropertyValue.
    let title = "";
    const defaults: Record<string, unknown> =
      template && template.default_values && typeof template.default_values === "object"
        ? (template.default_values as Record<string, unknown>)
        : {};
    if (Object.keys(defaults).length > 0) {
      const nameProp = await tx.property.findFirst({
        where: { database_id: databaseId, name: "Name", type: "text" },
        select: { id: true },
      });
      if (nameProp && nameProp.id in defaults) {
        const v = defaults[nameProp.id];
        title = typeof v === "string" ? v : "";
      }
    }

    const newPage = await tx.page.create({
      data: {
        workspace_id: db.workspace_id,
        database_id: databaseId,
        title,
        row_order: rowOrder,
        created_by: userId,
        last_updated_by: userId,
      },
    });

    // Deep-copy the template's block body onto the new row.
    if (template) {
      await cloneBlocks(tx, template.page_id, newPage.id, userId);
    }

    // Seed default property values (upsert keyed on page_id + property_id).
    if (Object.keys(defaults).length > 0) {
      for (const [propId, value] of Object.entries(defaults)) {
        await tx.propertyValue.upsert({
          where: {
            page_id_property_id: { page_id: newPage.id, property_id: propId },
          },
          update: { value: value as never },
          create: {
            page_id: newPage.id,
            property_id: propId,
            value: value as never,
          },
        });
      }
    }

    return newPage;
  });
  return { page_id: row.id, title: row.title };
}

/**
 * Delete a row. Soft-deletes the backing page (is_deleted=true); getDatabase
 * already filters deleted rows. To hard-delete, a user removes the page from
 * trash later.
 */
export async function deleteRow(rowPageId: string, userId: string): Promise<void> {
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

  await getPrisma().page.update({
    where: { id: rowPageId },
    data: { is_deleted: true, deleted_at: new Date(), deleted_by: userId },
  });
}

/**
 * Reorder a row via before_id/after_id anchors. Re-packs all rows to evenly-
 * spaced integer orders (1, 2, 3, …) — simple, always correct, and rows
 * aren't reordered at high frequency so the cost is negligible.
 */
export async function moveRow(
  databaseId: string,
  rowPageId: string,
  userId: string,
  input: { before_id?: string; after_id?: string },
): Promise<void> {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });

  const rows = await getPrisma().page.findMany({
    where: { database_id: databaseId, is_deleted: false },
    orderBy: [{ row_order: "asc" }, { created_at: "asc" }],
    select: { id: true },
  });
  const moved = rows.find((r) => r.id === rowPageId);
  if (!moved) throw notFound("Row not found.");

  const siblings = rows.filter((r) => r.id !== rowPageId);

  // Resolve the insertion index from the anchors.
  let insertAt = siblings.length; // default: end
  if (input.before_id) {
    const i = siblings.findIndex((r) => r.id === input.before_id);
    if (i === -1) throw badRequest("Invalid before_id anchor.");
    insertAt = i;
  } else if (input.after_id) {
    const i = siblings.findIndex((r) => r.id === input.after_id);
    if (i === -1) throw badRequest("Invalid after_id anchor.");
    insertAt = i + 1;
  }

  siblings.splice(insertAt, 0, { id: moved.id });

  await getPrisma().$transaction(
    siblings.map((r, i) =>
      getPrisma().page.update({
        where: { id: r.id },
        data: { row_order: i + 1 },
      }),
    ),
  );
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

  // System types (created_*, last_edited_*) are derived from the row page and
  // cannot be written directly. Rollup is computed through a relation.
  if (
    property.type === "created_time" ||
    property.type === "created_by" ||
    property.type === "last_edited_time" ||
    property.type === "last_edited_by" ||
    property.type === "rollup"
  ) {
    throw badRequest(`${property.type} values are derived and cannot be set directly.`, {
      code: "SYSTEM_NOT_EDITABLE",
    });
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

  // Capture the previous value BEFORE the upsert (needed for relation diffing).
  const prevPv = await getPrisma().propertyValue.findUnique({
    where: {
      page_id_property_id: { page_id: rowPageId, property_id: propertyId },
    },
  });

  const pv = await getPrisma().propertyValue.upsert({
    where: { page_id_property_id: { page_id: rowPageId, property_id: propertyId } },
    update: { value: value as never },
    create: {
      page_id: rowPageId,
      property_id: propertyId,
      value: value as never,
    },
  });

  // If the edited property is the row's primary "Name" text property, keep the
  // backing page's title in sync (rows ARE pages; the title is the row label).
  if (
    property.name === "Name" &&
    property.type === "text" &&
    (typeof value === "string" || value === null)
  ) {
    await getPrisma().page.update({
      where: { id: rowPageId },
      data: { title: (value as string) ?? "", last_updated_by: userId },
    });
  }

  // Two-way relation sync: when a relation cell on this row is set to a set of
  // target rows, mirror this row's id into the inverse relation property on
  // each target row (creating the inverse property lazily if needed).
  if (property.type === "relation") {
    const relProp = await getPrisma().property.findUnique({
      where: { id: propertyId },
      select: { relation_database_id: true },
    });
    const targetDbId = relProp?.relation_database_id;
    if (targetDbId) {
      const newValue = Array.isArray(value)
        ? (value as unknown[]).filter((v): v is string => typeof v === "string")
        : [];
      const prevIds = Array.isArray(prevPv?.value)
        ? (prevPv!.value as unknown[]).filter((v): v is string => typeof v === "string")
        : [];
      // The inverse property lives on the TARGET database and points back here.
      await syncInverseRelation(
        rowPageId,
        property,
        row.database_id,
        targetDbId,
        newValue,
        prevIds,
      );
    }
  }

  // Re-evaluate this row's formula cells.
  const computed = await recomputeRowFormulas(rowPageId, row.database_id);

  return { value: pv.value, computed };
}

/**
 * Maintain the two-way mirror for a relation property. For the target rows now
 * linked from `sourceRowId`, ensure each target's inverse-relation cell
 * includes `sourceRowId`; for targets newly unlinked, remove it. The inverse
 * property is created on the target db lazily if it doesn't exist.
 */
async function syncInverseRelation(
  sourceRowId: string,
  sourceProp: { id: string; name: string; database_id: string },
  sourceDbId: string,
  targetDbId: string,
  newTargetIds: string[],
  prevIds: string[],
): Promise<void> {
  // Self-relation: inverse lives on the same db. Cross-db: on the target db.
  const inverseDbId = targetDbId;

  // Find or create the inverse relation property on the target db. We match by
  // relation_database_id pointing back at the source + a marker in options.
  let inverse = await getPrisma().property.findFirst({
    where: {
      database_id: inverseDbId,
      type: "relation",
      relation_database_id: sourceDbId,
      options: { path: ["__inverse_of"], equals: sourceProp.id },
    },
  });
  if (!inverse) {
    const sourceDb = await getPrisma().database.findUnique({
      where: { id: sourceDbId },
      select: { title: true },
    });
    inverse = await getPrisma().property.create({
      data: {
        database_id: inverseDbId,
        name: `${sourceDb?.title || "Related"} (from ${sourceProp.name})`,
        type: "relation",
        relation_database_id: sourceDbId,
        options: { __inverse_of: sourceProp.id } as never,
        order: 999,
      },
    });
  }

  // Diff against the previous set (captured before the upsert) so we add the
  // source to newly-linked targets and remove it from unlinked ones.
  const removed = prevIds.filter((id) => !newTargetIds.includes(id));
  const added = newTargetIds.filter((id) => !prevIds.includes(id));

  for (const targetId of [...added, ...removed]) {
    const existing = await getPrisma().propertyValue.findUnique({
      where: {
        page_id_property_id: { page_id: targetId, property_id: inverse.id },
      },
    });
    let arr = Array.isArray(existing?.value)
      ? (existing!.value as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    if (added.includes(targetId)) {
      if (!arr.includes(sourceRowId)) arr.push(sourceRowId);
    } else {
      arr = arr.filter((id) => id !== sourceRowId);
    }
    await getPrisma().propertyValue.upsert({
      where: {
        page_id_property_id: { page_id: targetId, property_id: inverse.id },
      },
      update: { value: arr as never },
      create: {
        page_id: targetId,
        property_id: inverse.id,
        value: arr as never,
      },
    });
  }
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

/**
 * Aggregate a list of raw property values for a rollup. Mirrors the formula
 * engine's aggregation semantics but applied to a pre-resolved value list
 * (the related rows' target-property values).
 */
function aggregate(
  aggregation: string,
  values: unknown[],
): ComputedCell {
  const nums = values
    .filter((v) => typeof v === "number")
    .sort((a, b) => (a as number) - (b as number));
  switch (aggregation) {
    case "count":
      return { status: "ok", value: values.length };
    case "sum":
      return { status: "ok", value: nums.reduce((a, b) => a + (b as number), 0) };
    case "avg":
      return nums.length === 0
        ? { status: "ok", value: null }
        : { status: "ok", value: nums.reduce((a, b) => a + (b as number), 0) / nums.length };
    case "min":
      return nums.length === 0 ? { status: "ok", value: null } : { status: "ok", value: nums[0] };
    case "max":
      return nums.length === 0
        ? { status: "ok", value: null }
        : { status: "ok", value: nums[nums.length - 1] };
    case "show_original":
      return { status: "ok", value: values };
    default:
      return {
        status: "error",
        error: { code: "type", message: `Unknown rollup aggregation: ${aggregation}` },
      };
  }
}
