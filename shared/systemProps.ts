/** Property types derived from the row page; they have no stored value and cannot be written. */
export const SYSTEM_PROPERTY_TYPES = [
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
] as const;

export type SystemPropertyType = (typeof SYSTEM_PROPERTY_TYPES)[number];

export const isSystemType = (type: string): type is SystemPropertyType =>
  (SYSTEM_PROPERTY_TYPES as readonly string[]).includes(type);

/** Types that cannot carry a stored value or template default: system types plus computed ones. */
export const isComputedType = (type: string): boolean =>
  type === "formula" || type === "rollup" || isSystemType(type);

export interface SystemPropertySource {
  created_at: Date | string;
  updated_at: Date | string;
  created_by: string;
  last_updated_by: string | null;
}

const iso = (v: Date | string): string => (v instanceof Date ? v.toISOString() : v);

export function deriveSystemValue(type: SystemPropertyType, row: SystemPropertySource): string | null {
  switch (type) {
    case "created_time":
      return iso(row.created_at);
    case "last_edited_time":
      return iso(row.updated_at);
    case "created_by":
      return row.created_by;
    case "last_edited_by":
      return row.last_updated_by;
  }
}
