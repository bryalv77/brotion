import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  API,
  HEADERS,
  makePage,
  makeWorkspace,
  register,
} from "./helpers.js";

/**
 * Databases v2 — spec 014 acceptance tests.
 *
 * Covers: row/column lifecycle + reorder, views (create/filter/sort), new
 * property types (multi_select, status, system), and relation/rollup. Built
 * incrementally per slice. Each test is isolated via fresh user + workspace.
 */

interface DbShape {
  id: string;
  properties: Array<{ id: string; name: string; type: string; order: number }>;
  rows: Array<{
    page_id: string;
    title: string;
    values: Array<{ id: string; property_id: string; value: unknown }>;
    computed?: Record<string, { status: string; value?: unknown; error?: { code: string; message: string } }>;
  }>;
  views: Array<{ id: string; name: string; type: string; order: number }>;
}

async function makeDatabase(request: APIRequestContext, pageId: string): Promise<DbShape> {
  const res = await request.post(`${API}/pages/${pageId}/databases`, {
    data: { title: "Db", icon: "📊" },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.database;
}

async function getDb(request: APIRequestContext, id: string): Promise<DbShape> {
  const res = await request.get(`${API}/databases/${id}`);
  expect(res.status()).toBe(200);
  return (await res.json()).data.database;
}

async function addProp(
  request: APIRequestContext,
  dbId: string,
  body: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await request.post(`${API}/databases/${dbId}/properties`, {
    data: body,
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.property;
}

async function addRow(request: APIRequestContext, dbId: string): Promise<{ page_id: string }> {
  const res = await request.post(`${API}/databases/${dbId}/rows`, { data: {}, headers: HEADERS });
  expect(res.status()).toBe(201);
  return (await res.json()).data.row;
}

// ── Slice 2: row & column lifecycle + reorder ───────────────────────────────

test.describe("databases v2 — lifecycle + reorder", () => {
  test("delete a column removes it and its values", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const extra = await addProp(request, db.id, { name: "Notes", type: "text" });

    const res = await request.delete(
      `${API}/databases/${db.id}/properties/${extra.id}`,
      { headers: HEADERS },
    );
    expect(res.status()).toBe(204);

    const after = await getDb(request, db.id);
    expect(after.properties.some((p) => p.id === extra.id)).toBe(false);
  });

  test("cannot delete the last property", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const onlyProp = db.properties[0];

    const res = await request.delete(
      `${API}/databases/${db.id}/properties/${onlyProp.id}`,
      { headers: HEADERS },
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.details?.code ?? body.error.code).toBe("LAST_PROPERTY");
  });

  test("move a column (reorder) via before_id", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    // Order is now: Name(0), B(1), C(2)
    const b = await addProp(request, db.id, { name: "B", type: "text" });
    const c = await addProp(request, db.id, { name: "C", type: "text" });

    // Move C to before B.
    const res = await request.post(
      `${API}/databases/${db.id}/properties/${c.id}/move`,
      { data: { before_id: b.id }, headers: HEADERS },
    );
    expect(res.status()).toBe(200);
    const names = (await res.json()).data.properties.map(
      (p: { name: string }) => p.name,
    );
    expect(names).toEqual(["Name", "C", "B"]);
  });

  test("delete a row removes it from the database", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const row = await addRow(request, db.id);

    const res = await request.delete(`${API}/rows/${row.page_id}`, { headers: HEADERS });
    expect(res.status()).toBe(204);

    const after = await getDb(request, db.id);
    expect(after.rows.some((r) => r.page_id === row.page_id)).toBe(false);
  });

  test("reorder a row via after_id", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    const r3 = await addRow(request, db.id);
    // Initial order: r1, r2, r3. Move r3 to after r1 → r1, r3, r2.
    const res = await request.post(
      `${API}/databases/${db.id}/rows/${r3.page_id}/move`,
      { data: { after_id: r1.page_id }, headers: HEADERS },
    );
    expect(res.status()).toBe(204);

    const after = await getDb(request, db.id);
    expect(after.rows.map((r) => r.page_id)).toEqual([r1.page_id, r3.page_id, r2.page_id]);
  });
});

