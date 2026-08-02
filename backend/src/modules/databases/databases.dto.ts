import type { Database, DatabaseView, Property, PropertyValue, Template } from "@prisma/client";
import type { Page } from "@prisma/client";
import type {
  ComputedCell,
  DatabaseDTO,
  DatabaseRowDTO,
  DatabaseViewDTO,
  PropertyDTO,
  PropertyValueDTO,
  TemplateDTO,
  ViewConfig,
} from "@notion-clone/shared";

export function toTemplateDTO(t: {
  id: string;
  database_id: string;
  name: string;
  icon: string | null;
  page_id: string;
  default_values: unknown;
  is_default: boolean;
}): TemplateDTO {
  // default_values is stored as Json; normalize {} → empty object.
  const defaults =
    t.default_values && typeof t.default_values === "object"
      ? (t.default_values as Record<string, unknown>)
      : {};
  return {
    id: t.id,
    database_id: t.database_id,
    name: t.name,
    icon: t.icon,
    page_id: t.page_id,
    default_values: defaults,
    is_default: t.is_default,
  };
}

export function toPropertyDTO(p: Property): PropertyDTO {
  const dto: PropertyDTO = {
    id: p.id,
    database_id: p.database_id,
    name: p.name,
    type: p.type,
    options: p.options ?? undefined,
    order: p.order,
  };
  if (p.relation_database_id !== undefined && p.relation_database_id !== null) {
    dto.relation_database_id = p.relation_database_id;
  }
  if (p.rollup_config !== undefined && p.rollup_config !== null) {
    // Stored as Json; cast through unknown to the typed shape.
    dto.rollup_config = p.rollup_config as unknown as PropertyDTO["rollup_config"];
  }
  return dto;
}

export function toDatabaseViewDTO(v: DatabaseView): DatabaseViewDTO {
  // config is stored as Json with a {} default; normalize to ViewConfig.
  const cfg = (v.config ?? {}) as unknown as Partial<ViewConfig>;
  return {
    id: v.id,
    database_id: v.database_id,
    name: v.name,
    type: v.type,
    config: {
      filters: cfg.filters ?? [],
      sorts: cfg.sorts ?? [],
      ...(cfg.group_by !== undefined ? { group_by: cfg.group_by } : {}),
      ...(cfg.hidden !== undefined ? { hidden: cfg.hidden } : {}),
    },
    order: v.order,
  };
}

export function toPropertyValueDTO(
  v: PropertyValue,
): PropertyValueDTO {
  return { id: v.id, property_id: v.property_id, value: v.value };
}

export function toDatabaseDTO(
  db: Database & {
    properties: Property[];
    views?: DatabaseView[];
    rows?: Array<Page & { property_values: PropertyValue[] }>;
    /** Optional pre-computed cells, keyed by row page_id then property_id. */
    computed?: Record<string, Record<string, ComputedCell>>;
    /** Optional templates list (included by getDatabase/createDatabase). */
    templates?: Template[];
  },
): DatabaseDTO {
  const dto: DatabaseDTO = {
    id: db.id,
    page_id: db.page_id,
    workspace_id: db.workspace_id,
    title: db.title,
    icon: db.icon,
    properties: db.properties.map(toPropertyDTO),
    views: (db.views ?? []).map(toDatabaseViewDTO),
    rows: (db.rows ?? []).map((p) => toRowDTO(p, db.computed?.[p.id])),
  };
  if (db.templates) {
    dto.templates = db.templates.map(toTemplateDTO);
  }
  return dto;
}

function toRowDTO(
  p: Page & { property_values: PropertyValue[] },
  computed: Record<string, ComputedCell> | undefined,
): DatabaseRowDTO {
  const row: DatabaseRowDTO = {
    page_id: p.id,
    title: p.title,
    values: p.property_values.map(toPropertyValueDTO),
  };
  if (computed && Object.keys(computed).length > 0) {
    row.computed = computed;
  }
  return row;
}
