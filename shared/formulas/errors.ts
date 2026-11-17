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
