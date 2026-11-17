import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOrder } from "./order.js";
import { aggregateRollup } from "./rollup.js";
import { extractText } from "./blockText.js";

test("computeOrder places between, before, after and appends", () => {
  const a = { id: "a", order: 1 };
  const b = { id: "b", order: 2 };
  assert.equal(computeOrder(b, a), 1.5);
  assert.equal(computeOrder(a, null), 0.5);
  assert.equal(computeOrder(null, b), 3);
  assert.equal(computeOrder(null, null, [a, b]), 3);
  assert.throws(() => computeOrder(a, b));
});

test("aggregateRollup handles empty and non-numeric input", () => {
  assert.deepEqual(aggregateRollup("sum", ["x", 2, 3]), { status: "ok", value: 5 });
  assert.deepEqual(aggregateRollup("avg", []), { status: "ok", value: null });
  assert.equal(aggregateRollup("nope", []).status, "error");
});

test("extractText reads rich text, code text and table cells", () => {
  assert.equal(extractText({ rich_text: [{ text: "a" }, { text: "b" }] }), "a b");
  assert.equal(extractText({ text: "code" }), "code");
  assert.equal(extractText({ cells: [[{ text: "x" }], [{ text: "y" }]] }), "x y");
});
