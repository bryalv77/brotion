/**
 * Formula engine barrel. Pure TypeScript — no runtime dependencies — so it
 * can run on the Hono server (Node and Workers), and in the
 * client (local/guest databases compute `computed` cells with the exact
 * same code the backend uses).
 */
export {
  FormulaError,
  parseProperty,
  collectDependencies,
  evaluateCell,
  evaluateRow,
  evaluateCellCached,
  detectCycle,
  clearFormulaCache,
} from "./engine.js";
export type {
  FormulaErrorCode,
  FormulaProperty,
  RowValuesByName,
  AllValuesByName,
  EvalRowInput,
} from "./engine.js";
export { FormulaParseError } from "./lexer.js";
