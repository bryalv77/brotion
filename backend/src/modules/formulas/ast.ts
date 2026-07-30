/**
 * AST node types for the formula expression language.
 *
 * The grammar is small and intentionally hand-rolled (see plan §4). Every node
 * is plain data; the evaluator (evaluator.ts) is a pure function over an AST
 * + a value context.
 */

export type AstNode =
  | NumberLit
  | StringLit
  | BoolLit
  | NullLit
  | PropRef
  | Call
  | Unary
  | Binary;

export interface NumberLit {
  kind: "number";
  value: number;
}
export interface StringLit {
  kind: "string";
  value: string;
}
export interface BoolLit {
  kind: "bool";
  value: boolean;
}
export interface NullLit {
  kind: "null";
}
/** `prop("Name")` — reads another property of the same row. */
export interface PropRef {
  kind: "prop";
  name: string;
}
/** `name(arg1, arg2, …)` — function call. */
export interface Call {
  kind: "call";
  name: string;
  args: AstNode[];
}
/** `-x` */
export interface Unary {
  kind: "unary";
  op: "-";
  operand: AstNode;
}
/** `a op b` — `op` is one of the binary operators. */
export interface Binary {
  kind: "binary";
  op: BinaryOp;
  left: AstNode;
  right: AstNode;
}

export type BinaryOp =
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
