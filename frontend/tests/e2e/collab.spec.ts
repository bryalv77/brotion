import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Collaboration API e2e — spec 004 acceptance criteria for permissions,
 * public sharing, and comments.
 *
 * Setup pattern: Alice (owner) creates a workspace + page; Bob is a second user
 * who gets explicit per-user access. The public-link tests use an unauthenticated
 * request context.
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": CSRF };

function uniq(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

async function register(request: APIRequestContext, email = uniq("u")): Promise<string> {
  const res = await request.post(`${API}/auth/register`, {
    data: { email, password: "password123" },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data.user.id;
}

async function makeWorkspace(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/workspaces`, { data: { name: "WS" }, headers: HEADERS });
  return (await res.json()).data.workspace.id;
}

async function makePage(request: APIRequestContext, workspaceId: string): Promise<string> {
  const res = await request.post(`${API}/workspaces/${workspaceId}/pages`, {
    data: { title: "Shared Doc" },
    headers: HEADERS,
  });
  return (await res.json()).data.page.id;
}

async function makeBlock(request: APIRequestContext, pageId: string): Promise<string> {
  const res = await request.post(`${API}/pages/${pageId}/blocks`, {
    data: {
      type: "paragraph",
      content: { type: "paragraph", rich_text: [{ kind: "text", text: "hi" }] },
    },
    headers: HEADERS,
  });
  return (await res.json()).data.block.id;
}

// ── Permissions & Sharing ────────────────────────────────────────────────────

// Serial: the per-user VIEWER test does a multi-step session switch (register
// Bob → logout → register Alice → grant → logout → login Bob) that can race
// with other parallel tests on the shared backend.
test.describe.serial("permissions & sharing", () => {
  test("owner can list permissions (empty initially)", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);

    const res = await request.get(`${API}/pages/${page}/permissions`);
    expect(res.status()).toBe(200);
    expect((await res.json()).data.permissions).toEqual([]);
  });

  test("create per-user VIEWER permission; grantee can read but not write", async ({ request }) => {
    test.setTimeout(120_000); // 6-step session switch is slow under argon2
    // Step 1: Bob registers first (we capture his id + email), then logs out.
    const bobEmail = uniq("bob");
    const bobId = await register(request, bobEmail);
    await request.post(`${API}/auth/logout`, { data: {}, headers: HEADERS });

    // Step 2: Alice registers, creates workspace + page, grants Bob VIEWER access.
    await register(request, uniq("alice"));
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);

    const grant = await request.post(`${API}/pages/${page}/permissions`, {
      data: { user_id: bobId, share_type: "USER", access: "VIEWER" },
      headers: HEADERS,
    });
    expect(grant.status()).toBe(201);

    // Step 3: Alice logs out, Bob logs in.
    await request.post(`${API}/auth/logout`, { data: {}, headers: HEADERS });
    const login = await request.post(`${API}/auth/login`, {
      data: { email: bobEmail, password: "password123" },
      headers: HEADERS,
    });
    expect(login.status()).toBe(200);

    // Step 4: Bob can READ the page (200) but not PATCH it (403).
    const read = await request.get(`${API}/pages/${page}`);
    expect(read.status()).toBe(200);

    const write = await request.patch(`${API}/pages/${page}`, {
      data: { title: "Bob tried to edit" },
      headers: HEADERS,
    });
    expect(write.status()).toBe(403);
  });

  test("create public link; unauthenticated GET /shared/:token returns page", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);

    // Create public link.
    const link = await request.post(`${API}/pages/${page}/permissions`, {
      data: { share_type: "PUBLIC_LINK", access: "VIEWER" },
      headers: HEADERS,
    });
    expect(link.status()).toBe(201);
    const token = (await link.json()).data.permission.token;
    expect(token).toBeTruthy();

    // Unauthenticated access via the shared token.
    const res = await request.get(`${API}/shared/${token}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.page.id).toBe(page);
  });

  test("invalid share token → 404", async ({ request }) => {
    const res = await request.get(`${API}/shared/invalid-token-12345`);
    expect(res.status()).toBe(404);
  });

  test("delete a permission → 204", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);

    const link = await request.post(`${API}/pages/${page}/permissions`, {
      data: { share_type: "PUBLIC_LINK", access: "VIEWER" },
      headers: HEADERS,
    });
    const permId = (await link.json()).data.permission.id;

    const del = await request.delete(`${API}/pages/${page}/permissions/${permId}`, {
      headers: HEADERS,
    });
    expect(del.status()).toBe(204);

    // Permission is gone.
    const list = await request.get(`${API}/pages/${page}/permissions`);
    expect((await list.json()).data.permissions).toEqual([]);
  });
});

// ── Comments ─────────────────────────────────────────────────────────────────

test.describe("comments", () => {
  test("create + list comments on a page", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const block = await makeBlock(request, page);

    const create = await request.post(`${API}/pages/${page}/comments`, {
      data: {
        block_id: block,
        body: [{ kind: "text", text: "Nice block!" }],
      },
      headers: HEADERS,
    });
    expect(create.status()).toBe(201);
    const comment = (await create.json()).data.comment;
    expect(comment.body[0].text).toBe("Nice block!");
    expect(comment.resolved).toBe(false);

    // List.
    const list = await request.get(`${API}/pages/${page}/comments`);
    expect(list.status()).toBe(200);
    expect((await list.json()).data.comments.length).toBe(1);
  });

  test("patch a comment (resolve)", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const block = await makeBlock(request, page);

    const create = await request.post(`${API}/pages/${page}/comments`, {
      data: { block_id: block, body: [{ kind: "text", text: "Resolve me" }] },
      headers: HEADERS,
    });
    const commentId = (await create.json()).data.comment.id;

    const patch = await request.patch(`${API}/comments/${commentId}`, {
      data: { resolved: true },
      headers: HEADERS,
    });
    expect(patch.status()).toBe(200);
    expect((await patch.json()).data.comment.resolved).toBe(true);
  });

  test("delete a comment", async ({ request }) => {
    await register(request);
    const ws = await makeWorkspace(request);
    const page = await makePage(request, ws);
    const block = await makeBlock(request, page);

    const create = await request.post(`${API}/pages/${page}/comments`, {
      data: { block_id: block, body: [{ kind: "text", text: "Delete me" }] },
      headers: HEADERS,
    });
    const commentId = (await create.json()).data.comment.id;

    const del = await request.delete(`${API}/comments/${commentId}`, { headers: HEADERS });
    expect(del.status()).toBe(204);

    const list = await request.get(`${API}/pages/${page}/comments`);
    expect((await list.json()).data.comments.length).toBe(0);
  });
});
