/**
 * Guards against silent key collisions. The factory (`page-templates.service.ts`)
 * resolves pages/databases/rows/blocks through one flat key→id map per
 * instantiation, but properties get their own map scoped per-database
 * (`${databaseKey}:${propertyKey}`) — every database conventionally wants a
 * property keyed "name" for its title column, so property keys only need to
 * be unique WITHIN their own database, not template-wide. A collision in
 * either namespace would silently misroute a relation/rollup/page_ref
 * reference. Also checks every template `id` is unique across the registry
 * (it doubles as the `:templateId` route param).
 *
 * Run via `yarn workspace backend test:unit`.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PAGE_TEMPLATES } from "./index.js";
import type { PageTemplateDefinition, TplBlockNode } from "./types.js";

function collectBlockKeys(nodes: TplBlockNode[], out: string[]): void {
  for (const node of nodes) {
    if (node.key) out.push(node.key);
    if (node.children) collectBlockKeys(node.children, out);
  }
}

/** Flat namespace: pages, databases, rows, and referenced blocks. */
function collectFlatKeys(tpl: PageTemplateDefinition): string[] {
  const keys: string[] = [];
  for (const p of tpl.pages) {
    keys.push(p.key);
    collectBlockKeys(p.blocks, keys);
  }
  for (const d of tpl.databases) {
    keys.push(d.key);
    for (const row of d.rows) {
      keys.push(row.key);
      if (row.body) collectBlockKeys(row.body, keys);
    }
  }
  return keys;
}

function findDupes(keys: string[]): string[] {
  return keys.filter((k, i) => keys.indexOf(k) !== i);
}

test("every template id is unique across the registry", () => {
  const ids = ALL_PAGE_TEMPLATES.map((t) => t.id);
  const dupes = findDupes(ids);
  assert.deepEqual(dupes, [], `duplicate template ids: ${dupes.join(", ")}`);
});

for (const tpl of ALL_PAGE_TEMPLATES) {
  test(`"${tpl.id}": every page/database/row/block TplKey is unique within the template`, () => {
    const dupes = findDupes(collectFlatKeys(tpl));
    assert.deepEqual(dupes, [], `duplicate keys in "${tpl.id}": ${dupes.join(", ")}`);
  });

  test(`"${tpl.id}": every property TplKey is unique within its own database`, () => {
    for (const d of tpl.databases) {
      const dupes = findDupes(d.properties.map((p) => p.key));
      assert.deepEqual(dupes, [], `duplicate property keys in "${tpl.id}" database "${d.key}": ${dupes.join(", ")}`);
    }
  });

  test(`"${tpl.id}": pages[0] is the root (parentKey === null)`, () => {
    assert.equal(tpl.pages[0]?.parentKey, null);
  });
}
