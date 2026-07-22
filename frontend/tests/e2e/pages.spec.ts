import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Pages, blocks, search & files API e2e — spec 003 acceptance criteria.
 *
 * Each test sets up a fresh user + workspace so runs are independent. Helper
 * functions keep the per-test setup terse.
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

interface BlockResp {
  id: string;
  order: number;
}

async function makeBlock(
  request: APIRequestContext,
  pageId: string,
  extra: Record<string, unknown> = {},
): Promise<BlockResp> {
  const res = await request.post(`${API}/pages/${pageId}/blocks`, {
    data: {
      type: "paragraph",
      content: {
        type: "paragraph",
        rich_text: [{ kind: "text", text: "hello world" }],
      },
      ...extra,
    },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.block;
}

// ── Pages ────────────────────────────────────────────────────────────────────

test.describe("pages", () => {
  test("create appears in children list", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws, { title: "My Page" });

    const res = await request.get(`${API}/workspaces/${ws}/pages`);
    const body = await res.json();
    expect(body.data.pages.some((p: { id: string }) => p.id === pageId)).toBe(true);
  });

  test("get returns page + blocks ordered by order", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws, { title: "Doc" });

    const b1 = await makeBlock(request, pageId);
    const b2 = await makeBlock(request, pageId);

    const res = await request.get(`${API}/pages/${pageId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.page.id).toBe(pageId);
    const orders = body.data.blocks.map((b: BlockResp) => b.id);
    expect(orders).toEqual([b1.id, b2.id]);
  });

  test("patch updates title", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws, { title: "Old" });

    const res = await request.patch(`${API}/pages/${pageId}`, {
      data: { title: "New Title" },
      headers: HEADERS,
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).data.page.title).toBe("New Title");
  });

  test("delete → trash, excluded from list; restore brings back", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws, { title: "Trash Me" });

    // Trash it.
    const del = await request.delete(`${API}/pages/${pageId}`, { headers: HEADERS });
    expect(del.status()).toBe(204);

    // Excluded from children.
    const list = await request.get(`${API}/workspaces/${ws}/pages`);
    const listBody = await list.json();
    expect(listBody.data.pages.some((p: { id: string }) => p.id === pageId)).toBe(false);

    // Direct get → 404 (treated as gone for non-trash viewers).
    const gone = await request.get(`${API}/pages/${pageId}`);
    expect(gone.status()).toBe(404);

    // Restore.
    const restore = await request.post(`${API}/pages/${pageId}/restore`, {
      data: {},
      headers: HEADERS,
    });
    expect(restore.status()).toBe(200);
    const back = await request.get(`${API}/pages/${pageId}`);
    expect(back.status()).toBe(200);
  });

  test("duplicate creates a copy with blocks", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws, { title: "Original" });
    await makeBlock(request, pageId);

    const res = await request.post(`${API}/pages/${pageId}/duplicate`, {
      data: {},
      headers: HEADERS,
    });
    expect(res.status()).toBe(201);
    const dup = (await res.json()).data.page;
    expect(dup.id).not.toBe(pageId);
    expect(dup.title).toBe("Original (copy)");

    const blocks = await request.get(`${API}/pages/${dup.id}`);
    expect((await blocks.json()).data.blocks.length).toBe(1);
  });
});

// ── Blocks ───────────────────────────────────────────────────────────────────

test.describe("blocks", () => {
  test("create with before/after → order is between them", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);

    const a = await makeBlock(request, pageId);
    const c = await makeBlock(request, pageId);
    // Insert between a and c.
    const b = await makeBlock(request, pageId, {
      after_id: a.id,
      before_id: c.id,
    });
    expect(b.order).toBeGreaterThan(a.order);
    expect(b.order).toBeLessThan(c.order);
  });

  test("reorder moves a block between two others", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const b1 = await makeBlock(request, pageId);
    const b2 = await makeBlock(request, pageId);
    const b3 = await makeBlock(request, pageId);

    // Move b3 to be between b1 and b2.
    const res = await request.post(`${API}/pages/${pageId}/blocks/reorder`, {
      data: { block_id: b3.id, after_id: b1.id, before_id: b2.id },
      headers: HEADERS,
    });
    expect(res.status()).toBe(200);
    const moved = (await res.json()).data.block;
    expect(moved.order).toBeGreaterThan(b1.order);
    expect(moved.order).toBeLessThan(b2.order);
  });

  test("patch updates block content", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const block = await makeBlock(request, pageId);

    const res = await request.patch(`${API}/blocks/${block.id}`, {
      data: {
        content: {
          type: "paragraph",
          rich_text: [{ kind: "text", text: "updated content" }],
        },
      },
      headers: HEADERS,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.block.content.rich_text[0].text).toBe("updated content");
  });

  test("delete removes the block", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);
    const block = await makeBlock(request, pageId);

    const del = await request.delete(`${API}/blocks/${block.id}`, { headers: HEADERS });
    expect(del.status()).toBe(204);

    const blocks = await request.get(`${API}/pages/${pageId}/blocks`);
    expect((await blocks.json()).data.blocks.length).toBe(0);
  });

  test("reorder cycle → 400 (bad request, code CYCLE)", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const pageId = await makePage(request, ws);

    // Parent block, then a child.
    const parent = await makeBlock(request, pageId);
    const child = await makeBlock(request, pageId, { parent_block_id: parent.id });

    // Try to move the parent under its own child → cycle.
    const res = await request.post(`${API}/pages/${pageId}/blocks/reorder`, {
      data: { block_id: parent.id, new_parent_block_id: child.id },
      headers: HEADERS,
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.details?.code ?? body.error.code).toBe("CYCLE");
  });
});

// ── Search ───────────────────────────────────────────────────────────────────

test.describe("search", () => {
  test("finds a page by title word with snippet", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    await makePage(request, ws, { title: "Quarterly roadmap" });

    const res = await request.get(
      `${API}/workspaces/${ws}/search?q=roadmap`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.results.length).toBeGreaterThan(0);
    expect(body.data.results[0].title).toContain("roadmap");
    expect(typeof body.data.results[0].snippet).toBe("string");
  });

  test("empty query → 400", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const res = await request.get(`${API}/workspaces/${ws}/search?q=`);
    expect(res.status()).toBe(400);
  });
});

// ── Files ────────────────────────────────────────────────────────────────────

test.describe("files", () => {
  test("upload image → 201 with url; GET serves bytes", async ({ request }) => {
    await register(request);

    // 1x1 transparent PNG.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
      "base64",
    );

    const res = await request.post(`${API}/files`, {
      multipart: {
        file: { name: "tiny.png", mimeType: "image/png", buffer: png },
        page_id: "",
      },
      headers: { "X-Requested-With": CSRF },
    });
    expect(res.status()).toBe(201);
    const attachment = (await res.json()).data.attachment;
    expect(attachment.url).toMatch(/\/api\/v1\/files\//);

    // Serve.
    const key = attachment.url.split("/").pop();
    const served = await request.get(`${API}/files/${key}`);
    expect(served.status()).toBe(200);
    expect((await served.body()).length).toBe(png.length);
  });

  test("oversized upload → 413", async ({ request }) => {
    await register(request);
    // 20MB of zeros — exceeds the default 10MB cap.
    const big = Buffer.alloc(20 * 1024 * 1024, 0);

    const res = await request.post(`${API}/files`, {
      multipart: {
        file: { name: "big.png", mimeType: "image/png", buffer: big },
      },
      headers: { "X-Requested-With": CSRF },
    });
    expect(res.status()).toBe(413);
  });

  test("wrong type → 400", async ({ request }) => {
    await register(request);
    const res = await request.post(`${API}/files`, {
      multipart: {
        file: {
          name: "evil.exe",
          mimeType: "application/octet-stream",
          buffer: Buffer.from("MZ"),
        },
      },
      headers: { "X-Requested-With": CSRF },
    });
    expect(res.status()).toBe(400);
  });
});
