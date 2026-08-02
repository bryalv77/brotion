/**
 * Pure filter + sort over a database's rows, driven by a ViewConfig.
 *
 * Kept side-effect-free and framework-agnostic so it can be unit-tested in
 * isolation (`applyViewConfig.test.ts`) and reused by any caller that has a
 * resolved set of rows + properties. Operates on property NAMEs (matching the
 * ViewConfig schema in shared/api-types.ts).
 */
import type { Filter, Sort, ViewConfig } from "@notion-clone/shared";

/** A row in the shape this module needs (decoupled from the Prisma Page type). */
export interface ViewRow {
  page_id: string;
  /** Raw cell value keyed by property NAME (PropertyValueDTO.value). */
  valuesByName: Record<string, unknown>;
  /** Computed cell value (formula/rollup) keyed by property NAME. */
  computedByName?: Record<string, unknown>;
  created_at?: string | number;
  updated_at?: string | number;
}

/** Normalize a stored value into something comparable for a given property type. */
function asScalar(value: unknown, type: string): unknown {
  if (value === null || value === undefined) return null;
  switch (type) {
    case "number":
      return typeof value === "number" ? value : Number(value);
    case "checkbox":
      return value === true || value === "true" ? true : false;
    case "select":
    case "status":
      return typeof value === "string" ? value : null;
    case "multi_select":
      return Array.isArray(value) ? (value as string[]) : [];
    case "date":
      // Stored as "YYYY-MM-DD"; compare as strings (chronological for ISO dates).
      return typeof value === "string" ? value : null;
    default:
      return value;
  }
}

/** Evaluate a single filter against a row. */
function matches(row: ViewRow, filter: Filter, typeMap: Map<string, string>): boolean {
  const type = typeMap.get(filter.property) ?? "text";
  // Prefer computed value (formula/rollup) when present, else the raw cell.
  const raw =
    row.computedByName?.[filter.property] ?? row.valuesByName[filter.property];
  const value =
    raw !== undefined && raw !== null && typeof raw === "object" && "value" in (raw as object)
      ? (raw as { value: unknown }).value // unwrap a ComputedCell
      : raw;
  const scalar = asScalar(value, type);

  switch (filter.op) {
    case "is_empty":
      return scalar === null || scalar === "" ||
        (Array.isArray(scalar) && scalar.length === 0);
    case "is_not_empty":
      return !(scalar === null || scalar === "" ||
        (Array.isArray(scalar) && scalar.length === 0));
    case "eq":
      return scalar === filter.value;
    case "ne":
      return scalar !== filter.value;
    case "contains":
      return typeof scalar === "string" && typeof filter.value === "string"
        ? scalar.includes(filter.value)
        : Array.isArray(scalar) && typeof filter.value === "string"
          ? (scalar as string[]).includes(filter.value)
          : false;
    case "any_of":
      return Array.isArray(scalar) && Array.isArray(filter.value)
        ? (filter.value as string[]).some((v) => (scalar as string[]).includes(v))
        : typeof filter.value === "string" && Array.isArray(scalar)
          ? (scalar as string[]).includes(filter.value as string)
          : false;
    case "none_of":
      return Array.isArray(filter.value)
        ? (filter.value as string[]).every((v) => !(Array.isArray(scalar) ? scalar : [scalar]).includes(v))
        : !(Array.isArray(scalar) ? scalar : [scalar]).includes(filter.value as string);
    case "gt":
      return compareOrd(scalar, filter.value) > 0;
    case "gte":
      return compareOrd(scalar, filter.value) >= 0;
    case "lt":
      return compareOrd(scalar, filter.value) < 0;
    case "lte":
      return compareOrd(scalar, filter.value) <= 0;
    default:
      return true;
  }
}

/** Three-way compare for gt/gte/lt/lte (nulls sort low). */
function compareOrd(a: unknown, b: unknown): number {
  const av = a === null || a === undefined ? null : a;
  const bv = b === null || b === undefined ? null : b;
  if (av === null && bv === null) return 0;
  if (av === null) return -1;
  if (bv === null) return 1;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  // Dates / strings: lexicographic (works for ISO dates and YYYY-MM-DD).
  return String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
}

/** Multi-key stable sort. Last sort wins as the primary key (Notion behavior). */
function sortRows(rows: ViewRow[], sorts: Sort[], typeMap: Map<string, string>): ViewRow[] {
  if (sorts.length === 0) return rows;
  const out = [...rows];
  // Apply sorts right-to-left so the first sort is the most significant.
  for (let i = sorts.length - 1; i >= 0; i--) {
    const s = sorts[i];
    const type = typeMap.get(s.property) ?? "text";
    out.sort((a, b) => {
      const av = asScalar(
        a.computedByName?.[s.property] ?? a.valuesByName[s.property],
        type,
      );
      const bv = asScalar(
        b.computedByName?.[s.property] ?? b.valuesByName[s.property],
        type,
      );
      const cmp = compareOrd(av, bv);
      return s.direction === "desc" ? -cmp : cmp;
    });
  }
  return out;
}

/**
 * Apply a view config (filters AND'd together, then multi-key sort) to a set
 * of rows. Returns a NEW filtered+sorted array; does not mutate the input.
 *
 * @param rows     The full row set.
 * @param properties  Array of { name, type } describing the schema.
 * @param config   The view's filters/sorts (group_by/hidden are presentation,
 *                 applied client-side, so ignored here).
 */
export function applyViewConfig(
  rows: ViewRow[],
  properties: Array<{ name: string; type: string }>,
  config: ViewConfig | null | undefined,
): ViewRow[] {
  if (!config) return rows;
  const typeMap = new Map(properties.map((p) => [p.name, p.type] as const));

  let filtered = rows;
  if (config.filters && config.filters.length > 0) {
    filtered = rows.filter((r) =>
      config.filters.every((f) => matches(r, f, typeMap)),
    );
  }
  if (config.sorts && config.sorts.length > 0) {
    filtered = sortRows(filtered, config.sorts, typeMap);
  }
  return filtered;
}
