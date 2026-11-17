/**
 * Lexer tokens for the formula expression language.
 */

export type TokenKind =
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

export interface Token {
  kind: TokenKind;
  /** The raw text of the token (useful for number/ident/string). */
  text: string;
  /** 0-based offset in the source. */
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

export { KEYWORDS };
