import {
  aggregateRollup,
  normalizeSelectOptions,
  readFormulaSource,
  safeCollectDependencies,
  deriveSystemValue,
  isComputedType,
  isSystemType,
  type SystemPropertyType,
} from "@notion-clone/shared";
import {
  applyViewConfig,
  detectCycle,
  evaluateCellCached,
  type ComputedCell,
  type DatabaseDTO,
  type DatabaseRowDTO,
  type DatabaseViewDTO,
  type PropertyDTO,
  type PropertyType,
  type TemplateDTO,
  type ViewConfig,
  type ViewType,
} from "@notion-clone/shared";
import { getLocalStore, type LocalDatabaseDef, type LocalPage } from "@/lib/local/store";
import { newId } from "@/lib/local/ids";
import { badRequest, notFound } from "./util";
import type { LocalPropertyValue } from "@/lib/local/store";

/**
 * Local (guest) database operations. Mirrors lib/api/databases.ts against the
 * local store, reproducing the server's DTO assembly: formula `computed`
 * cells (via the shared engine), derived system properties, rollups, relation
 * summaries, and view filtering (via shared applyViewConfig).
 */

async function requireDef(databaseId: string): Promise<LocalDatabaseDef> {
  const db = await getLocalStore().getDatabaseDef(databaseId);
  if (!db) throw notFound("Database not found.");
  return db;
}

/** Live rows of a database, ordered like the server returns them. */
async function liveRows(databaseId: string): Promise<LocalPage[]> {
  const rows = await getLocalStore().findPages(
    (p) => p.database_id === databaseId && !p.is_deleted,
  );
  return rows.sort(
    (a, b) =>
      (a.row_order ?? 0) - (b.row_order ?? 0) ||
      a.created_at.localeCompare(b.created_at),
  );
}

interface AssembledRow {
  page: LocalPage;
  valuesByName: Record<string, unknown>;
  computed: Record<string, ComputedCell>;
  /** Stored cell values for the row (as persisted). */
  storedValues: LocalPropertyValue[];
  /** Derived system-property values, injected at read time. */
  systemValues: LocalPropertyValue[];
}

/**
 * Assemble rows with stored values, derived system values, formula cells,
 * rollups and relation summaries — the read-side of the server contract.
 */
