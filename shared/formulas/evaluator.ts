import type { AstNode, BinaryOp } from "./ast.js";
import { FormulaError } from "./engine.js";
import { lookupFunction, type FnContext, type FnResult, type FormulaArg } from "./functions.js";

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

/**
 * Evaluate an AST against a value context.
 *
 * The context supplies:
 * - `getProp(name)`: the value of a property on the CURRENT row, or `null`
 *   if it doesn't exist.
 * - `getAllProps(name)`: the values of a property across ALL rows (used by
 *   aggregation functions when their arg is a `prop("X")`).
 * - `visit(name)`: optional, used for cycle detection at eval time. If
 *   `visit` returns true, the caller is already evaluating `name` — we
 *   throw `circular` to break the loop.
 */
export interface EvalContext {
  getProp(name: string): unknown;
  getAllProps(name: string): unknown[];
  visit?(name: string): boolean;
  fn: FnContext;
}

export function evaluate(node: AstNode, ctx: EvalContext): FnResult {
  switch (node.kind) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "bool":
      return node.value;
    case "null":
      return null;
    case "prop": {
      if (ctx.visit?.(node.name)) {
        throw new FormulaError("circular", `Circular reference to "${node.name}"`);
      }
      return ctx.getProp(node.name) as FnResult;
    }
    case "call": {
      const fn = lookupFunction(node.name);
      if (!fn) {
        throw new FormulaError("type", `Unknown function: ${node.name}()`);
      }
      // Aggregation functions treat `prop()` args as a column (all rows).
      // All other functions treat `prop()` as a scalar (current row).
      const asList = AGGREGATION_FUNCTIONS.has(node.name);
      const args = node.args.map((a) => evalArg(a, ctx, asList));
      return fn(args, ctx.fn);
    }
    case "unary":
      return -toNumber(evaluate(node.operand, ctx), true);
    case "binary":
      return evalBinary(node.op, node.left, node.right, ctx);
  }
}

/** Functions whose args are evaluated as lists (one entry per row). */
const AGGREGATION_FUNCTIONS = new Set(["sum", "avg", "min", "max", "count"]);

/**
 * Evaluate a function-call argument.
 *
 * - If the AST is a `prop()` node AND `asList` is true (i.e. we're an
 *   aggregation function), evaluate as a list across all rows.
 * - Otherwise, evaluate as a scalar against the current row.
 */
function evalArg(node: AstNode, ctx: EvalContext, asList: boolean): FormulaArg {
  if (asList && node.kind === "prop") {
    if (ctx.visit?.(node.name)) {
      throw new FormulaError("circular", `Circular reference to "${node.name}"`);
    }
    return { kind: "list", values: ctx.getAllProps(node.name) };
  }
  return { kind: "scalar", value: evaluate(node, ctx) };
}

function evalBinary(
  op: BinaryOp,
  l: AstNode,
  r: AstNode,
  ctx: EvalContext,
): FnResult {
  const lv = evaluate(l, ctx);
  const rv = evaluate(r, ctx);

  switch (op) {
    case "+": {
      // String concat if either side is a string.
      if (typeof lv === "string" || typeof rv === "string") {
        return toString(lv) + toString(rv);
      }
      return toNumber(lv, true) + toNumber(rv, true);
    }
    case "-":
      return toNumber(lv, true) - toNumber(rv, true);
    case "*":
      return toNumber(lv, true) * toNumber(rv, true);
    case "/": {
      const rhs = toNumber(rv, true);
      if (rhs === 0) {
        throw new FormulaError("division_by_zero", "Division by zero");
      }
      return toNumber(lv, true) / rhs;
    }
    case "%": {
      const rhs = toNumber(rv, true);
      if (rhs === 0) {
        throw new FormulaError("division_by_zero", "Division by zero");
      }
      return toNumber(lv, true) % rhs;
    }
    case "==":
      return looseEq(lv, rv);
    case "!=":
      return !looseEq(lv, rv);
    case "<":
      return cmp(lv, rv) < 0;
    case "<=":
      return cmp(lv, rv) <= 0;
    case ">":
      return cmp(lv, rv) > 0;
    case ">=":
      return cmp(lv, rv) >= 0;
    case "and":
      return toBool(lv) && toBool(rv);
    case "or":
      return toBool(lv) || toBool(rv);
  }
}

/**
 * Loose equality with null-safe semantics:
 * - null == null → true
 * - one side null, other not → false
 * - both numbers → numeric equality
 * - else → string coercion + equality
 */
function looseEq(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a === "number" && typeof b === "number") return a === b;
  return toString(a) === toString(b);
}

/**
 * Comparison: numbers numerically, everything else by string. nulls sort
 * before non-nulls (consistent with SQL NULLS FIRST in ascending order).
 */
function cmp(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = toString(a);
  const sb = toString(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}
