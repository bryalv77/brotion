import test from "node:test";
import assert from "node:assert/strict";
import { deriveSystemValue, isComputedType, isSystemType } from "./systemProps.js";

const row = { created_at: new Date("2024-01-01T00:00:00Z"), updated_at: "2024-02-01T00:00:00.000Z", created_by: "u1", last_updated_by: "u2" };

test("deriveSystemValue reads each system type off the row", () => {
  assert.equal(deriveSystemValue("created_time", row), "2024-01-01T00:00:00.000Z");
  assert.equal(deriveSystemValue("last_edited_time", row), "2024-02-01T00:00:00.000Z");
  assert.equal(deriveSystemValue("created_by", row), "u1");
  assert.equal(deriveSystemValue("last_edited_by", row), "u2");
});

test("computed types cover formula, rollup and system types only", () => {
  for (const t of ["formula", "rollup", "created_time", "last_edited_by"]) assert.ok(isComputedType(t), t);
  for (const t of ["text", "select", "relation"]) assert.ok(!isComputedType(t), t);
  assert.ok(isSystemType("created_by") && !isSystemType("rollup"));
});
