import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  API,
  HEADERS,
  makePage,
  makeWorkspace,
  register,
} from "./helpers.js";

/**
 * Database Templates — spec 016 acceptance tests.
 *
 * Templates are factories: applying one deep-copies its block body + seeds
 * default values onto a new row; the row is then independent of the template.
 * Covers: CRUD, instantiation (explicit/default/none), independence both ways,
 * default-values seeding + Name→title sync, hidden-page exclusion, access tiers.
 *
 * Each test authenticates the shared `request` fixture (via cookies) by calling
 * `register(request)` first; subsequent calls reuse that session.
 */

interface TemplateShape {
  id: string;
  database_id: string;
  name: string;
  icon: string | null;
  page_id: string;
  default_values: Record<string, unknown>;
  is_default: boolean;
}

interface DbShape {
  id: string;
  page_id: string;
  workspace_id: string;
  properties: Array<{ id: string; name: string; type: string }>;
  rows: Array<{
    page_id: string;
    title: string;
    values: Array<{ property_id: string; value: unknown }>;
  }>;
  templates?: TemplateShape[];
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

async function createTemplate(
  request: APIRequestContext,
  dbId: string,
  body: Record<string, unknown> = {},
): Promise<TemplateShape> {
  const res = await request.post(`${API}/databases/${dbId}/templates`, {
    data: body,
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.template;
}

async function listTemplates(
  request: APIRequestContext,
  dbId: string,
): Promise<TemplateShape[]> {
  const res = await request.get(`${API}/databases/${dbId}/templates`);
  expect(res.status()).toBe(200);
  return (await res.json()).data.templates;
}

async function addRow(
  request: APIRequestContext,
  dbId: string,
  body: Record<string, unknown> = {},
): Promise<{ page_id: string; title: string }> {
  const res = await request.post(`${API}/databases/${dbId}/rows`, {
    data: body,
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.row;
}

async function addBlock(
  request: APIRequestContext,
  pageId: string,
  text: string,
): Promise<void> {
  const res = await request.post(`${API}/pages/${pageId}/blocks`, {
    data: {
      type: "paragraph",
      content: { type: "paragraph", rich_text: [{ kind: "text", text }] },
    },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
}

async function getBlocks(
  request: APIRequestContext,
  pageId: string,
): Promise<
  Array<{ id: string; type: string; content: { rich_text?: Array<{ text: string }> } }>
> {
  const res = await request.get(`${API}/pages/${pageId}/blocks`);
  expect(res.status()).toBe(200);
  return (await res.json()).data.blocks;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────

test("create a template: it appears in the list and is the default (first one)", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "Meeting notes", icon: "📝" });
  expect(t.name).toBe("Meeting notes");
  expect(t.is_default).toBe(true); // first template becomes default
  expect(t.page_id).toBeTruthy();

  const list = await listTemplates(request, db.id);
  expect(list).toHaveLength(1);
  expect(list[0].id).toBe(t.id);

  // The database DTO now carries templates too.
  const fresh = await getDb(request, db.id);
  expect(fresh.templates?.map((x) => x.id)).toEqual([t.id]);
});

test("a second template is not default by default; setting default un-marks the previous", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  await createTemplate(request, db.id, { name: "First" });
  const t2 = await createTemplate(request, db.id, { name: "Second" });
  expect(t2.is_default).toBe(false);

  const res = await request.patch(`${API}/databases/${db.id}/templates/${t2.id}`, {
    data: { is_default: true },
    headers: HEADERS,
  });
  expect(res.status()).toBe(200);

  const fresh = await getDb(request, db.id);
  const byName = Object.fromEntries(fresh.templates!.map((t) => [t.name, t]));
  expect(byName.Second.is_default).toBe(true);
  expect(byName.First.is_default).toBe(false); // un-marked
});

// ─── Template body editing (existing block endpoints) ─────────────────────

test("editing a template body via the block endpoint persists", async ({ request }) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "T" });
  await addBlock(request, t.page_id, "agenda item");

  const blocks = await getBlocks(request, t.page_id);
  expect(blocks.some((b) => b.content.rich_text?.[0]?.text === "agenda item")).toBe(true);
});

// ─── Instantiation ────────────────────────────────────────────────────────

test("creating a row from a template deep-copies the body and seeds defaults", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  // Add a Status property with a Todo option.
  const statusProp = (
    await (
      await request.post(`${API}/databases/${db.id}/properties`, {
        data: {
          name: "Status",
          type: "status",
          options: { options: [{ value: "Todo" }] },
        },
        headers: HEADERS,
      })
    ).json()
  ).data.property;

  const nameProp = db.properties.find((p) => p.name === "Name")!;
  const t = await createTemplate(request, db.id, { name: "T" });

  // Give the template a body + default values (Name + Status).
  await addBlock(request, t.page_id, "kickoff");
  const upd = await request.patch(`${API}/databases/${db.id}/templates/${t.id}`, {
    data: { default_values: { [nameProp.id]: "New task", [statusProp.id]: "Todo" } },
    headers: HEADERS,
  });
  expect(upd.status()).toBe(200);

  const row = await addRow(request, db.id, { template_id: t.id });

  // Name default → row title; block body copied; Status cell seeded.
  expect(row.title).toBe("New task");
  const blocks = await getBlocks(request, row.page_id);
  expect(blocks.some((b) => b.content.rich_text?.[0]?.text === "kickoff")).toBe(true);

  const fresh = await getDb(request, db.id);
  const newRow = fresh.rows.find((r) => r.page_id === row.page_id)!;
  const statusCell = newRow.values.find((v) => v.property_id === statusProp.id);
  expect(statusCell?.value).toBe("Todo");
});

