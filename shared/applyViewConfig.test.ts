import { test } from "node:test";
import assert from "node:assert/strict";
import { applyViewConfig, type ViewRow } from "./applyViewConfig.js";

const props = [
  { name: "Name", type: "text" },
  { name: "Price", type: "number" },
  { name: "Status", type: "select" },
  { name: "Tags", type: "multi_select" },
  { name: "Done", type: "checkbox" },
];

function row(page_id: string, valuesByName: Record<string, unknown>): ViewRow {
  return { page_id, valuesByName };
}

test("no config → returns rows unchanged", () => {
  const rows = [row("1", { Name: "A" }), row("2", { Name: "B" })];
  assert.equal(applyViewConfig(rows, props, null).length, 2);
  assert.equal(applyViewConfig(rows, props, { filters: [], sorts: [] }).length, 2);
});

test("text contains filter", () => {
  const rows = [
    row("1", { Name: "Apple" }),
    row("2", { Name: "Banana" }),
    row("3", { Name: "Apricot" }),
  ];
  const out = applyViewConfig(rows, props, {
    filters: [{ property: "Name", op: "contains", value: "Ap" }],
    sorts: [],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["1", "3"],
  );
});

test("number gt filter", () => {
  const rows = [
    row("1", { Price: 5 }),
    row("2", { Price: 15 }),
    row("3", { Price: 25 }),
  ];
  const out = applyViewConfig(rows, props, {
    filters: [{ property: "Price", op: "gt", value: 10 }],
    sorts: [],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["2", "3"],
  );
});

test("multi_select any_of filter", () => {
  const rows = [
    row("1", { Tags: ["red", "blue"] }),
    row("2", { Tags: ["green"] }),
    row("3", { Tags: [] }),
  ];
  const out = applyViewConfig(rows, props, {
    filters: [{ property: "Tags", op: "any_of", value: ["red"] }],
    sorts: [],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["1"],
  );
});

test("is_empty on select", () => {
  const rows = [
    row("1", { Status: "Todo" }),
    row("2", { Status: null }),
    row("3", {}),
  ];
  const out = applyViewConfig(rows, props, {
    filters: [{ property: "Status", op: "is_empty", value: null }],
    sorts: [],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["2", "3"],
  );
});

test("sort asc then desc (last sort is primary)", () => {
  const rows = [
    row("1", { Name: "A", Price: 10 }),
    row("2", { Name: "A", Price: 5 }),
    row("3", { Name: "B", Price: 1 }),
  ];
  // sorts applied right-to-left: Price asc primary, Name asc secondary.
  const out = applyViewConfig(rows, props, {
    filters: [],
    sorts: [
      { property: "Name", direction: "asc" },
      { property: "Price", direction: "asc" },
    ],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["2", "1", "3"],
  );
});

test("filter then sort combined", () => {
  const rows = [
    row("1", { Name: "A", Price: 10 }),
    row("2", { Name: "B", Price: 30 }),
    row("3", { Name: "C", Price: 20 }),
  ];
  const out = applyViewConfig(rows, props, {
    filters: [{ property: "Price", op: "gte", value: 15 }],
    sorts: [{ property: "Price", direction: "asc" }],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["3", "2"],
  );
});

test("uses computed value (formula/rollup) when present", () => {
  const rows: ViewRow[] = [
    { page_id: "1", valuesByName: { Price: 10 }, computedByName: { Total: { status: "ok", value: 100 } } },
    { page_id: "2", valuesByName: { Price: 5 }, computedByName: { Total: { status: "ok", value: 50 } } },
  ];
  const out = applyViewConfig(rows, [...props, { name: "Total", type: "number" }], {
    filters: [{ property: "Total", op: "gt", value: 60 }],
    sorts: [],
  });
  assert.deepEqual(
    out.map((r) => r.page_id),
    ["1"],
  );
});
