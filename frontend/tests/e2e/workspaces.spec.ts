import { test, expect } from "@playwright/test";
import {
  API,
  HEADERS,
  makeWorkspace,
  register,
  uniqueEmail,
} from "./helpers.js";

/**
 * Workspaces API e2e — spec 003 acceptance criteria for workspaces + membership.
 *
 * Each test registers a fresh user and creates a fresh workspace so runs are
 * independent and parallel-safe. The shared `request` fixture persists cookies,
 * so once a user registers they're authenticated for subsequent calls.
 */

test.describe("workspaces", () => {
  test("create + list; creator is OWNER", async ({ request }) => {
    await register(request);
    const wsId = await makeWorkspace(request, "Owner WS");
    expect(wsId).toBeTruthy();

    const res = await request.get(`${API}/workspaces`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.workspaces.find((w: { id: string }) => w.id === wsId);
    expect(found).toBeTruthy();
    expect(found.role).toBe("OWNER");
  });

  test("get own workspace → 200", async ({ request }) => {
    await register(request);
    const wsId = await makeWorkspace(request);
    const res = await request.get(`${API}/workspaces/${wsId}`);
    expect(res.status()).toBe(200);
    expect((await res.json()).data.workspace.id).toBe(wsId);
  });

  test("non-member cannot access a workspace → 403", async ({ request }) => {
    // User A creates a workspace on the shared request context.
    await register(request, uniqueEmail("alice"));
    const wsId = await makeWorkspace(request, "Alice's WS");

    // Log out Alice, then register as Bob (different user, same cookie jar).
    await request.post(`${API}/auth/logout`, { data: {}, headers: HEADERS });
    await register(request, uniqueEmail("bob"));

    // Bob should NOT have access to Alice's workspace.
    const res = await request.get(`${API}/workspaces/${wsId}`);
    expect(res.status()).toBe(403);
  });
});
