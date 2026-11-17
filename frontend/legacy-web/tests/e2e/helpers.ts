import {
  expect,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from "@playwright/test";

/**
 * Shared helpers for the e2e suite. Previously duplicated verbatim across 9+
 * spec files; consolidating here keeps per-spec setup terse and ensures
 * consistent auth/header behaviour.
 *
 * Two flavors of helper:
 * - API helpers: take any `APIRequestContext` (test fixture, page context's
 *   request, or a context created via `request.newContext`).
 * - UI helpers: take a `Page` and assume the demo user is already
 *   authenticated via `test.use({ storageState: ".auth/demo.json" })`.
 */

export const API = "/api/v1";
export const JSON_HEADERS = { "Content-Type": "application/json" };
export const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" };
export const HEADERS = { ...JSON_HEADERS, ...CSRF_HEADER };

export const DEMO_EMAIL = "demo@notion.local";
export const DEMO_PASSWORD = "password123";

/** Unique-ish email per call so parallel runs don't collide. */
export function uniqueEmail(prefix = "u"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
}

/** Parse an API response body as JSON, returning null for empty bodies. */
export async function parseBody(res: APIResponse): Promise<unknown> {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** POST a JSON body with standard headers; returns status + parsed body. */
export async function postJson(
  request: APIRequestContext,
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown; headers: Record<string, string> }> {
  const res = await request.post(`${API}${path}`, {
    data: body,
    headers: HEADERS,
  });
  return {
    status: res.status(),
    body: await parseBody(res),
    headers: res.headers(),
  };
}

/** Register a fresh user; the cookie jar now holds the session. */
export async function register(
  request: APIRequestContext,
  email = uniqueEmail("u"),
  name?: string,
): Promise<string> {
  const { status, body } = await postJson(request, "/auth/register", {
    email,
    password: DEMO_PASSWORD,
    name,
  });
  expect(status, `register(${email})`).toBe(201);
  return (body as { data: { user: { id: string } } }).data.user.id;
}

/** Log in an existing user. Used for session-switch tests. */
export async function login(
  request: APIRequestContext,
  email: string,
  password = DEMO_PASSWORD,
): Promise<void> {
  const { status } = await postJson(request, "/auth/login", { email, password });
  expect(status, `login(${email})`).toBe(200);
}

export async function makeWorkspace(
  request: APIRequestContext,
  name = "WS",
): Promise<string> {
  const res = await request.post(`${API}/workspaces`, {
    data: { name },
    headers: HEADERS,
  });
  expect(res.status(), `createWorkspace(${name})`).toBe(201);
  return (await res.json()).data.workspace.id;
}

export async function makePage(
  request: APIRequestContext,
  workspaceId: string,
  body: Record<string, unknown> = {},
): Promise<string> {
  const res = await request.post(
    `${API}/workspaces/${workspaceId}/pages`,
    { data: body, headers: HEADERS },
  );
  expect(res.status(), `createPage(${workspaceId})`).toBe(201);
  return (await res.json()).data.page.id;
}

export async function makeBlock(
  request: APIRequestContext,
  pageId: string,
  type = "paragraph",
  text = "hi",
): Promise<string> {
  const res = await request.post(`${API}/pages/${pageId}/blocks`, {
    data: {
      type,
      content: { type, rich_text: [{ kind: "text", text }] },
    },
    headers: HEADERS,
  });
  expect(res.status(), `createBlock(${pageId})`).toBe(201);
  return (await res.json()).data.block.id;
}

/** Create a fresh page in the first available workspace via the page context. */
export async function createFreshPageInFirstWorkspace(
  page: Page,
  title: string,
): Promise<{ wsId: string; pageId: string }> {
  const api = page.context().request;
  const wsId = (
    (await (await api.get(`${API}/workspaces`)).json()) as {
      data: { workspaces: { id: string }[] };
    }
  ).data.workspaces[0].id;
  const res = await api.post(`${API}/workspaces/${wsId}/pages`, {
    data: { title },
    headers: HEADERS,
  });
  expect(res.status()).toBe(201);
  const pageId = (await res.json()).data.page.id;
  return { wsId, pageId };
}