// ── Slice 3: views + filters + sorts ────────────────────────────────────────

test.describe("databases v2 — views, filters, sorts", () => {
  test("a new database has one default Table view", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    expect(db.views.length).toBe(1);
    expect(db.views[0].type).toBe("table");
    expect(db.views[0].name).toBe("Table");
  });

  test("create a board view; list views grows", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);

    const res = await request.post(`${API}/databases/${db.id}/views`, {
      data: { name: "By Status", type: "board" },
      headers: HEADERS,
    });
    expect(res.status()).toBe(201);
    const view = (await res.json()).data.view;
    expect(view.type).toBe("board");

    const after = await getDb(request, db.id);
    expect(after.views.length).toBe(2);
    expect(after.views.map((v) => v.type)).toContain("board");
  });

  test("cannot delete the last view", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const onlyView = db.views[0];

    const res = await request.delete(
      `${API}/databases/${db.id}/views/${onlyView.id}`,
      { headers: HEADERS },
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.details?.code ?? body.error.code).toBe("LAST_VIEW");
  });

  test("view config filters rows via ?view_id", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const status = await addProp(request, db.id, {
      name: "Status",
      type: "select",
      options: { options: ["Todo", "Done"] },
    });
    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    await request.patch(`${API}/rows/${r1.page_id}/properties/${status.id}`, {
      data: { value: "Todo" },
      headers: HEADERS,
    });
    await request.patch(`${API}/rows/${r2.page_id}/properties/${status.id}`, {
      data: { value: "Done" },
      headers: HEADERS,
    });

    // Patch the default view to filter Status == Done.
    await request.patch(`${API}/databases/${db.id}/views/${db.views[0].id}`, {
      data: {
        config: {
          filters: [{ property: "Status", op: "eq", value: "Done" }],
          sorts: [],
        },
      },
      headers: HEADERS,
    });

    const res = await request.get(
      `${API}/databases/${db.id}?view_id=${db.views[0].id}`,
    );
    const body = (await res.json()).data.database;
    expect(body.rows.map((r: { page_id: string }) => r.page_id)).toEqual([
      r2.page_id,
    ]);
  });

  test("view config sorts rows via ?view_id", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const price = await addProp(request, db.id, { name: "Price", type: "number" });
    const r1 = await addRow(request, db.id);
    const r2 = await addRow(request, db.id);
    const r3 = await addRow(request, db.id);
    await request.patch(`${API}/rows/${r1.page_id}/properties/${price.id}`, { data: { value: 10 }, headers: HEADERS });
    await request.patch(`${API}/rows/${r2.page_id}/properties/${price.id}`, { data: { value: 30 }, headers: HEADERS });
    await request.patch(`${API}/rows/${r3.page_id}/properties/${price.id}`, { data: { value: 20 }, headers: HEADERS });

    await request.patch(`${API}/databases/${db.id}/views/${db.views[0].id}`, {
      data: {
        config: {
          filters: [],
          sorts: [{ property: "Price", direction: "desc" }],
        },
      },
      headers: HEADERS,
    });

    const res = await request.get(
      `${API}/databases/${db.id}?view_id=${db.views[0].id}`,
    );
    const body = (await res.json()).data.database;
    expect(body.rows.map((r: { page_id: string }) => r.page_id)).toEqual([
      r2.page_id,
      r3.page_id,
      r1.page_id,
    ]);
  });
});

// ── Slice 5: row-as-page + title↔Name sync ──────────────────────────────────

