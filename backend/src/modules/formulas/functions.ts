import { FormulaError } from "./engine.js";
import { toBool, toNumber, toString } from "./evaluator.js";

/**
 * Built-in function library for the formula engine.
 *
 * Functions are pure: (args, ctx) => result-or-throw. Throwing an
 * `Error` is treated by the evaluator as a `type` error with the message
 * preserved; numeric functions throw `division_by_zero` for /0 and %0.
 *
 * `args` is a list of `FormulaArg` — each arg is either a scalar (one
 * value, evaluated against the current row) or a list (the values of a
 * `prop("X")` across ALL rows, used by aggregation functions).
 *
 * Convention:
 * - The 5 aggregation functions (`sum`, `avg`, `min`, `max`, `count`)
 *   flatten their args (singleton + list) and ignore nulls.
 * - All other functions only accept scalar args; passing a list throws a
 *   `type` error.
 */

export interface FnContext {
  /** Used by `now()`. */
  now(): Date;
}

export type FnResult = string | number | boolean | null;

export type FormulaArg =
  | { kind: "scalar"; value: FnResult }
  | { kind: "list"; values: unknown[] };

export type FormulaFn = (
  args: FormulaArg[],
  ctx: FnContext,
) => FnResult;

// ── Helpers ────────────────────────────────────────────────────────────────

function flatten(args: FormulaArg[]): unknown[] {
  const out: unknown[] = [];
  for (const a of args) {
    if (a.kind === "list") {
      for (const v of a.values) out.push(v);
    } else {
      out.push(a.value);
    }
  }
  return out;
}

function nonNull(values: unknown[]): unknown[] {
  return values.filter((v) => v !== null && v !== undefined);
}

function requireScalar(name: string, arg: FormulaArg, idx: number): FnResult {
  if (arg.kind !== "scalar") {
    throw new FormulaError(
      "type",
      `${name}() argument #${idx + 1} is a column reference; expected a single value`,
    );
  }
  return arg.value;
}

function requireArgs(
  name: string,
  args: FormulaArg[],
  min: number,
  max: number,
): void {
  if (args.length < min || args.length > max) {
    throw new FormulaError(
      "type",
      `${name}() expects ${min === max ? min : `${min}–${max}`} argument(s), got ${args.length}`,
    );
  }
}

// ── Function table ─────────────────────────────────────────────────────────

const FUNCTIONS: Record<string, FormulaFn> = {
  if: (args) => {
    requireArgs("if", args, 3, 3);
    return toBool(requireScalar("if", args[0], 0))
      ? requireScalar("if", args[1], 1)
      : requireScalar("if", args[2], 2);
  },

  concat: (args) => {
    requireArgs("concat", args, 1, Infinity);
    return args.map((a, i) => toString(requireScalar("concat", a, i))).join("");
  },

  contains: (args) => {
    requireArgs("contains", args, 2, 2);
    return toString(requireScalar("contains", args[0], 0)).includes(
      toString(requireScalar("contains", args[1], 1)),
    );
  },

  length: (args) => {
    requireArgs("length", args, 1, 1);
    return toString(requireScalar("length", args[0], 0)).length;
  },

  upper: (args) => {
    requireArgs("upper", args, 1, 1);
    return toString(requireScalar("upper", args[0], 0)).toUpperCase();
  },

  lower: (args) => {
    requireArgs("lower", args, 1, 1);
    return toString(requireScalar("lower", args[0], 0)).toLowerCase();
  },

  trim: (args) => {
    requireArgs("trim", args, 1, 1);
    return toString(requireScalar("trim", args[0], 0)).trim();
  },

  round: (args) => {
    requireArgs("round", args, 1, 2);
    const n = toNumber(requireScalar("round", args[0], 0), true);
    const d = args.length === 2 ? toNumber(requireScalar("round", args[1], 1), true) : 0;
    const m = Math.pow(10, d);
    return Math.round(n * m) / m;
  },

  abs: (args) => {
    requireArgs("abs", args, 1, 1);
    return Math.abs(toNumber(requireScalar("abs", args[0], 0), true));
  },

  // ── Aggregations: each flattens args, ignores nulls. ────────────────────

  sum: (args) => {
    requireArgs("sum", args, 0, Infinity);
    let total = 0;
    for (const v of nonNull(flatten(args))) total += toNumber(v, true);
    return total;
  },

  avg: (args) => {
    requireArgs("avg", args, 0, Infinity);
    const xs = nonNull(flatten(args));
    if (xs.length === 0) return 0;
    let total = 0;
    for (const v of xs) total += toNumber(v, true);
    return total / xs.length;
  },

  min: (args) => {
    requireArgs("min", args, 1, Infinity);
    const xs = nonNull(flatten(args));
    if (xs.length === 0) return null;
    return Math.min(...xs.map((v) => toNumber(v, true)));
  },

  max: (args) => {
    requireArgs("max", args, 1, Infinity);
    const xs = nonNull(flatten(args));
    if (xs.length === 0) return null;
    return Math.max(...xs.map((v) => toNumber(v, true)));
  },

  count: (args) => {
    requireArgs("count", args, 0, Infinity);
    return nonNull(flatten(args)).length;
  },

  now: (args, ctx) => {
    requireArgs("now", args, 0, 0);
    return ctx.now().toISOString();
  },

  not: (args) => {
    requireArgs("not", args, 1, 1);
    return !toBool(requireScalar("not", args[0], 0));
  },
};

export function lookupFunction(name: string): FormulaFn | undefined {
  return FUNCTIONS[name];
}

export function listFunctions(): string[] {
  return Object.keys(FUNCTIONS);
}
