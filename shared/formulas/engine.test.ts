/**
 * Unit tests for the formula engine. Run via Node's built-in test runner:
 *
 *   yarn workspace backend test:unit    (added to package.json)
 *
 * which is `node --test --import tsx src/modules/formulas/engine.test.ts`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  collectDependencies,
  detectCycle,
  evaluateCell,
  evaluateRow,
} from "./engine.js";
import type { FormulaProperty } from "./engine.js";

const PROPS: FormulaProperty[] = [
  { id: "p1", name: "Price", type: "number" },
  { id: "p2", name: "Qty", type: "number" },
  { id: "p3", name: "Name", type: "text" },
  { id: "p4", name: "Active", type: "checkbox" },
  { id: "p5", name: "Total", type: "formula" },
  { id: "p6", name: "First", type: "text" },
  { id: "p7", name: "Last", type: "text" },
];

function row(values: Record<string, unknown>) {
  return { properties: PROPS, values };
}

// ── Parser basics ──────────────────────────────────────────────────────────

test("parse: arithmetic precedence", () => {
  // 1 + (2*3) = 7
  assert.equal(evaluateCell("1 + 2 * 3", row({})).value, 7);
  assert.equal(evaluateCell("(1 + 2) * 3", row({})).value, 9);
});

test("parse: unary minus", () => {
  assert.equal(evaluateCell("-5 + 10", row({})).value, 5);
});

test("parse: comparison", () => {
  assert.equal(evaluateCell("1 < 2", row({})).value, true);
  assert.equal(evaluateCell("2 <= 2", row({})).value, true);
  assert.equal(evaluateCell("3 == 3", row({})).value, true);
  assert.equal(evaluateCell("3 != 4", row({})).value, true);
});

test("parse: logical and/or/not", () => {
  assert.equal(evaluateCell("true and false", row({})).value, false);
  assert.equal(evaluateCell("true or false", row({})).value, true);
  assert.equal(evaluateCell("not true", row({})).value, false);
  assert.equal(evaluateCell("not (1 < 2)", row({})).value, false);
});

// ── Property references ────────────────────────────────────────────────────

test("prop: simple reference", () => {
  assert.equal(
    evaluateCell('prop("Price")', row({ Price: 10 })).value,
    10,
  );
});

test("prop: arithmetic across columns", () => {
  assert.equal(
    evaluateCell('prop("Price") * prop("Qty")', row({ Price: 10, Qty: 3 }))
      .value,
    30,
  );
});

test("prop: unknown property → unknown_property error", () => {
  const r = evaluateCell('prop("Nope")', row({}));
  assert.equal(r.status, "error");
  assert.equal(r.error?.code, "unknown_property");
  assert.match(r.error?.message ?? "", /Nope/);
});

// ── String handling ────────────────────────────────────────────────────────

test("strings: + concatenates when either side is a string", () => {
  assert.equal(
    evaluateCell('prop("First") + " " + prop("Last")', row({
      First: "Ada", Last: "Lovelace",
    })).value,
    "Ada Lovelace",
  );
});

test("strings: concat() with multiple args", () => {
  assert.equal(
    evaluateCell('concat("a", "b", "c")', row({})).value,
    "abc",
  );
});

test("strings: upper/lower/trim/length/contains", () => {
  assert.equal(evaluateCell('upper("abc")', row({})).value, "ABC");
  assert.equal(evaluateCell('lower("ABC")', row({})).value, "abc");
  assert.equal(evaluateCell('trim("  hi  ")', row({})).value, "hi");
  assert.equal(evaluateCell('length("hello")', row({})).value, 5);
  assert.equal(evaluateCell('contains("hello world", "world")', row({})).value, true);
});

// ── Numeric functions ──────────────────────────────────────────────────────

test("numeric: round/abs/min/max", () => {
  assert.equal(evaluateCell("round(3.14159, 2)", row({})).value, 3.14);
  assert.equal(evaluateCell("abs(-7)", row({})).value, 7);
  assert.equal(evaluateCell("min(3, 1, 2)", row({})).value, 1);
  assert.equal(evaluateCell("max(3, 1, 2)", row({})).value, 3);
});

test("numeric: sum/avg/count ignore nulls", () => {
  assert.equal(evaluateCell("sum(1, 2, null, 3)", row({})).value, 6);
  assert.equal(evaluateCell("avg(2, 4, 6)", row({})).value, 4);
  assert.equal(evaluateCell("count(1, null, 2, null, 3)", row({})).value, 3);
  assert.equal(evaluateCell("count(null, null)", row({})).value, 0);
});

// ── Boolean / branching ────────────────────────────────────────────────────

test("if: returns then/else branch", () => {
  assert.equal(
    evaluateCell('if(prop("Active"), "yes", "no")', row({ Active: true }))
      .value,
    "yes",
  );
  assert.equal(
    evaluateCell('if(prop("Active"), "yes", "no")', row({ Active: false }))
      .value,
    "no",
  );
});

// ── Error handling ─────────────────────────────────────────────────────────

test("errors: parse error on bad input", () => {
  const r = evaluateCell("1 +", row({}));
  assert.equal(r.status, "error");
  assert.equal(r.error?.code, "parse");
});

test("errors: division by zero", () => {
  const r = evaluateCell("1 / 0", row({}));
  assert.equal(r.status, "error");
  assert.equal(r.error?.code, "division_by_zero");
});

test("errors: type error on adding non-numeric", () => {
  // "hi" - 1 — only "+" allows string concat, so this throws type.
  const r = evaluateCell('"hi" - 1', row({}));
  assert.equal(r.status, "error");
  assert.equal(r.error?.code, "type");
});

test("errors: unknown function", () => {
  const r = evaluateCell("nope()", row({}));
  assert.equal(r.status, "error");
  assert.equal(r.error?.code, "type");
  assert.match(r.error?.message ?? "", /Unknown function/);
});

// ── Dependency collection ──────────────────────────────────────────────────

test("collectDependencies: deduplicates and follows calls", () => {
  const deps = collectDependencies('prop("Price") * prop("Qty") + prop("Price")');
  assert.deepEqual(deps.sort(), ["Price", "Qty"]);
});

// ── Cycle detection ────────────────────────────────────────────────────────

test("detectCycle: returns null for acyclic", () => {
  const r = detectCycle(
    "Total",
    ["Price", "Qty"],
    [{ name: "Discount", source: 'prop("Price") * 0.1' }],
  );
  assert.equal(r, null);
});

test("detectCycle: detects direct self-cycle", () => {
  const r = detectCycle("Total", ["Total"], []);
  assert.equal(r, "Total");
});

test("detectCycle: detects transitive cycle", () => {
  const r = detectCycle(
    "A",
    ["B"],
    [{ name: "B", source: 'prop("A")' }],
  );
  assert.equal(r, "A");
});

// ── evaluateRow ────────────────────────────────────────────────────────────

test("evaluateRow: computes multiple formula cells at once", () => {
  const out = evaluateRow(
    row({ Price: 10, Qty: 3, Name: "Widget" }),
    [
      { id: "p5", name: "Total", type: "formula", source: 'prop("Price") * prop("Qty")' },
    ],
  );
  assert.equal(out.p5?.status, "ok");
  assert.equal(out.p5?.value, 30);
});

// ── Aggregations across rows ──────────────────────────────────────────────

/** A row helper that also takes the all-rows view. */
function rowWithAll(
  values: Record<string, unknown>,
  allValues: Record<string, unknown[]>,
) {
  return { properties: PROPS, values, allValues };
}