async function assembleRows(
  def: LocalDatabaseDef,
  rows: LocalPage[],
): Promise<AssembledRow[]> {
  const store = getLocalStore();
  const propMeta = def.properties.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));
  const byId = new Map(def.properties.map((p) => [p.id, p] as const));

  const assembled: AssembledRow[] = [];
  for (const page of rows) {
    const stored = await store.listValues(page.id);
    const valuesByName: Record<string, unknown> = {};
    for (const v of stored) {
      const prop = byId.get(v.property_id);
      if (prop) valuesByName[prop.name] = v.value;
    }

    // Derived system properties (no stored rows, read off the page).
    const systemValues: LocalPropertyValue[] = [];
    for (const sp of def.properties.filter((p) => isSystemType(p.type))) {
      const derived = deriveSystemValue(sp.type as SystemPropertyType, {
        ...page,
        last_updated_by: page.created_by,
      });
      if (!stored.some((v) => v.property_id === sp.id)) {
        valuesByName[sp.name] = derived;
        systemValues.push({
          id: `system-${sp.id}`,
          page_id: page.id,
          property_id: sp.id,
          value: derived,
        });
      }
    }

    assembled.push({ page, valuesByName, computed: {}, storedValues: stored, systemValues });
  }

  // Formula cells — with the all-rows view for aggregation functions.
  const formulaProps = def.properties.filter((p) => p.type === "formula");
  if (formulaProps.length > 0 && assembled.length > 0) {
    const referenced = new Set<string>();
    for (const fp of formulaProps) {
      for (const dep of safeCollectDependencies(readFormulaSource(fp.options))) {
        referenced.add(dep);
      }
    }
    const allValues: Record<string, unknown[]> = {};
    for (const name of referenced) allValues[name] = [];
    for (const row of assembled) {
      for (const name of referenced) {
        allValues[name].push(row.valuesByName[name] ?? null);
      }
    }
    for (const row of assembled) {
      for (const fp of formulaProps) {
        row.computed[fp.id] = evaluateCellCached(
          readFormulaSource(fp.options),
          { properties: propMeta, values: row.valuesByName, allValues },
          fp.id,
        );
      }
    }
  }

  // Rollups + relation summaries.
  const relationProps = def.properties.filter((p) => p.type === "relation");
  const rollupProps = def.properties.filter((p) => p.type === "rollup");
  for (const rp of rollupProps) {
    const cfg = rp.rollup_config;
    if (!cfg) continue;
    const relationProp = byId.get(cfg.relation_property_id);
    const targetProp = byId.get(cfg.target_property_id);
    if (!relationProp || !targetProp) continue;
    for (const row of assembled) {
      const targetIds = Array.isArray(row.valuesByName[relationProp.name])
        ? (row.valuesByName[relationProp.name] as unknown[]).filter(
            (v): v is string => typeof v === "string",
          )
        : [];
      const targetValues: unknown[] = [];
      for (const targetId of targetIds) {
        const pv = await store.getValue(targetId, targetProp.id);
        targetValues.push(pv?.value ?? null);
      }
      row.computed[rp.id] = aggregateRollup(cfg.aggregation, targetValues);
    }
  }
  for (const rp of relationProps) {
    for (const row of assembled) {
      const ids = Array.isArray(row.valuesByName[rp.name])
        ? (row.valuesByName[rp.name] as unknown[]).filter(
            (v): v is string => typeof v === "string",
          )
        : [];
      if (ids.length === 0) continue;
      const targets = await Promise.all(
        ids.map(async (id) => ({
          page_id: id,
          title: (await store.getPage(id))?.title ?? "",
        })),
      );
      row.computed[rp.id] = {
        status: "ok",
        value: targets.map((t) => ({ page_id: t.page_id, title: t.title })),
      };
    }
  }

  return assembled;
}

function toRowDTO(row: AssembledRow): DatabaseRowDTO {
  const dto: DatabaseRowDTO = {
    page_id: row.page.id,
    title: row.page.title,
    values: [
      ...row.storedValues.map((v) => ({
        id: v.id,
        property_id: v.property_id,
        value: v.value,
      })),
      ...row.systemValues.map((v) => ({
        id: v.id,
        property_id: v.property_id,
        value: v.value,
      })),
    ],
  };
  if (Object.keys(row.computed).length > 0) dto.computed = row.computed;
  return dto;
}

// ── Database CRUD ──────────────────────────────────────────────────────────

export async function createDatabase(
  pageId: string,
  body: { title?: string; icon?: string },
): Promise<DatabaseDTO> {
  const store = getLocalStore();
  const page = await store.getPage(pageId);
  if (!page) throw notFound("Page not found.");

  const def: LocalDatabaseDef = {
    id: newId(),
    page_id: pageId,
    workspace_id: page.workspace_id,
    title: body.title ?? "",
    icon: body.icon ?? null,
    properties: [
      { id: newId(), database_id: "", name: "Name", type: "text", order: 0 },
    ],
    views: [],
    templates: [],
    created_at: new Date().toISOString(),
  };
  def.properties[0].database_id = def.id;
  def.views.push({
    id: newId(),
    database_id: def.id,
    name: "Table",
    type: "table",
    config: { filters: [], sorts: [] },
    order: 0,
  });
  await store.putDatabaseDef(def);
  return defToDTO(def, []);
}

