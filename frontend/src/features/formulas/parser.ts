/**
 * Client-side formula engine. Mirrors the backend grammar in
 * `backend/src/modules/formulas/` so the live preview in the formula bar
 * shows exactly what the server will compute.
 *
 * The two implementations are intentionally kept small and similar rather
 * than sharing code via a separate package — sharing would force a
 * workspace dependency from frontend → shared that the monorepo doesn't
 * currently have. If they drift, the e2e tests catch it.
 */

export type ComputedCellStatus = "ok" | "error";
export interface ComputedCell {
  status: ComputedCellStatus;
  value?: string | number | boolean | null;
  error?: {
    code: "parse" | "type" | "circular" | "unknown_property" | "division_by_zero";
    message: string;
  };
}

// ── AST ───────────────────────────────────────────────────────────────────

export type AstNode =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "null" }
  | { kind: "prop"; name: string }
  | { kind: "call"; name: string; args: AstNode[] }
  | { kind: "unary"; op: "-"; operand: AstNode }
  | {
      kind: "binary";
      op:
        | "+"
        | "-"
        | "*"
        | "/"
        | "%"
        | "=="
        | "!="
        | "<"
        | "<="
        | ">"
        | ">="
        | "and"
        | "or";
      left: AstNode;
      right: AstNode;
    };

// ── Errors ────────────────────────────────────────────────────────────────

export class FormulaError extends Error {
  constructor(
    public code:
      | "parse"
      | "type"
      | "circular"
      | "unknown_property"
      | "division_by_zero",
    message: string,
  ) {
    super(message);
    this.name = "FormulaError";
  }
}

// ── Lexer ─────────────────────────────────────────────────────────────────

type TokenKind =
  | "number"
  | "string"
  | "ident"
  | "true"
  | "false"
  | "null"
  | "and"
  | "or"
  | "not"
  | "lparen"
  | "rparen"
  | "comma"
  | "plus"
  | "minus"
  | "star"
  | "slash"
  | "percent"
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "eof";

interface Token {
  kind: TokenKind;
  text: string;
  pos: number;
}

const KEYWORDS: Record<string, TokenKind> = {
  true: "true",
  false: "false",
  null: "null",
  and: "and",
  or: "or",
  not: "not",
};

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (isDigit(c)) {
      const start = i;
      while (i < n && isDigit(src[i])) i++;
      if (src[i] === ".") {
        i++;
        while (i < n && isDigit(src[i])) i++;
      }
      tokens.push({ kind: "number", text: src.slice(start, i), pos: start });
      continue;
    }
    if (c === '"') {
      const start = i;
      i++;
      let value = "";
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\" && i + 1 < n) {
          const next = src[i + 1];
          if (next === "n") value += "\n";
          else if (next === "t") value += "\t";
          else if (next === "r") value += "\r";
          else if (next === "\\") value += "\\";
          else if (next === '"') value += '"';
          else value += next;
          i += 2;
        } else {
          value += src[i];
          i++;
        }
      }
      if (i >= n) throw new FormulaError("parse", "Unterminated string literal");
      i++;
      tokens.push({ kind: "string", text: value, pos: start });
      continue;
    }
    if (isIdentStart(c)) {
      const start = i;
      while (i < n && isIdentCont(src[i])) i++;
      const text = src.slice(start, i);
      const lower = text.toLowerCase();
      const kw = KEYWORDS[lower];
      tokens.push({ kind: kw ?? "ident", text: kw ? lower : text, pos: start });
      continue;
    }
    const pos = i;
    const two = src.slice(i, i + 2);
    if (two === "==") {
      tokens.push({ kind: "eq", text: two, pos });
      i += 2;
      continue;
    }
    if (two === "!=") {
      tokens.push({ kind: "neq", text: two, pos });
      i += 2;
      continue;
    }
    if (two === "<=") {
      tokens.push({ kind: "lte", text: two, pos });
      i += 2;
      continue;
    }
    if (two === ">=") {
      tokens.push({ kind: "gte", text: two, pos });
      i += 2;
      continue;
    }
    const one: Record<string, TokenKind> = {
      "(": "lparen",
      ")": "rparen",
      ",": "comma",
      "+": "plus",
      "-": "minus",
      "*": "star",
      "/": "slash",
      "%": "percent",
      "<": "lt",
      ">": "gt",
    };
    const kind = one[c];
    if (kind) {
      tokens.push({ kind, text: c, pos });
      i++;
      continue;
    }
    throw new FormulaError("parse", `Unexpected character '${c}'`);
  }
  tokens.push({ kind: "eof", text: "", pos: n });
  return tokens;
}

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}
function isIdentStart(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_" || c === "$";
}
function isIdentCont(c: string): boolean {
  return isIdentStart(c) || isDigit(c) || c === "-";
}