test("aggregations: sum over a column of numbers", () => {
  // We're evaluating as the "first" row, with all 3 rows' Prices known.
  const r = evaluateCell('sum(prop("Price"))', rowWithAll(
    { Price: 10 },
    { Price: [10, 20, 30] },
  ));
  assert.equal(r.status, "ok");
  assert.equal(r.value, 60);
});

test("aggregations: avg over a column", () => {
  const r = evaluateCell('avg(prop("Price"))', rowWithAll(
    { Price: 10 },
    { Price: [10, 20, 30] },
  ));
  assert.equal(r.value, 20);
});

test("aggregations: min / max over a column", () => {
  assert.equal(
    evaluateCell('min(prop("Price"))', rowWithAll({ Price: 10 }, { Price: [5, 10, 15] })).value,
    5,
  );
  assert.equal(
    evaluateCell('max(prop("Price"))', rowWithAll({ Price: 10 }, { Price: [5, 10, 15] })).value,
    15,
  );
});

test("aggregations: count ignores nulls", () => {
  // Two of three Prices are non-null.
  const r = evaluateCell('count(prop("Price"))', rowWithAll(
    { Price: 10 },
    { Price: [10, null, 20, undefined] },
  ));
  assert.equal(r.value, 2);
});

test("aggregations: sum ignores nulls and coerces numeric strings", () => {
  const r = evaluateCell('sum(prop("Price"))', rowWithAll(
    { Price: "10" },
    { Price: ["10", null, 20, "", "5"] },
  ));
  assert.equal(r.value, 35);
});

