import { KEYWORDS, type Token, type TokenKind } from "./tokens.js";

/**
 * Hand-rolled lexer. No regex hacks — character-by-character is enough for
 * this grammar and keeps the error messages crisp.
 */
export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const c = src[i];

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    // Numbers: digits with optional decimal point. No exponent, no sign —
    // unary minus is handled at the parser level.
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

    // Strings: "…" with \" and \\ escapes.
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
      if (i >= n) {
        throw new FormulaParseError(`Unterminated string literal`, start);
      }
      i++; // consume closing "
      tokens.push({ kind: "string", text: value, pos: start });
      continue;
    }

    // Identifiers / keywords. Identifiers can contain letters, digits, _, -.
    if (isIdentStart(c)) {
      const start = i;
      while (i < n && isIdentCont(src[i])) i++;
      const text = src.slice(start, i);
      const lower = text.toLowerCase();
      const kw = KEYWORDS[lower];
      if (kw) {
        tokens.push({ kind: kw, text: lower, pos: start });
      } else {
        tokens.push({ kind: "ident", text, pos: start });
      }
      continue;
    }

    // Punctuation / operators.
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

    throw new FormulaParseError(`Unexpected character '${c}'`, pos);
  }

  tokens.push({ kind: "eof", text: "", pos: n });
  return tokens;
}

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}
function isIdentStart(c: string): boolean {
  return (
    (c >= "a" && c <= "z") ||
    (c >= "A" && c <= "Z") ||
    c === "_" ||
    c === "$"
  );
}
function isIdentCont(c: string): boolean {
  return isIdentStart(c) || isDigit(c) || c === "-";
}

export class FormulaParseError extends Error {
  constructor(message: string, public pos: number) {
    super(message);
    this.name = "FormulaParseError";
  }
}