// ── Parser ────────────────────────────────────────────────────────────────

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): AstNode {
    const node = this.parseOr();
    this.expect("eof");
    return node;
  }

  private parseOr(): AstNode {
    let left = this.parseAnd();
    while (this.peek().kind === "or") {
      this.advance();
      const right = this.parseAnd();
      left = { kind: "binary", op: "or", left, right };
    }
    return left;
  }
  private parseAnd(): AstNode {
    let left = this.parseEquality();
    while (this.peek().kind === "and") {
      this.advance();
      const right = this.parseEquality();
      left = { kind: "binary", op: "and", left, right };
    }
    return left;
  }
  private parseEquality(): AstNode {
    let left = this.parseComparison();
    while (this.peek().kind === "eq" || this.peek().kind === "neq") {
      const op = this.peek().kind === "eq" ? "==" : "!=";
      this.advance();
      const right = this.parseComparison();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }
  private parseComparison(): AstNode {
    let left = this.parseAdditive();
    while (
      this.peek().kind === "lt" ||
      this.peek().kind === "lte" ||
      this.peek().kind === "gt" ||
      this.peek().kind === "gte"
    ) {
      const op = this.peek().kind as "lt" | "lte" | "gt" | "gte";
      this.advance();
      const right = this.parseAdditive();
      const realOp = op === "lt" ? "<" : op === "lte" ? "<=" : op === "gt" ? ">" : ">=";
      left = { kind: "binary", op: realOp, left, right };
    }
    return left;
  }
  private parseAdditive(): AstNode {
    let left = this.parseMultiplicative();
    while (this.peek().kind === "plus" || this.peek().kind === "minus") {
      const op: "+" | "-" = this.peek().kind === "plus" ? "+" : "-";
      this.advance();
      const right = this.parseMultiplicative();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }
  private parseMultiplicative(): AstNode {
    let left = this.parseUnary();
    while (
      this.peek().kind === "star" ||
      this.peek().kind === "slash" ||
      this.peek().kind === "percent"
    ) {
      const op: "*" | "/" | "%" =
        this.peek().kind === "star"
          ? "*"
          : this.peek().kind === "slash"
            ? "/"
            : "%";
      this.advance();
      const right = this.parseUnary();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }
  private parseUnary(): AstNode {
    if (this.peek().kind === "minus") {
      this.advance();
      const operand = this.parseUnary();
      return { kind: "unary", op: "-", operand };
    }
    if (this.peek().kind === "not") {
      this.advance();
      const operand = this.parseUnary();
      return { kind: "call", name: "not", args: [operand] };
    }
    return this.parsePrimary();
  }
  private parsePrimary(): AstNode {
    const t = this.peek();
    if (t.kind === "number") {
      this.advance();
      return { kind: "number", value: Number(t.text) };
    }
    if (t.kind === "string") {
      this.advance();
      return { kind: "string", value: t.text };
    }
    if (t.kind === "true") {
      this.advance();
      return { kind: "bool", value: true };
    }
    if (t.kind === "false") {
      this.advance();
      return { kind: "bool", value: false };
    }
    if (t.kind === "null") {
      this.advance();
      return { kind: "null" };
    }
    if (t.kind === "lparen") {
      this.advance();
      const node = this.parseOr();
      this.expect("rparen");
      return node;
    }
    if (t.kind === "ident") {
      const name = t.text;
      this.advance();
      if (name === "prop") {
        this.expect("lparen");
        const arg = this.parseOr();
        if (arg.kind !== "string") {
          throw new FormulaError("parse", 'prop() requires a string literal');
        }
        this.expect("rparen");
        return { kind: "prop", name: arg.value };
      }
      this.expect("lparen");
      const args: AstNode[] = [];
      if (this.peek().kind !== "rparen") {
        args.push(this.parseOr());
        while (this.peek().kind === "comma") {
          this.advance();
          args.push(this.parseOr());
        }
      }
      this.expect("rparen");
      return { kind: "call", name: name.toLowerCase(), args };
    }
    throw new FormulaError("parse", `Unexpected token '${t.text || t.kind}'`);
  }
  private peek(): Token {
    return this.tokens[this.pos];
  }
  private advance(): Token {
    return this.tokens[this.pos++];
  }
  private expect(kind: TokenKind): Token {
    const t = this.peek();
    if (t.kind !== kind) {
      throw new FormulaError("parse", `Expected ${kind} but got '${t.text || t.kind}'`);
    }
    return this.advance();
  }
}

// ── Functions ─────────────────────────────────────────────────────────────

type FnResult = string | number | boolean | null;

type FormulaArg =
  | { kind: "scalar"; value: FnResult }
  | { kind: "list"; values: unknown[] };

type FormulaFn = (args: FormulaArg[]) => FnResult;

const flatten = (args: FormulaArg[]): unknown[] => {
  const out: unknown[] = [];
  for (const a of args) {
    if (a.kind === "list") {
      for (const v of a.values) out.push(v);
    } else {
      out.push(a.value);
    }
  }
  return out;
};

const nonNull = (values: unknown[]): unknown[] =>
  values.filter((v) => v !== null && v !== undefined);

const requireScalar = (
  name: string,
  arg: FormulaArg,
  idx: number,
): FnResult => {
  if (arg.kind !== "scalar") {
    throw new FormulaError(
      "type",
      `${name}() argument #${idx + 1} is a column reference; expected a single value`,
    );
  }
  return arg.value;
};

const requireArgs = (name: string, args: FormulaArg[], min: number, max: number): void => {
  if (args.length < min || args.length > max) {
    throw new FormulaError(
      "type",
      `${name}() expects ${min === max ? min : `${min}–${max}`} argument(s), got ${args.length}`,
    );
  }
};

const toNumber = (v: unknown, stringOk = false): number => {
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
  throw new FormulaError("type", "Expected a number");
};
const toString = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(toString).join(",");
  return String(v);
};
const toBool = (v: unknown): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
  if (typeof v === "string") return v !== "";
  return true;
};

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
  now: () => new Date().toISOString(),
  not: (args) => {
    requireArgs("not", args, 1, 1);
    return !toBool(requireScalar("not", args[0], 0));
  },
};

