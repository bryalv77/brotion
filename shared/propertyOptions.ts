import { collectDependencies } from "./formulas/index.js";

/** Formula source stored in a formula property's `options.formula`, or "" when absent. */
export function readFormulaSource(options: unknown): string {
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

/** Property names a formula reads; an unparseable formula has none (parse errors surface when it is evaluated). */
export function safeCollectDependencies(source: string): string[] {
  try {
    return collectDependencies(source);
  } catch {
    return [];
  }
}

/**
 * Normalize select/multi_select/status options into `{ options: [{ value, color? }] }`,
 * tolerating the legacy `string[]`. Other types pass through unchanged.
 */
export function normalizeSelectOptions(type: string, options: unknown): unknown {
  if (type !== "select" && type !== "multi_select" && type !== "status") return options;
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
