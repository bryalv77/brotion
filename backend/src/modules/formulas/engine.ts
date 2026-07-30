import type { ComputedCell } from "@notion-clone/shared";
import { tokenize } from "./lexer.js";
import { FormulaParseError } from "./lexer.js";
import { Parser } from "./parser.js";
import { evaluate, type EvalContext } from "./evaluator.js";
import type { AstNode } from "./ast.js";
import type { FnContext } from "./functions.js";

/** The error codes we expose on `ComputedCell.error.code`. */
export type FormulaErrorCode =
  | "parse"
  | "type"
  | "circular"
  | "unknown_property"
  | "division_by_zero";

export class FormulaError extends Error {
  constructor(
    public code: FormulaErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "FormulaError";
  }
}

/** Property metadata the engine needs to evaluate a row. */
export interface FormulaProperty {
  id: string;
  name: string;
  type: string;
}

/** A row's raw values, keyed by property name (display name, not id). */
export type RowValuesByName = Record<string, unknown>;

/**
 * All values for a property across every row in the database, keyed by
 * property name. Used by aggregation functions (sum/avg/min/max/count)
 * to iterate across the whole sheet without re-querying.
 */
export type AllValuesByName = Record<string, unknown[]>;

export interface EvalRowInput {
  /** All properties of the database. Used to look up names referenced by `prop("X")`. */
  properties: FormulaProperty[];
  /** Raw row values for the CURRENT row, keyed by property name. */
  values: RowValuesByName;
  /**
   * Optional all-rows view, keyed by property name. If absent, `prop("X")`
   * passed to an aggregation function will yield an empty list (i.e. the
   * aggregation over zero rows). The backend always passes this; the
   * frontend passes it when the live preview has full sheet context.
   */
  allValues?: AllValuesByName;
}

const nowCtx: FnContext = { now: () => new Date() };

/**
 * Parse a formula expression into an AST. Throws `FormulaParseError` on bad
 * input; throws `FormulaError` with code="parse" if the source is empty.
 */
export function parseProperty(source: string): AstNode {
  const trimmed = source.trim();
  if (trimmed === "") {
    throw new FormulaError("parse", "Empty formula");
  }
  const tokens = tokenize(trimmed);
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Collect the set of property names a formula expression depends on. Used
 * for write-time cycle detection.
 */
export function collectDependencies(source: string): string[] {
  const ast = parseProperty(source);
  return Array.from(new Set(Parser.collectPropRefs(ast)));
}

/**
 * Evaluate a single formula cell.
 *
 * @param source     formula source text
 * @param row        the row's properties + values (and optional allValues)
 * @param _selfId    (reserved) the id of the property holding this formula,
 *                   for richer error messages in a future iteration
 */
export function evaluateCell(
  source: string,
  row: EvalRowInput,
  _selfId?: string,
): ComputedCell {
  let ast: AstNode;
  try {
    ast = parseProperty(source);
  } catch (e) {
    if (e instanceof FormulaParseError || e instanceof FormulaError) {
      return { status: "error", error: { code: "parse", message: e.message } };
    }
    throw e;
  }

  // Build a name→property lookup.
  const byName = new Map<string, FormulaProperty>();
  for (const p of row.properties) byName.set(p.name, p);

  const visit = (() => {
    const seen = new Set<string>();
    return (name: string): boolean => {
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    };
  })();

  const ctx: EvalContext = {
    getProp: (name) => {
      const p = byName.get(name);
      if (!p) {
        throw new FormulaError(
          "unknown_property",
          `Unknown property: "${name}"`,
        );
      }
      return row.values[name] ?? null;
    },
    getAllProps: (name) => {
      if (!byName.has(name)) {
        throw new FormulaError(
          "unknown_property",
          `Unknown property: "${name}"`,
        );
      }
      return row.allValues?.[name] ?? [];
    },
    visit,
    fn: nowCtx,
  };

  try {
    const value = evaluate(ast, ctx);
    return { status: "ok", value };
  } catch (e) {
    if (e instanceof FormulaError) {
      return { status: "error", error: { code: e.code, message: e.message } };
    }
    throw e;
  }
}

/**
 * Evaluate all formula cells for a single row.
 *
 * @param row                 the row's properties + values (+ allValues)
 * @param formulaProperties   the subset of properties whose `type === "formula"`.
 *                            Each must have a value of `{ formula: string }`.
 */
export function evaluateRow(
  row: EvalRowInput,
  formulaProperties: Array<FormulaProperty & { source: string }>,
): Record<string, ComputedCell> {
  const out: Record<string, ComputedCell> = {};
  for (const fp of formulaProperties) {
    out[fp.id] = evaluateCell(fp.source, row, fp.id);
  }
  return out;
}

/**
 * Detect a cycle at write time. Returns `null` if adding `newSource`
 * (which depends on `newDeps`) would not create a cycle, or the name of
 * the first cycle property found.
 */
export function detectCycle(
  newPropName: string,
  newDeps: string[],
  existingFormulas: Array<{ name: string; source: string }>,
): string | null {
  const formulaNames = new Set(existingFormulas.map((f) => f.name));
  formulaNames.add(newPropName);

  const direct = new Map<string, string[]>();
  for (const f of existingFormulas) {
    try {
      direct.set(f.name, collectDependencies(f.source));
    } catch {
      direct.set(f.name, []);
    }
  }
  direct.set(newPropName, newDeps);

  const seen = new Set<string>();
  const stack = [newPropName];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (cur === newPropName && seen.has(cur)) {
      return cur;
    }
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const d of direct.get(cur) ?? []) {
      if (formulaNames.has(d)) stack.push(d);
    }
  }
  return null;
}

