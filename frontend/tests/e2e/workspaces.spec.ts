import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Workspaces API e2e — spec 003 acceptance criteria for workspaces + membership.
 *
 * Each test registers a fresh user and creates a fresh workspace so runs are
 * independent and parallel-safe. The shared `request` fixture persists cookies,
 * so once a user registers they're authenticated for subsequent calls.
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const HEADERS = { "Content-Type": "application/json", "X-Requested-With": CSRF };

function uniq(p: string): string {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

/** Register a fresh user; the cookie jar now holds the session. */
async function register(request: APIRequestContext, email = uniq("ws")): Promise<void> {
  const res = await request.post(`${API}/auth/register`, {
    data: { email, password: "password123" },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
}

async function createWorkspace(
  request: APIRequestContext,
  name = "Test WS",
): Promise<{ id: string }> {
  const res = await request.post(`${API}/workspaces`, {
    data: { name },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.data.workspace;
}

test.describe("workspaces", () => {
  test("create + list; creator is OWNER", async ({ request }) => {
    await register(request);
    const ws = await createWorkspace(request, "Owner WS");
    expect(ws.id).toBeTruthy();

    const res = await request.get(`${API}/workspaces`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.workspaces.find((w: { id: string }) => w.id === ws.id);
    expect(found).toBeTruthy();
    expect(found.role).toBe("OWNER");
  });

  test("get own workspace → 200", async ({ request }) => {
    await register(request);
    const ws = await createWorkspace(request);
    const res = await request.get(`${API}/workspaces/${ws.id}`);
    expect(res.status()).toBe(200);
    expect((await res.json()).data.workspace.id).toBe(ws.id);
  });

  test("non-member cannot access a workspace → 403", async ({ request }) => {
    test.setTimeout(60_000); // multi-user session switch is slow under argon2
    // User A creates a workspace on the shared request context.
    await register(request, uniq("alice"));
    const ws = await createWorkspace(request, "Alice's WS");

    // Log out Alice, then register as Bob (different user, same cookie jar).
    await request.post(`${API}/auth/logout`, { data: {}, headers: HEADERS });
    await register(request, uniq("bob"));

    // Bob should NOT have access to Alice's workspace.
    const res = await request.get(`${API}/workspaces/${ws.id}`);
    expect(res.status()).toBe(403);
  });
});