test.describe("databases v2 — row as page", () => {
  test("editing the Name cell updates the row page title", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const row = await addRow(request, db.id);
    const nameProp = db.properties[0]; // the default "Name" text property

    await request.patch(`${API}/rows/${row.page_id}/properties/${nameProp.id}`, {
      data: { value: "My Task" },
      headers: HEADERS,
    });

    const pageRes = await request.get(`${API}/pages/${row.page_id}`);
    expect(pageRes.status()).toBe(200);
    expect((await pageRes.json()).data.page.title).toBe("My Task");
    expect((await pageRes.json()).data.page.database_id).toBe(db.id);
  });

  test("editing the row page title updates the Name cell", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const row = await addRow(request, db.id);
    const nameProp = db.properties[0];

    await request.patch(`${API}/pages/${row.page_id}`, {
      data: { title: "Renamed Task" },
      headers: HEADERS,
    });

    const dbRes = await request.get(`${API}/databases/${db.id}`);
    const dbBody = (await dbRes.json()).data.database;
    const nameVal = dbBody.rows
      .find((r: { page_id: string }) => r.page_id === row.page_id)
      ?.values.find((v: { property_id: string }) => v.property_id === nameProp.id);
    expect(nameVal?.value).toBe("Renamed Task");
  });

  test("writing to a system property is rejected", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const createdProp = await addProp(request, db.id, { name: "Created", type: "created_time" });
    const row = await addRow(request, db.id);

    const res = await request.patch(
      `${API}/rows/${row.page_id}/properties/${createdProp.id}`,
      { data: { value: "2024-01-01" }, headers: HEADERS },
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.details?.code ?? body.error.code).toBe("SYSTEM_NOT_EDITABLE");
  });
});

// ── Slice 6: multi_select, status, system types ─────────────────────────────

test.describe("databases v2 — new property types", () => {
  test("multi_select stores and returns an array of values", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const tags = await addProp(request, db.id, {
      name: "Tags",
      type: "multi_select",
      options: { options: ["red", "green", "blue"] },
    });
    const row = await addRow(request, db.id);

    const set = await request.patch(`${API}/rows/${row.page_id}/properties/${tags.id}`, {
      data: { value: ["red", "blue"] },
      headers: HEADERS,
    });
    expect(set.status()).toBe(200);

    const tagsValue = (await getDb(request, db.id)).rows
      .find((r) => r.page_id === row.page_id)!
      .values.find((v) => v.property_id === tags.id);
    expect(tagsValue?.value).toEqual(["red", "blue"]);
  });

  test("status property stores a single value like select", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const status = await addProp(request, db.id, {
      name: "Status",
      type: "status",
      options: { options: ["To-do", "In Progress", "Done"] },
    });
    const row = await addRow(request, db.id);

    const set = await request.patch(`${API}/rows/${row.page_id}/properties/${status.id}`, {
      data: { value: "In Progress" },
      headers: HEADERS,
    });
    expect(set.status()).toBe(200);

    const statusValue = (await getDb(request, db.id)).rows
      .find((r) => r.page_id === row.page_id)!
      .values.find((v) => v.property_id === status.id);
    expect(statusValue?.value).toBe("In Progress");
  });

  test("created_time derives the row's creation timestamp", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const created = await addProp(request, db.id, { name: "Created", type: "created_time" });
    const row = await addRow(request, db.id);

    const cell = (await getDb(request, db.id)).rows
      .find((r) => r.page_id === row.page_id)!
      .values.find((v) => v.property_id === created.id);
    // The derived value is an ISO timestamp string.
    expect(typeof cell?.value).toBe("string");
    expect(() => new Date(cell!.value as string)).not.toThrow();
  });

  test("select options accept the structured {value,color} shape", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const db = await makeDatabase(request, page);
    const prio = await addProp(request, db.id, {
      name: "Prio",
      type: "select",
      options: { options: [{ value: "Low", color: "blue" }, { value: "High", color: "red" }] },
    });
    expect(prio.id).toBeTruthy();
  });
});

// ── Slice 7: relation + rollup ──────────────────────────────────────────────