// ── Evaluator ─────────────────────────────────────────────────────────────

interface EvalContext {
  getProp: (name: string) => unknown;
  getAllProps: (name: string) => unknown[];
  visit?: (name: string) => boolean;
}

function evalBinary(
  op: string,
  lv: unknown,
  rv: unknown,
): FnResult {
  switch (op) {
    case "+":
      if (typeof lv === "string" || typeof rv === "string") {
        return toString(lv) + toString(rv);
      }
      return toNumber(lv, true) + toNumber(rv, true);
    case "-":
      return toNumber(lv, true) - toNumber(rv, true);
    case "*":
      return toNumber(lv, true) * toNumber(rv, true);
    case "/": {
      const rhs = toNumber(rv, true);
      if (rhs === 0) throw new FormulaError("division_by_zero", "Division by zero");
      return toNumber(lv, true) / rhs;
    }
    case "%": {
      const rhs = toNumber(rv, true);
      if (rhs === 0) throw new FormulaError("division_by_zero", "Division by zero");
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
  throw new FormulaError("type", `Unknown operator ${op}`);
}

function looseEq(a: unknown, b: unknown): boolean {
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a === "number" && typeof b === "number") return a === b;
  return toString(a) === toString(b);
}

function cmp(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = toString(a);
  const sb = toString(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

const AGGREGATION_FUNCTIONS = new Set(["sum", "avg", "min", "max", "count"]);

function evaluate(node: AstNode, ctx: EvalContext): FnResult {
  switch (node.kind) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "bool":
      return node.value;
    case "null":
      return null;
    case "prop":
      if (ctx.visit?.(node.name)) {
        throw new FormulaError("circular", `Circular reference to "${node.name}"`);
      }
      return ctx.getProp(node.name) as FnResult;
    case "call": {
      const fn = FUNCTIONS[node.name];
      if (!fn) throw new FormulaError("type", `Unknown function: ${node.name}()`);
      const asList = AGGREGATION_FUNCTIONS.has(node.name);
      const args = node.args.map((a) => evalArg(a, ctx, asList));
      return fn(args);
    }
    case "unary":
      return -toNumber(evaluate(node.operand, ctx), true);
    case "binary":
      return evalBinary(
        node.op,
        evaluate(node.left, ctx),
        evaluate(node.right, ctx),
      );
  }
}

function evalArg(node: AstNode, ctx: EvalContext, asList: boolean): FormulaArg {
  if (asList && node.kind === "prop") {
    if (ctx.visit?.(node.name)) {
      throw new FormulaError("circular", `Circular reference to "${node.name}"`);
    }
    return { kind: "list", values: ctx.getAllProps(node.name) };
  }
  return { kind: "scalar", value: evaluate(node, ctx) };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Evaluate a formula string against a row's values.
 *
 * Used for the live preview in the formula bar — never trusted for
 * persistence; the server is the source of truth.
 *
 * `allValues` is the per-column view of all rows in the same database.
 * Aggregation functions (sum/avg/min/max/count) iterate over it; if it
 * is missing, aggregations treat their `prop()` arg as an empty list.
 */
export function evaluateFormula(
  source: string,
  values: Record<string, unknown>,
  allValues?: Record<string, unknown[]>,
): ComputedCell {
  const trimmed = source.trim();
  if (trimmed === "") {
    return { status: "error", error: { code: "parse", message: "Empty formula" } };
  }
  let ast: AstNode;
  try {
    ast = new Parser(tokenize(trimmed)).parse();
  } catch (e) {
    if (e instanceof FormulaError) {
      return { status: "error", error: { code: e.code, message: e.message } };
    }
    return {
      status: "error",
      error: { code: "parse", message: (e as Error).message },
    };
  }
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
      if (!(name in values)) {
        throw new FormulaError("unknown_property", `Unknown property: "${name}"`);
      }
      return values[name] ?? null;
    },
    getAllProps: (name) => {
      if (!(name in values) && !(name in (allValues ?? {}))) {
        throw new FormulaError("unknown_property", `Unknown property: "${name}"`);
      }
      return allValues?.[name] ?? [];
    },
    visit,
  };
  try {
    return { status: "ok", value: evaluate(ast, ctx) };
  } catch (e) {
    if (e instanceof FormulaError) {
      return { status: "error", error: { code: e.code, message: e.message } };
    }
    return {
      status: "error",
      error: { code: "parse", message: (e as Error).message },
    };
  }
}
