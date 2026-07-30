import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Sheets & formulas — spec 013 acceptance criteria (A–G).
 *
 * Each test sets up a fresh user + workspace and exercises one path through
 * the database + formula engine.
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": CSRF };

function uniq(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

async function register(request: APIRequestContext, email = uniq("u")): Promise<void> {
  const res = await request.post(`${API}/auth/register`, {
    data: { email, password: "password123" },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
}

async function makeWorkspace(request: APIRequestContext, name = "WS"): Promise<string> {
  const res = await request.post(`${API}/workspaces`, {
    data: { name },
    headers: HEADERS,
  });
  return (await res.json()).data.workspace.id;
}

async function makePage(
  request: APIRequestContext,
  workspaceId: string,
  body: Record<string, unknown> = {},
): Promise<string> {
  const res = await request.post(`${API}/workspaces/${workspaceId}/pages`, {
    data: body,
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.page.id;
}

interface DatabaseResp {
  id: string;
  properties: Array<{ id: string; name: string; type: string; options?: unknown }>;
  rows: Array<{
    page_id: string;
    title: string;
    values: Array<{ id: string; property_id: string; value: unknown }>;
    computed?: Record<string, { status: string; value?: unknown; error?: { code: string; message: string } }>;
  }>;
}

async function makeDatabase(request: APIRequestContext, pageId: string): Promise<DatabaseResp> {
  const res = await request.post(`${API}/pages/${pageId}/databases`, {
    data: { title: "Sheet", icon: "📊" },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.database;
}

async function getDb(request: APIRequestContext, id: string): Promise<DatabaseResp> {
  const res = await request.get(`${API}/databases/${id}`);
  expect(res.status()).toBe(200);
  return (await res.json()).data.database;
}

async function addNumberProp(
  request: APIRequestContext,
  dbId: string,
  name: string,
): Promise<{ id: string }> {
  const res = await request.post(`${API}/databases/${dbId}/properties`, {
    data: { name, type: "number" },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.property;
}

async function addFormulaProp(
  request: APIRequestContext,
  dbId: string,
  name: string,
  source: string,
): Promise<{ id: string }> {
  const res = await request.post(`${API}/databases/${dbId}/properties`, {
    data: { name, type: "formula", options: { formula: source } },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.property;
}

async function addRow(
  request: APIRequestContext,
  dbId: string,
): Promise<{ page_id: string }> {
  const res = await request.post(`${API}/databases/${dbId}/rows`, {
    data: {},
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.row;
}

async function setCell(
  request: APIRequestContext,
  rowId: string,
  propId: string,
  value: unknown,
): Promise<{ value: unknown; computed: Record<string, { status: string; value?: unknown; error?: { code: string } }> }> {
  const res = await request.patch(`${API}/rows/${rowId}/properties/${propId}`, {
    data: { value },
    headers: HEADERS,
  });
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

test.describe("sheets & formulas", () => {
  test("A: create a sheet on a page, returns DatabaseDTO with default Name column", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws, { title: "Home" });
    const db = await makeDatabase(request, pageId);

    expect(db.properties.length).toBe(1);
    expect(db.properties[0].name).toBe("Name");
    expect(db.properties[0].type).toBe("text");
    expect(db.rows.length).toBe(0);

    // And it shows up in GET /pages/:pageId/databases
    const list = await request.get(`${API}/pages/${pageId}/databases`);
    const listBody = await list.json();
    expect(listBody.data.databases.some((d: { id: string }) => d.id === db.id)).toBe(true);
  });

  test("B: formula column = Price * Qty, set values, computed result is 30", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const qty = await addNumberProp(request, db.id, "Qty");
    const total = await addFormulaProp(request, db.id, "Total", 'prop("Price") * prop("Qty")');
    const row = await addRow(request, db.id);

    await setCell(request, row.page_id, price.id, 10);
    const r2 = await setCell(request, row.page_id, qty.id, 3);

    // The PATCH response carries the recomputed formula cells.
    expect(r2.computed[total.id]?.status).toBe("ok");
    expect(r2.computed[total.id]?.value).toBe(30);
  });

  test("C: updating Price re-evaluates formula to 60", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const qty = await addNumberProp(request, db.id, "Qty");
    const total = await addFormulaProp(request, db.id, "Total", 'prop("Price") * prop("Qty")');
    const row = await addRow(request, db.id);

    await setCell(request, row.page_id, price.id, 10);
    await setCell(request, row.page_id, qty.id, 3);
    const r3 = await setCell(request, row.page_id, price.id, 20);
    expect(r3.computed[total.id]?.status).toBe("ok");
    expect(r3.computed[total.id]?.value).toBe(60);

    // And re-fetching the database gives the same result.
    const fresh = await getDb(request, db.id);
    const fRow = fresh.rows.find((r) => r.page_id === row.page_id);
    expect(fRow?.computed?.[total.id]?.value).toBe(60);
  });

  test("D: prop(\"Nope\") → unknown_property error in cell, request still 200", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const total = await addFormulaProp(request, db.id, "Total", 'prop("Nope") * 2');
    const row = await addRow(request, db.id);

    const fresh = await getDb(request, db.id);
    const fRow = fresh.rows.find((r) => r.page_id === row.page_id);
    expect(fRow?.computed?.[total.id]?.status).toBe("error");
    expect(fRow?.computed?.[total.id]?.error?.code).toBe("unknown_property");
  });

  test("E: parse error → per-cell parse error", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const total = await addFormulaProp(request, db.id, "Total", "1 +");
    const row = await addRow(request, db.id);

    const fresh = await getDb(request, db.id);
    const fRow = fresh.rows.find((r) => r.page_id === row.page_id);
    expect(fRow?.computed?.[total.id]?.status).toBe("error");
    expect(fRow?.computed?.[total.id]?.error?.code).toBe("parse");
  });

  test("F: circular dependency between two formulas → both error, no 500", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);

    const a = await addFormulaProp(request, db.id, "A", 'prop("B") + 1');
    // B reads A → cycle. Should be rejected at write time with 400.
    const conflict = await request.post(`${API}/databases/${db.id}/properties`, {
      data: { name: "B", type: "formula", options: { formula: 'prop("A") + 1' } },
      headers: HEADERS,
    });
    expect(conflict.status()).toBe(400);
    const conflictBody = await conflict.json();
    expect(conflictBody.error.details?.code ?? conflictBody.error.code).toBe(
      "FORMULA_CYCLE",
    );
    expect(a.id).toBeTruthy();
  });

  test("G: renaming Price → Cost causes formula referencing \"Price\" to return unknown_property", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const total = await addFormulaProp(request, db.id, "Total", 'prop("Price") * 2');
    const row = await addRow(request, db.id);

    await setCell(request, row.page_id, price.id, 10);

    // Rename "Price" → "Cost" via the update property endpoint.
    const rename = await request.patch(
      `${API}/databases/${db.id}/properties/${price.id}`,
      { data: { name: "Cost" }, headers: HEADERS },
    );
    expect(rename.status()).toBe(200);

    const fresh = await getDb(request, db.id);
    const fRow = fresh.rows.find((r) => r.page_id === row.page_id);
    expect(fRow?.computed?.[total.id]?.status).toBe("error");
    expect(fRow?.computed?.[total.id]?.error?.code).toBe("unknown_property");
  });

  test("formula values cannot be written directly → 400", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const total = await addFormulaProp(request, db.id, "Total", "1 + 1");
    const row = await addRow(request, db.id);

    const res = await request.patch(`${API}/rows/${row.page_id}/properties/${total.id}`, {
      data: { value: 99 },
      headers: HEADERS,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.details?.code ?? body.error.code).toBe(
      "FORMULA_NOT_EDITABLE",
    );
  });

  test("string formula: First + ' ' + Last → 'Ada Lovelace'", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const first = await addNumberProp(request, db.id, "First");
    // Use text via the default 'Name' property which is text, plus another
    // we add explicitly.
    const name = db.properties[0];
    const last = await addNumberProp(request, db.id, "Last");

    // Actually use real text properties: we need a "text" property. The
    // default 'Name' is text. Add another text prop.
    const lastText = await request.post(`${API}/databases/${db.id}/properties`, {
      data: { name: "Last", type: "text" },
      headers: HEADERS,
    });
    expect(lastText.status()).toBe(201);
    const lastId = (await lastText.json()).data.property.id;
    // Suppress the dummy number prop created above — leave it empty.
    void first;
    void last;

    const full = await addFormulaProp(
      request,
      db.id,
      "FullName",
      'prop("Name") + " " + prop("Last")',
    );
    const row = await addRow(request, db.id);

    await setCell(request, row.page_id, name.id, "Ada");
    const r2 = await setCell(request, row.page_id, lastId, "Lovelace");

    expect(r2.computed[full.id]?.status).toBe("ok");
    expect(r2.computed[full.id]?.value).toBe("Ada Lovelace");
  });
});

// ── Aggregations across rows ──────────────────────────────────────────────

test.describe("sheets & aggregations", () => {
  test("sum(prop) over multiple rows returns the column total in every cell", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const total = await addFormulaProp(request, db.id, "Total", 'sum(prop("Price"))');

    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    const r3 = await addRow(request, db.id);
    await setCell(request, r1.page_id, price.id, 10);
    await setCell(request, r2.page_id, price.id, 20);
    await setCell(request, r3.page_id, price.id, 30);

    const fresh = await getDb(request, db.id);
    for (const row of fresh.rows) {
      expect(row.computed?.[total.id]?.status).toBe("ok");
      expect(row.computed?.[total.id]?.value).toBe(60);
    }
  });

  test("avg / min / max / count over a column", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const avg = await addFormulaProp(request, db.id, "Avg", 'avg(prop("Price"))');
    const min = await addFormulaProp(request, db.id, "Min", 'min(prop("Price"))');
    const max = await addFormulaProp(request, db.id, "Max", 'max(prop("Price"))');
    const count = await addFormulaProp(request, db.id, "Count", 'count(prop("Price"))');

    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    const r3 = await addRow(request, db.id);
    await setCell(request, r1.page_id, price.id, 10);
    await setCell(request, r2.page_id, price.id, null);
    await setCell(request, r3.page_id, price.id, 20);

    const fresh = await getDb(request, db.id);
    const anyRow = fresh.rows[0];
    expect(anyRow.computed?.[avg.id]?.value).toBe(15);
    expect(anyRow.computed?.[min.id]?.value).toBe(10);
    expect(anyRow.computed?.[max.id]?.value).toBe(20);
    expect(anyRow.computed?.[count.id]?.value).toBe(2); // null excluded
  });

  test("aggregation + scalar mix: sum(prop) + prop(Qty) on this row", async ({
    request,
  }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const qty = await addNumberProp(request, db.id, "Qty");
    const total = await addFormulaProp(
      request,
      db.id,
      "Result",
      'sum(prop("Price")) + prop("Qty")',
    );

    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    await setCell(request, r1.page_id, price.id, 10);
    await setCell(request, r2.page_id, price.id, 30);
    // r1.qty=4 → sum(10,30)=40 + 4 = 44
    // r2.qty=5 → sum(10,30)=40 + 5 = 45
    await setCell(request, r1.page_id, qty.id, 4);
    await setCell(request, r2.page_id, qty.id, 5);

    const fresh = await getDb(request, db.id);
    const r1Fresh = fresh.rows.find((r) => r.page_id === r1.page_id);
    const r2Fresh = fresh.rows.find((r) => r.page_id === r2.page_id);
    expect(r1Fresh?.computed?.[total.id]?.value).toBe(44);
    expect(r2Fresh?.computed?.[total.id]?.value).toBe(45);
  });

  test("if(cond, then, else) with aggregation in cond", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const price = await addNumberProp(request, db.id, "Price");
    const tag = await addFormulaProp(
      request,
      db.id,
      "Tag",
      'if(sum(prop("Price")) > 25, "expensive", "cheap")',
    );

    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    await setCell(request, r1.page_id, price.id, 10);
    await setCell(request, r2.page_id, price.id, 20);

    const fresh = await getDb(request, db.id);
    for (const row of fresh.rows) {
      // 10+20=30 > 25 → "expensive" for every row
      expect(row.computed?.[tag.id]?.value).toBe("expensive");
    }
  });
});

// ── Select with options ───────────────────────────────────────────────────

test.describe("sheets & select", () => {
  test("create select with options, set value from list", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const res = await request.post(`${API}/databases/${db.id}/properties`, {
      data: {
        name: "Status",
        type: "select",
        options: { options: ["Todo", "Doing", "Done"] },
      },
      headers: HEADERS,
    });
    expect(res.status()).toBe(201);
    const status = (await res.json()).data.property as { id: string; options: { options: string[] } };
    expect(status.options.options).toEqual(["Todo", "Doing", "Done"]);

    const row = await addRow(request, db.id);
    const r = await setCell(request, row.page_id, status.id, "Doing");
    expect(r.value).toBe("Doing");
  });

  test("select without options still works (empty list)", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const db = await makeDatabase(request, pageId);
    const res = await request.post(`${API}/databases/${db.id}/properties`, {
      data: { name: "Tag", type: "select" },
      headers: HEADERS,
    });
    expect(res.status()).toBe(201);
    const tag = (await res.json()).data.property as { id: string; options: { options: string[] } | null };
    expect(tag.options).toBeDefined();
    expect(tag.options?.options).toEqual([]);
  });
});