test("the default template is auto-applied when no template_id is given", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "Default-t" }); // is_default
  await addBlock(request, t.page_id, "auto body");

  // Omit template_id → backend applies the default.
  const row = await addRow(request, db.id, {});
  const blocks = await getBlocks(request, row.page_id);
  expect(blocks.some((b) => b.content.rich_text?.[0]?.text === "auto body")).toBe(true);
});

test("creating a row with no template and no default → empty row (regression)", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const row = await addRow(request, db.id);
  expect(row.title).toBe("");
  const blocks = await getBlocks(request, row.page_id);
  expect(blocks).toHaveLength(0);
});

test("explicit template_id belonging to another database is rejected", async ({ request }) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const dbA = await makeDatabase(request, page);
  const dbB = await makeDatabase(request, page);
  const tA = await createTemplate(request, dbA.id, { name: "A" });

  const res = await request.post(`${API}/databases/${dbB.id}/rows`, {
    data: { template_id: tA.id },
    headers: HEADERS,
  });
  expect(res.status()).toBe(400);
});

// ─── Independence (factory, no sync) ──────────────────────────────────────

test("editing an instantiated row does not modify the template", async ({ request }) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "T" });
  await addBlock(request, t.page_id, "shared content");
  const row = await addRow(request, db.id, { template_id: t.id });

  // Mutate the row's body (add a block); the template body must be unchanged.
  await addBlock(request, row.page_id, "row-only addition");

  const templateBlocks = await getBlocks(request, t.page_id);
  expect(
    templateBlocks.some((b) => b.content.rich_text?.[0]?.text === "row-only addition"),
  ).toBe(false);
});

test("editing a template does not modify rows already created from it", async ({ request }) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "T" });
  await addBlock(request, t.page_id, "v1");
  const row = await addRow(request, db.id, { template_id: t.id });

  // Mutate the template body AFTER instantiation; the row must be unchanged.
  await addBlock(request, t.page_id, "v2-after");

  const rowBlocks = await getBlocks(request, row.page_id);
  const rowTexts = rowBlocks.map((b) => b.content.rich_text?.[0]?.text);
  expect(rowTexts).toContain("v1");
  expect(rowTexts).not.toContain("v2-after");
});

// ─── Hidden body page never leaks ─────────────────────────────────────────

test("the template body page is hidden from the sidebar, search, and breadcrumbs", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "Findable" });
  // Make the body searchable so we can assert its ABSENCE from search.
  await addBlock(request, t.page_id, "uniquetemplatekeyword");

  // Sidebar roots never include the body page.
  const roots = (
    await (await request.get(`${API}/workspaces/${ws}/pages`)).json()
  ).data.pages as Array<{ id: string }>;
  expect(roots.find((p) => p.id === t.page_id)).toBeUndefined();

  // Children of the host page never include the body page either.
  const children = (
    await (await request.get(`${API}/workspaces/${ws}/pages?parent_id=${page}`)).json()
  ).data.pages as Array<{ id: string }>;
  expect(children.find((p) => p.id === t.page_id)).toBeUndefined();

  // Search does not surface the hidden body.
  const search = (
    await (await request.get(`${API}/workspaces/${ws}/search?q=uniquetemplatekeyword`)).json()
  ).data.results as Array<{ page_id: string }>;
  expect(search.find((r) => r.page_id === t.page_id)).toBeUndefined();

  // The host page's ancestors don't include the body (it's parent_id=null).
  const ancestors = (
    await (await request.get(`${API}/pages/${page}/ancestors`)).json()
  ).data.breadcrumbs as Array<{ id: string }>;
  expect(ancestors.find((b) => b.id === t.page_id)).toBeUndefined();
});

// ─── Delete + access tiers ────────────────────────────────────────────────

test("deleting a template succeeds and leaves already-created rows intact", async ({
  request,
}) => {
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);

  const t = await createTemplate(request, db.id, { name: "T" });
  await addBlock(request, t.page_id, "body");
  const row = await addRow(request, db.id, { template_id: t.id });

  const res = await request.delete(`${API}/databases/${db.id}/templates/${t.id}`, {
    headers: HEADERS,
  });
  expect(res.status()).toBe(204);

  // Template gone from the list; the row (and its copied body) survives.
  expect(await listTemplates(request, db.id)).toHaveLength(0);
  const blocks = await getBlocks(request, row.page_id);
  expect(blocks.some((b) => b.content.rich_text?.[0]?.text === "body")).toBe(true);
});

test("an unauthenticated outsider cannot delete a template", async ({ request, playwright }) => {
  // Owner creates everything on the authenticated `request` fixture.
  await register(request);
  const ws = await makeWorkspace(request);
  const page = await makePage(request, ws);
  const db = await makeDatabase(request, page);
  const t = await createTemplate(request, db.id, { name: "T" });

  // A fresh, unauthenticated context has no session → must be rejected.
  const outsider = await playwright.request.newContext();
  const res = await outsider.delete(`${API}/databases/${db.id}/templates/${t.id}`, {
    headers: HEADERS,
  });
  expect([401, 403, 404]).toContain(res.status());
  await outsider.dispose();
});