export async function getDatabase(
  id: string,
  viewId?: string,
): Promise<DatabaseDTO> {
  const def = await requireDef(id);
  const rows = await liveRows(id);
  const assembled = await assembleRows(def, rows);

  // Apply view filtering/sorting when a view with config is requested.
  let ordered = assembled;
  if (viewId) {
    const view = def.views.find((v) => v.id === viewId);
    const config = view?.config;
    if (config && (config.filters?.length || config.sorts?.length)) {
      const viewRows = assembled.map((r) => ({
        page_id: r.page.id,
        valuesByName: r.valuesByName,
        computedByName: Object.fromEntries(
          Object.entries(r.computed).map(([propId, cell]) => {
            const prop = def.properties.find((p) => p.id === propId);
            return [prop?.name ?? propId, cell];
          }),
        ),
      }));
      const filtered = applyViewConfig(
        viewRows,
        def.properties.map((p) => ({ name: p.name, type: p.type })),
        config,
      );
      const order = new Map(filtered.map((r, i) => [r.page_id, i] as const));
      ordered = assembled
        .filter((r) => order.has(r.page.id))
        .sort((a, b) => (order.get(a.page.id) ?? 0) - (order.get(b.page.id) ?? 0));
    }
  }

  return defToDTO(def, ordered);
}

export async function listPageDatabases(pageId: string): Promise<DatabaseDTO[]> {
  const defs = await getLocalStore().listDatabaseDefs(pageId);
  return defs.map((def) => defToDTO(def, []));
}

export async function deleteDatabase(id: string): Promise<void> {
  const store = getLocalStore();
  const def = await requireDef(id);
  // Rows survive as plain pages (database_id cleared), like the server.
  const rows = await store.findPages((p) => p.database_id === id);
  for (const row of rows) {
    await store.putPage({ ...row, database_id: null });
  }
  for (const prop of def.properties) {
    await store.deleteValuesByProperty(prop.id);
  }
  await store.deleteDatabaseDef(id);
}

// ── Properties ─────────────────────────────────────────────────────────────

export async function addProperty(
  databaseId: string,
  body: { name: string; type: PropertyType; options?: unknown },
): Promise<PropertyDTO> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);

  if (body.type === "formula") {
    const source = readFormulaSource(body.options);
    const deps = safeCollectDependencies(source);
    const existing = def.properties
      .filter((p) => p.type === "formula")
      .map((p) => ({ name: p.name, source: readFormulaSource(p.options) }));
    const cycle = detectCycle(body.name, deps, existing);
    if (cycle !== null) {
      throw badRequest(`Formula creates a circular dependency via "${cycle}"`, "FORMULA_CYCLE");
    }
  }

  const prop: PropertyDTO = {
    id: newId(),
    database_id: databaseId,
    name: body.name,
    type: body.type,
    order: def.properties.length,
  };
  const stored = normalizeSelectOptions(body.type, body.options) ?? null;
  if (stored !== null) prop.options = stored;
  await store.putDatabaseDef({ ...def, properties: [...def.properties, prop] });
  return prop;
}

export async function updateProperty(
  databaseId: string,
  propertyId: string,
  body: { name?: string; options?: unknown },
): Promise<PropertyDTO> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  const prop = def.properties.find((p) => p.id === propertyId);
  if (!prop) throw notFound("Property not found.");

  if (prop.type === "formula") {
    const source = readFormulaSource(body.options ?? prop.options);
    const deps = safeCollectDependencies(source);
    const existing = def.properties
      .filter((p) => p.type === "formula" && p.id !== propertyId)
      .map((p) => ({ name: p.name, source: readFormulaSource(p.options) }));
    const cycle = detectCycle(body.name ?? prop.name, deps, existing);
    if (cycle !== null) {
      throw badRequest(`Formula creates a circular dependency via "${cycle}"`, "FORMULA_CYCLE");
    }
  }

  const next: PropertyDTO = { ...prop };
  if (body.name !== undefined) next.name = body.name;
  if (body.options !== undefined) next.options = body.options;
  await store.putDatabaseDef({
    ...def,
    properties: def.properties.map((p) => (p.id === propertyId ? next : p)),
  });
  return next;
}

export async function deleteProperty(
  databaseId: string,
  propertyId: string,
): Promise<void> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  if (def.properties.length <= 1) {
    throw badRequest("A database must keep at least one property.", "LAST_PROPERTY");
  }
  await store.deleteValuesByProperty(propertyId);
  await store.putDatabaseDef({
    ...def,
    properties: def.properties.filter((p) => p.id !== propertyId),
  });
}

// ── Rows + values ──────────────────────────────────────────────────────────