test.describe("databases v2 — relation & rollup", () => {
  test("relation links rows across databases with two-way sync", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    // db1 = Tasks, db2 = People. Tasks → People relation.
    const tasks = await makeDatabase(request, page);
    const peopleDb = await makeDatabase(request, page);
    const rel = await addProp(request, tasks.id, {
      name: "Owner",
      type: "relation",
      relation_database_id: peopleDb.id,
    });

    const alice = await addRow(request, peopleDb.id);
    const bob = await addRow(request, peopleDb.id);
    const task1 = await addRow(request, tasks.id);

    // Link task1 → [alice, bob].
    const set = await request.patch(`${API}/rows/${task1.page_id}/properties/${rel.id}`, {
      data: { value: [alice.page_id, bob.page_id] },
      headers: HEADERS,
    });
    expect(set.status()).toBe(200);

    // The relation cell now holds the two ids.
    const tasksBody = await getDb(request, tasks.id);
    const relCell = tasksBody.rows
      .find((r) => r.page_id === task1.page_id)!
      .values.find((v) => v.property_id === rel.id);
    expect(relCell?.value).toEqual([alice.page_id, bob.page_id]);

    // The inverse relation property was created on People, and both alice and
    // bob now list task1 in their inverse cell.
    const peopleBody = await getDb(request, peopleDb.id);
    const inverseProp = peopleBody.properties.find((p) => p.type === "relation")!;
    const aliceInverse = peopleBody.rows
      .find((r) => r.page_id === alice.page_id)!
      .values.find((v) => v.property_id === inverseProp.id);
    expect(aliceInverse?.value).toEqual([task1.page_id]);
  });

  test("rollup aggregates a target property through a relation", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    // Projects → Tasks. Each Task has a number "Hours"; rollup sums them.
    const projects = await makeDatabase(request, page);
    const tasksDb = await makeDatabase(request, page);
    const hours = await addProp(request, tasksDb.id, { name: "Hours", type: "number" });
    const rel = await addProp(request, projects.id, {
      name: "Tasks",
      type: "relation",
      relation_database_id: tasksDb.id,
    });
    const total = await addProp(request, projects.id, {
      name: "Total Hours",
      type: "rollup",
      rollup_config: {
        relation_property_id: rel.id,
        target_property_id: hours.id,
        aggregation: "sum",
      },
    });

    const t1 = await addRow(request, tasksDb.id);
    const t2 = await addRow(request, tasksDb.id);
    const t3 = await addRow(request, tasksDb.id);
    await request.patch(`${API}/rows/${t1.page_id}/properties/${hours.id}`, { data: { value: 5 }, headers: HEADERS });
    await request.patch(`${API}/rows/${t2.page_id}/properties/${hours.id}`, { data: { value: 10 }, headers: HEADERS });
    await request.patch(`${API}/rows/${t3.page_id}/properties/${hours.id}`, { data: { value: 3 }, headers: HEADERS });

    const project = await addRow(request, projects.id);
    // Link the project to all three tasks.
    await request.patch(`${API}/rows/${project.page_id}/properties/${rel.id}`, {
      data: { value: [t1.page_id, t2.page_id, t3.page_id] },
      headers: HEADERS,
    });

    const body = await getDb(request, projects.id);
    const rollupCell = body.rows
      .find((r) => r.page_id === project.page_id)!
      .computed?.[total.id];
    expect(rollupCell?.status).toBe("ok");
    expect(rollupCell?.value).toBe(18);
  });

  test("relation to another workspace is rejected", async ({ request }) => {
    await register(request);
    const ws1 = await makeWorkspace(request);
    const ws2 = await makeWorkspace(request, "WS2");
    const page1 = await makePage(request, ws1);
    const page2 = await makePage(request, ws2);
    const db1 = await makeDatabase(request, page1);
    const db2 = await makeDatabase(request, page2);

    const res = await request.post(`${API}/databases/${db1.id}/properties`, {
      data: { name: "Other", type: "relation", relation_database_id: db2.id },
      headers: HEADERS,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.details?.code ?? body.error.code).toBe("RELATION_TARGET_INVALID");
  });
});

