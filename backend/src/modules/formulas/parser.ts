import { FormulaParseError } from "./lexer.js";
import type { Token, TokenKind } from "./tokens.js";
import type { AstNode, BinaryOp } from "./ast.js";

/**
 * Recursive-descent parser. Operator precedence (low → high) per plan §4:
 *
 *   or          (left-assoc)
 *   and         (left-assoc)
 *   equality    == !=
 *   comparison  < <= > >=
 *   additive    + -
 *   multiplicative * / %
 *   unary       -
 *   primary
 */
export class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): AstNode {
    const node = this.parseOr();
    this.expect("eof");
    return node;
  }

  /** Collect the set of property names referenced anywhere in the AST. */
  static collectPropRefs(node: AstNode): string[] {
    const out: string[] = [];
    const walk = (n: AstNode): void => {
      switch (n.kind) {
        case "prop":
          out.push(n.name);
          return;
        case "call":
          for (const a of n.args) walk(a);
          return;
        case "unary":
          walk(n.operand);
          return;
        case "binary":
          walk(n.left);
          walk(n.right);
          return;
        case "number":
        case "string":
        case "bool":
        case "null":
          return;
      }
    };
    walk(node);
    return out;
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
      const op: BinaryOp = this.peek().kind === "eq" ? "==" : "!=";
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
      const map: Record<string, BinaryOp> = {
        lt: "<",
        lte: "<=",
        gt: ">",
        gte: ">=",
      };
      const op = map[this.peek().kind]!;
      this.advance();
      const right = this.parseAdditive();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseAdditive(): AstNode {
    let left = this.parseMultiplicative();
    while (this.peek().kind === "plus" || this.peek().kind === "minus") {
      const op: BinaryOp = this.peek().kind === "plus" ? "+" : "-";
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
      const op: BinaryOp =
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
      // `not` is parsed as unary here for symmetry; evaluator turns it into
      // a `!logical(arg)` call so we can keep the AST minimal.
      this.advance();
      const operand = this.parseUnary();
      return {
        kind: "call",
        name: "not",
        args: [operand],
      };
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
      // `prop("Name")` — special form
      if (name === "prop") {
        this.expect("lparen");
        const arg = this.parseOr();
        // Must be a string literal.
        if (arg.kind !== "string") {
          throw new FormulaParseError(
            `prop() requires a string literal argument`,
            t.pos,
          );
        }
        this.expect("rparen");
        return { kind: "prop", name: arg.value };
      }
      // Generic function call.
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

    throw new FormulaParseError(
      `Unexpected token '${t.text || t.kind}'`,
      t.pos,
    );
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
      throw new FormulaParseError(
        `Expected ${kind} but got '${t.text || t.kind}'`,
        t.pos,
      );
    }
    return this.advance();
  }
}
