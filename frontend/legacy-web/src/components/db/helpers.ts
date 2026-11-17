import type { PropertyValueDTO, SelectOption } from "@notion-clone/shared";

/** Format a scalar/formula value for compact display. */
export function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") return String(v);
  return String(v);
}

/** Extract a formula source from a property's `options` field. */
export function readFormulaSource(options: unknown): string {
  if (
    options !== null &&
    options !== undefined &&
    typeof options === "object" &&
    "formula" in options &&
    typeof (options as { formula: unknown }).formula === "string"
  ) {
    return (options as { formula: string }).formula;
  }
  return "";
}

/**
 * Read select/multi_select/status options, tolerating BOTH the legacy
 * `string[]` shape and the new `{ options: SelectOption[] }` shape.
 * Returns the bare value strings (colors are applied in the UI).
 */
export function readSelectOptions(options: unknown): SelectOption[] {
  if (
    options !== null &&
    options !== undefined &&
    typeof options === "object" &&
    "options" in options &&
    Array.isArray((options as { options: unknown }).options)
  ) {
    return (options as { options: unknown[] }).options
      .map((o) =>
        typeof o === "string" ? { value: o } : (o as SelectOption),
      )
      .filter((o): o is SelectOption => typeof o.value === "string");
  }
  return [];
}

/** Map a row's PropertyValueDTO[] to { propertyName: value }. */
export function rowValuesByName(
  row: { values: PropertyValueDTO[] },
  properties: Array<{ id: string; name: string }>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const v of row.values) {
    const p = properties.find((pp) => pp.id === v.property_id);
    if (p) out[p.name] = v.value;
  }
  return out;
}

/** All values per property name across every row (for formula aggregations). */
export function allValuesByName(
  rows: Array<{ values: PropertyValueDTO[] }>,
  properties: Array<{ id: string; name: string }>,
): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const p of properties) out[p.name] = [];
  for (const row of rows) {
    for (const v of row.values) {
      const p = properties.find((pp) => pp.id === v.property_id);
      if (p) out[p.name].push(v.value);
    }
  }
  return out;
}

/** Tailwind color classes for select/multi_select/status option chips. */
export const OPTION_COLORS = [
  "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
];

/** Deterministic color for an option value (stable across renders). */
export function colorFor(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return OPTION_COLORS[h % OPTION_COLORS.length];
}
