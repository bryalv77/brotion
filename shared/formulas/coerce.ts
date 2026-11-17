import { FormulaError } from "./errors.js";

/**
 * Coercion helpers. The rules in plan §4:
 *
 * - numeric context: null/empty → 0, numeric string → number, else type error.
 * - string context: null/num/bool/date → toString.
 * - bool context: null/0/"" → false, else true.
 *
 * `toNumber(v, stringOk=false)`: with `stringOk=true` we accept numeric
 * strings; without it, strings throw (used by `if` etc., which are not
 * numeric).
 */
export function toNumber(v: unknown, stringOk = false): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    if (v === "") return 0;
    if (stringOk) {
      const n = Number(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    }
  }
  throw new FormulaError(
    "type",
    `Expected a number, got ${describe(v)}`,
  );
}

export function toString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map((x) => toString(x)).join(",");
  return String(v);
}

export function toBool(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
  if (typeof v === "string") return v !== "";
  return true;
}

function describe(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}