/**
 * Tiny LRU cache for `evaluateCell`. Keyed by a hash of:
 *   `${selfId} ${source} ${hashValues(row.values)} ${hashAllValues(allValues)}`
 * The all-values hash is critical for aggregations: without it, a write to
 * row A would leave row B's cached `sum(prop("Price"))` stale (its own
 * values didn't change, but the all-rows view did).
 */
class LRU<K, V> {
  private map = new Map<K, V>();
  constructor(private max: number) {}
  get(k: K): V | undefined {
    const v = this.map.get(k);
    if (v === undefined) return undefined;
    this.map.delete(k);
    this.map.set(k, v);
    return v;
  }
  set(k: K, v: V): void {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    if (this.map.size > this.max) {
      const first = this.map.keys().next().value;
      if (first !== undefined) this.map.delete(first);
    }
  }
}

const MAX_CACHE_ENTRIES = 5000;
const cellCache = new LRU<string, ComputedCell>(MAX_CACHE_ENTRIES);

/** Cheap, stable hash for a row's relevant values. */
function hashValues(values: RowValuesByName): string {
  const keys = Object.keys(values).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = values[k];
    parts.push(`${k}=${v === null || v === undefined ? "" : String(v)}`);
  }
  return parts.join("|");
}

/**
 * Cheap, stable hash of the all-rows view. Critical: this changes
 * whenever ANY row's value of a referenced property changes, so any
 * aggregation that depends on those properties gets re-evaluated.
 *
 * Uses a length-prefixed + value encoding so two arrays with the same
 * elements in different orders hash the same (semantic equality, not
 * positional). For 1000 rows × 5 properties this is well under 1 ms.
 */
function hashAllValues(allValues: AllValuesByName): string {
  const parts: string[] = [];
  for (const name of Object.keys(allValues).sort()) {
    const arr = allValues[name];
    if (!arr) continue;
    // Sort the values' stringification for order-insensitive hashing.
    const sorted = arr
      .map((v) => (v === null || v === undefined ? "" : String(v)))
      .sort();
    parts.push(`${name}=[${sorted.join(",")}]`);
  }
  return parts.join("|");
}

/** Cached single-cell eval. */
export function evaluateCellCached(
  source: string,
  row: EvalRowInput,
  selfId?: string,
): ComputedCell {
  const allHash = row.allValues ? hashAllValues(row.allValues) : "";
  const key = `${selfId ?? ""} ${source.trim()} ${hashValues(row.values)} ${allHash}`;
  const cached = cellCache.get(key);
  if (cached) return cached;
  const fresh = evaluateCell(source, row, selfId);
  cellCache.set(key, fresh);
  return fresh;
}

/** For tests: drop the entire cache. */
export function clearFormulaCache(): void {
  cellCache["map"].clear();
}
