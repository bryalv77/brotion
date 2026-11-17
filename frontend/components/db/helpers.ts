import type {
  ComputedCell,
  DatabaseRowDTO,
  PropertyDTO,
  PropertyType,
  SelectOption,
} from "@notion-clone/shared";

/** Sentinel key used for rows with no group-by value. */
export const NO_GROUP = "__none__";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Best-effort plain-text extraction from a value of unknown shape. */
export function plainText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => plainText(item))
      .filter((part) => part.length > 0)
      .join(", ");
  }
  if (isRecord(value)) {
    for (const key of ["value", "text", "title", "name", "label"] as const) {
      if (key in value) {
        const text = plainText(value[key]);
        if (text) return text;
      }
    }
  }
  return "";
}

/** Compact display text. Empty values render as an em dash. */
export function formatValue(value: unknown): string {
  return plainText(value) || "—";
}

/** Display text for a cell, with a friendlier checkbox representation. */
export function displayCellText(value: unknown, type: PropertyType): string {
  if (type === "checkbox") return value === true ? "☑" : "☐";
  return formatValue(value);
}

/** Format a server-computed cell (formula / rollup). */
export function formatComputed(cell: ComputedCell | undefined): string {
  if (!cell) return "—";
  if (cell.status === "error") return `⚠ ${cell.error?.message ?? "Error"}`;
  return formatValue(cell.value);
}

/** Normalise select/status/multi_select options from the API's `options` field. */
export function readSelectOptions(options: unknown): SelectOption[] {
  const fromUnknown = (item: unknown): SelectOption | null => {
    if (typeof item === "string") return { value: item };
    if (isRecord(item) && typeof item.value === "string") {
      return {
        value: item.value,
        color: typeof item.color === "string" ? item.color : undefined,
      };
    }
    return null;
  };
  const collect = (items: unknown[]): SelectOption[] =>
    items
      .map(fromUnknown)
      .filter((option): option is SelectOption => option !== null);

  if (Array.isArray(options)) return collect(options);
  if (isRecord(options) && Array.isArray(options.options)) {
    return collect(options.options);
  }
  return [];
}

/** The property shown as a row's title: the "Name" property, else the first. */
export function primaryProperty(properties: PropertyDTO[]): PropertyDTO | undefined {
  return properties.find((p) => p.name === "Name") ?? properties[0];
}

export function visibleProperties(
  properties: PropertyDTO[],
  hidden: string[],
): PropertyDTO[] {
  return properties.filter((p) => !hidden.includes(p.name));
}

export function rowValue(row: DatabaseRowDTO, propertyId: string): unknown {
  return row.values.find((v) => v.property_id === propertyId)?.value;
}

/** Group keys for a row (a multi-select row may belong to several columns). */
export function groupKeys(row: DatabaseRowDTO, propertyId: string): string[] {
  const value = rowValue(row, propertyId);
  if (Array.isArray(value)) {
    const keys = value.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
    return keys.length > 0 ? keys : [NO_GROUP];
  }
  const key = plainText(value);
  return key ? [key] : [NO_GROUP];
}

export function groupLabel(key: string): string {
  return key === NO_GROUP ? "No status" : key;
}

/** String values from a property value (used by select / multi_select editors). */
export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  const text = plainText(value);
  return text ? [text] : [];
}

/** Tailwind color classes for option chips (literal strings for NativeWind). */
export const OPTION_COLORS = [
  "bg-neutral-200 text-neutral-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
] as const;

/** Deterministic color for an option value (stable across renders). */
export function colorFor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return OPTION_COLORS[hash % OPTION_COLORS.length];
}

/** Property types whose values are computed by the server and cannot be edited. */
export function isReadOnlyType(type: PropertyType): boolean {
  return (
    type === "formula" ||
    type === "rollup" ||
    type === "created_time" ||
    type === "created_by" ||
    type === "last_edited_time" ||
    type === "last_edited_by"
  );
}

/** Property types whose values can be used to group rows (board columns, list sections). */
export const isGroupable = (property: PropertyDTO): boolean =>
  property.type === "select" ||
  property.type === "status" ||
  property.type === "multi_select";