export async function addRow(
  databaseId: string,
  body?: { template_id?: string | null },
): Promise<{ page_id: string; title: string }> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);

  // Resolve the template: explicit id, else the db's default.
  let template: TemplateDTO | null = null;
  if (body?.template_id) {
    template = def.templates.find((t) => t.id === body.template_id) ?? null;
    if (!template) throw badRequest("Template not found.", "TEMPLATE_NOT_FOUND");
  } else {
    template = def.templates.find((t) => t.is_default) ?? null;
  }

  const defaults: Record<string, unknown> = template?.default_values ?? {};
  const nameProp = def.properties.find(
    (p) => p.name === "Name" && p.type === "text",
  );
  const title =
    nameProp && nameProp.id in defaults && typeof defaults[nameProp.id] === "string"
      ? (defaults[nameProp.id] as string)
      : "";

  const rows = await liveRows(databaseId);
  const rowOrder = (rows[rows.length - 1]?.row_order ?? 0) + 1;
  const now = new Date().toISOString();
  const rowPage: LocalPage = {
    id: newId(),
    workspace_id: def.workspace_id,
    parent_id: null,
    database_id: databaseId,
    title,
    icon: null,
    has_children: false,
    cover_url: null,
    is_deleted: false,
    created_by: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    row_order: rowOrder,
    is_template: false,
  };
  await store.putPage(rowPage);

  // Deep-copy the template's block body onto the row.
  if (template) {
    const src = await store.listBlocks(template.page_id);
    const idMap = new Map<string, string>();
    for (const b of src) {
      const blockId = newId();
      idMap.set(b.id, blockId);
      await store.putBlock({
        ...b,
        id: blockId,
        page_id: rowPage.id,
        parent_block_id: b.parent_block_id
          ? (idMap.get(b.parent_block_id) ?? null)
          : null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  // Seed default property values.
  for (const [propId, value] of Object.entries(defaults)) {
    if (!def.properties.some((p) => p.id === propId)) continue;
    await store.putValue({
      id: newId(),
      page_id: rowPage.id,
      property_id: propId,
      value,
    });
  }

  return { page_id: rowPage.id, title };
}

export async function deleteRow(rowPageId: string): Promise<void> {
  const store = getLocalStore();
  const row = await store.getPage(rowPageId);
  if (!row?.database_id) throw notFound("Row not found.");
  await store.putPage({
    ...row,
    is_deleted: true,
    deleted_at: new Date().toISOString(),
  });
}

export async function updatePropertyValue(
  rowPageId: string,
  propertyId: string,
  value: unknown,
): Promise<{ value: unknown; computed: Record<string, ComputedCell> }> {
  const store = getLocalStore();
  const row = await store.getPage(rowPageId);
  if (!row?.database_id) throw notFound("Row not found.");
  const def = await requireDef(row.database_id);
  const prop = def.properties.find((p) => p.id === propertyId);
  if (!prop) throw notFound("Property not found.");

  if (prop.type === "formula") {
    throw badRequest(
      "Formula values are computed; edit the formula on the property instead.",
      "FORMULA_NOT_EDITABLE",
    );
  }
  if (prop.type === "rollup" || isSystemType(prop.type)) {
    throw badRequest(
      `${prop.type} values are derived and cannot be set directly.`,
      "SYSTEM_NOT_EDITABLE",
    );
  }

  const prev = await store.getValue(rowPageId, propertyId);
  await store.putValue({
    id: prev?.id ?? newId(),
    page_id: rowPageId,
    property_id: propertyId,
    value,
  });

  // Name ↔ row title sync.
  if (prop.name === "Name" && prop.type === "text") {
    await store.putPage({
      ...row,
      title: typeof value === "string" ? value : "",
      updated_at: new Date().toISOString(),
    });
  }

  // Two-way relation sync: mirror this row into the inverse cells.
  if (prop.type === "relation" && prop.relation_database_id) {
    await syncInverseRelation(def, prop, rowPageId, value, prev?.value);
  }

  // Re-evaluate this row's formula cells (aggregations see all rows).
  const rows = await liveRows(def.id);
  const assembled = await assembleRows(def, rows);
  const me = assembled.find((r) => r.page.id === rowPageId);
  return { value, computed: me ? filterComputed(def, me.computed) : {} };
}

async function syncInverseRelation(
  def: LocalDatabaseDef,
  sourceProp: PropertyDTO,
  sourceRowId: string,
  value: unknown,
  prevValue: unknown,
): Promise<void> {
  const store = getLocalStore();
  const targetDbId = sourceProp.relation_database_id!;
  const targetDef = (await store.getDatabaseDef(targetDbId)) ?? def;

  // Find or lazily create the inverse relation property on the target db.
  let inverse = targetDef.properties.find(
    (p) =>
      p.type === "relation" &&
      p.relation_database_id === def.id &&
      (p.options as { __inverse_of?: string } | undefined)?.__inverse_of === sourceProp.id,
  );
  if (!inverse) {
    inverse = {
      id: newId(),
      database_id: targetDef.id,
      name: `${def.title || "Related"} (from ${sourceProp.name})`,
      type: "relation",
      relation_database_id: def.id,
      options: { __inverse_of: sourceProp.id },
      order: 999,
    };
    await store.putDatabaseDef({
      ...targetDef,
      properties: [...targetDef.properties, inverse],
    });
  }

  const newIds = Array.isArray(value)
    ? (value as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const prevIds = Array.isArray(prevValue)
    ? (prevValue as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  for (const targetId of [...newIds, ...prevIds]) {
    const existing = await store.getValue(targetId, inverse!.id);
    let arr = Array.isArray(existing?.value)
      ? (existing!.value as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    if (newIds.includes(targetId)) {
      if (!arr.includes(sourceRowId)) arr.push(sourceRowId);
    } else {
      arr = arr.filter((id) => id !== sourceRowId);
    }
    await store.putValue({
      id: existing?.id ?? newId(),
      page_id: targetId,
      property_id: inverse!.id,
      value: arr,
    });
  }
}

/** Keep only formula-property cells for the mutation response. */
function filterComputed(
  def: LocalDatabaseDef,
  computed: Record<string, ComputedCell>,
): Record<string, ComputedCell> {
  const formulaIds = new Set(
    def.properties.filter((p) => p.type === "formula").map((p) => p.id),
  );
  return Object.fromEntries(
    Object.entries(computed).filter(([id]) => formulaIds.has(id)),
  );
}

// ── Views ──────────────────────────────────────────────────────────────────

export async function createView(
  databaseId: string,
  body: { name?: string; type?: ViewType; config?: ViewConfig },
): Promise<DatabaseViewDTO> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  const view: DatabaseViewDTO = {
    id: newId(),
    database_id: databaseId,
    name: body.name ?? "Table",
    type: body.type ?? "table",
    config: body.config ?? { filters: [], sorts: [] },
    order: def.views.length,
  };
  await store.putDatabaseDef({ ...def, views: [...def.views, view] });
  return view;
}

export async function updateView(
  databaseId: string,
  viewId: string,
  body: { name?: string; type?: ViewType; config?: ViewConfig },
): Promise<DatabaseViewDTO> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  const view = def.views.find((v) => v.id === viewId);
  if (!view) throw notFound("View not found.");
  const next: DatabaseViewDTO = { ...view };
  if (body.name !== undefined) next.name = body.name;
  if (body.type !== undefined) next.type = body.type;
  if (body.config !== undefined) next.config = body.config;
  await store.putDatabaseDef({
    ...def,
    views: def.views.map((v) => (v.id === viewId ? next : v)),
  });
  return next;
}

export async function deleteView(
  databaseId: string,
  viewId: string,
): Promise<void> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  if (def.views.length <= 1) {
    throw badRequest("A database must keep at least one view.", "LAST_VIEW");
  }
  await store.putDatabaseDef({
    ...def,
    views: def.views.filter((v) => v.id !== viewId),
  });
}

// ── Templates ──────────────────────────────────────────────────────────────

export async function listTemplates(databaseId: string): Promise<TemplateDTO[]> {
  const def = await requireDef(databaseId);
  return sortTemplates(def.templates);
}

function sortTemplates(templates: TemplateDTO[]): TemplateDTO[] {
  // Insertion order is preserved; default floats first (stable).
  return [...templates].sort((a, b) => Number(b.is_default) - Number(a.is_default));
}

export async function createTemplate(
  databaseId: string,
  body: { name?: string; icon?: string },
): Promise<TemplateDTO> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  const name = body.name?.trim() ?? "";

  // Hidden body page (is_template keeps it out of trees/search/breadcrumbs).
  const now = new Date().toISOString();
  const bodyPage: LocalPage = {
    id: newId(),
    workspace_id: def.workspace_id,
    parent_id: null,
    title: name,
    icon: body.icon ?? null,
    has_children: false,
    cover_url: null,
    is_deleted: false,
    created_by: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    row_order: 0,
    is_template: true,
  };
  await store.putPage(bodyPage);

  const template: TemplateDTO = {
    id: newId(),
    database_id: databaseId,
    name,
    icon: body.icon ?? null,
    page_id: bodyPage.id,
    default_values: {},
    is_default: def.templates.length === 0,
  };
  await store.putDatabaseDef({
    ...def,
    templates: [...def.templates, template],
  });
  return template;
}

export async function updateTemplate(
  databaseId: string,
  templateId: string,
  body: {
    name?: string;
    icon?: string | null;
    is_default?: boolean;
    default_values?: Record<string, unknown>;
  },
): Promise<TemplateDTO> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  const template = def.templates.find((t) => t.id === templateId);
  if (!template) throw notFound("Template not found.");

  let defaults = template.default_values;
  if (body.default_values !== undefined) {
    defaults = {};
    for (const [propId, value] of Object.entries(body.default_values)) {
      const prop = def.properties.find((p) => p.id === propId);
      if (!prop) {
        throw badRequest(
          `Property ${propId} does not belong to this database.`,
          "UNKNOWN_PROPERTY",
        );
      }
      if (isComputedType(prop.type)) {
        throw badRequest(
          `${prop.type} properties cannot have a default value.`,
          "NON_DEFAULTABLE_TYPE",
        );
      }
      defaults[propId] = value;
    }
  }

  let templates = def.templates.map((t) => {
    if (t.id !== templateId) {
      // Promote to default: un-mark siblings.
      return body.is_default === true ? { ...t, is_default: false } : t;
    }
    return {
      ...t,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      ...(body.is_default !== undefined ? { is_default: body.is_default } : {}),
      default_values: defaults,
    };
  });
  await store.putDatabaseDef({ ...def, templates });

  // Keep the hidden body page's title/icon in sync.
  const bodyPage = await store.getPage(template.page_id);
  if (bodyPage) {
    await store.putPage({
      ...bodyPage,
      ...(body.name !== undefined ? { title: body.name } : {}),
      ...(body.icon !== undefined ? { icon: body.icon } : {}),
      updated_at: new Date().toISOString(),
    });
  }

  return templates.find((t) => t.id === templateId)!;
}

export async function deleteTemplate(
  databaseId: string,
  templateId: string,
): Promise<void> {
  const store = getLocalStore();
  const def = await requireDef(databaseId);
  const template = def.templates.find((t) => t.id === templateId);
  if (!template) throw notFound("Template not found.");
  await store.putDatabaseDef({
    ...def,
    templates: def.templates.filter((t) => t.id !== templateId),
  });
  await store.deletePageHard(template.page_id);
}

// ── DTO assembly ───────────────────────────────────────────────────────────

function defToDTO(def: LocalDatabaseDef, rows: AssembledRow[]): DatabaseDTO {
  return {
    id: def.id,
    page_id: def.page_id,
    workspace_id: def.workspace_id,
    title: def.title,
    icon: def.icon,
    properties: [...def.properties].sort((a, b) => a.order - b.order),
    views: [...def.views].sort((a, b) => a.order - b.order),
    templates: sortTemplates(def.templates),
    rows: rows.map(toRowDTO),
  };
}