test("aggregations: sum of an empty list is 0", () => {
  const r = evaluateCell('sum(prop("Price"))', rowWithAll(
    { Price: 10 },
    { Price: [null, undefined] },
  ));
  assert.equal(r.value, 0);
});

test("aggregations: avg of an empty list is 0", () => {
  const r = evaluateCell('avg(prop("Price"))', rowWithAll(
    { Price: 10 },
    { Price: [] },
  ));
  assert.equal(r.value, 0);
});

test("aggregations: min/max of an empty list is null", () => {
  assert.equal(
    evaluateCell('min(prop("Price"))', rowWithAll({ Price: 1 }, { Price: [] })).value,
    null,
  );
  assert.equal(
    evaluateCell('max(prop("Price"))', rowWithAll({ Price: 1 }, { Price: [] })).value,
    null,
  );
});

test("aggregations: scalar args work too (sum(1, 2, 3) === 6)", () => {
  assert.equal(evaluateCell("sum(1, 2, 3)", row({})).value, 6);
});

test("aggregations: scalar functions take the current row's value of prop()", () => {
  // upper() is a scalar function → prop("Name") is the current row's value.
  const r = evaluateCell('upper(prop("Name"))', rowWithAll(
    { Name: "ada" },
    { Name: ["ada", "grace"] },
  ));
  assert.equal(r.status, "ok");
  assert.equal(r.value, "ADA");
});

test("aggregations: mixed scalar + list (sum(prop) + prop)", () => {
  // Total of Prices is 60; current row's Qty is 4 → 64.
  const r = evaluateCell(
    'sum(prop("Price")) + prop("Qty")',
    rowWithAll({ Price: 10, Qty: 4 }, { Price: [10, 20, 30] }),
  );
  assert.equal(r.value, 64);
});

test("aggregations: count of mixed list+scalar", () => {
  // list has 2 non-null, scalar is null → 2 total.
  const r = evaluateCell(
    'count(prop("Price"), null, 5)',
    rowWithAll({ Price: 1 }, { Price: [1, null, 2] }),
  );
  assert.equal(r.value, 3);
});

test("aggregations: works without allValues (treats as empty list)", () => {
  // No allValues provided → sum over an empty list → 0.
  const r = evaluateCell('sum(prop("Price"))', row({ Price: 10 }));
  assert.equal(r.value, 0);
});

test("aggregations: avg is sum/count of non-null", () => {
  const r = evaluateCell('avg(prop("Price"))', rowWithAll(
    { Price: 5 },
    { Price: [5, null, 15, null, 25] },
  ));
  // 3 non-null: 5+15+25 = 45 / 3 = 15
  assert.equal(r.value, 15);
});
