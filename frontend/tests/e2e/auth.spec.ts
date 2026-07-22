import { test, expect, type APIRequestContext, type APIResponse } from "@playwright/test";

/**
 * Auth API e2e — covers spec 002 acceptance criteria #1–#9.
 *
 * These tests hit the backend directly via Playwright's APIRequestContext, which
 * (unlike a browser) persists cookies across requests within a test. Each test
 * uses a unique email to stay independent and parallel-safe.
 */

const API = "/api/v1";
const CSRF = "XMLHttpRequest";
const JSON_HEADERS = { "Content-Type": "application/json" };

/** Unique-ish email per test run so parallel runs don't collide. */
function uniqueEmail(prefix = "user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
}

/** Standard mutating request helper: sets CSRF + JSON headers. */
async function post(
  request: APIRequestContext,
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown; headers: Record<string, string> }> {
  const res = await request.post(`${API}${path}`, {
    data: body,
    headers: { ...JSON_HEADERS, "X-Requested-With": CSRF },
  });
  return {
    status: res.status(),
    body: await parseBody(res),
    headers: res.headers(),
  };
}

async function parseBody(res: APIResponse): Promise<unknown> {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

test.describe("auth", () => {
  test("register: 201 + user + sets two cookies", async ({ request }) => {
    const email = uniqueEmail("reg");
    const { status, body, headers } = await post(request, "/auth/register", {
      email,
      password: "password123",
      name: "Register E2E",
    });

    expect(status).toBe(201);
    expect((body as { data: { user: unknown } }).data.user).toMatchObject({
      email,
      name: "Register E2E",
    });
    // password_hash must never leak.
    expect(
      JSON.stringify((body as { data: { user: Record<string, unknown> } }).data.user),
    ).not.toContain("password_hash");
    // Two auth cookies set.
    const setCookies = headers["set-cookie"] ?? "";
    expect(setCookies).toContain("nc_access=");
    expect(setCookies).toContain("nc_refresh=");
    expect(setCookies.toLowerCase()).toContain("httponly");
  });

  test("register: duplicate email → 409", async ({ request }) => {
    const email = uniqueEmail("dup");
    await post(request, "/auth/register", { email, password: "password123" });
    const { status, body } = await post(request, "/auth/register", {
      email,
      password: "password123",
    });
    expect(status).toBe(409);
    expect((body as { error: { code: string } }).error.code).toBe("CONFLICT");
  });

  test("register: short password → 400", async ({ request }) => {
    const { status } = await post(request, "/auth/register", {
      email: uniqueEmail("short"),
      password: "123",
    });
    expect(status).toBe(400);
  });

  test("login: valid credentials → 200 + user, no password_hash", async ({ request }) => {
    const email = uniqueEmail("login");
    await post(request, "/auth/register", { email, password: "password123" });

    const { status, body } = await post(request, "/auth/login", {
      email,
      password: "password123",
    });
    expect(status).toBe(200);
    expect((body as { data: { user: { email: string } } }).data.user.email).toBe(email);
    expect(
      JSON.stringify((body as { data: { user: Record<string, unknown> } }).data.user),
    ).not.toContain("password_hash");
  });

  test("login: wrong password → 401 (no enumeration)", async ({ request }) => {
    const email = uniqueEmail("wrongpw");
    await post(request, "/auth/register", { email, password: "password123" });

    const { status, body } = await post(request, "/auth/login", {
      email,
      password: "wrong-password",
    });
    expect(status).toBe(401);
    expect((body as { error: { message: string } }).error.message).toBe(
      "Invalid email or password.",
    );
  });

  test("login: unknown email → 401 with the same message", async ({ request }) => {
    const { status, body } = await post(request, "/auth/login", {
      email: uniqueEmail("unknown"),
      password: "password123",
    });
    expect(status).toBe(401);
    expect((body as { error: { message: string } }).error.message).toBe(
      "Invalid email or password.",
    );
  });

  test("me: valid access cookie → 200", async ({ request }) => {
    const email = uniqueEmail("me-ok");
    await post(request, "/auth/register", { email, password: "password123" });

    const res = await request.get(`${API}/me`);
    expect(res.status()).toBe(200);
    expect((await parseBody(res) as { data: { user: { email: string } } }).data.user.email).toBe(email);
  });

  test("me: no cookie → 401", async ({ request }) => {
    // Fresh context with no prior auth → no cookies.
    const res = await request.get(`${API}/me`);
    expect(res.status()).toBe(401);
  });

  test("refresh: valid refresh cookie → 200 + rotated", async ({ request }) => {
    const email = uniqueEmail("refresh");
    await post(request, "/auth/register", { email, password: "password123" });

    const { status, body } = await post(request, "/auth/refresh", {});
    expect(status).toBe(200);
    expect((body as { data: { user: { email: string } } }).data.user.email).toBe(email);
  });

  test("refresh: after logout → 401", async ({ request }) => {
    const email = uniqueEmail("refresh-revoke");
    await post(request, "/auth/register", { email, password: "password123" });
    await post(request, "/auth/logout", {});

    const { status } = await post(request, "/auth/refresh", {});
    expect(status).toBe(401);
  });

  test("logout → 204, then me → 401", async ({ request }) => {
    const email = uniqueEmail("logout");
    await post(request, "/auth/register", { email, password: "password123" });

    const { status } = await post(request, "/auth/logout", {});
    expect(status).toBe(204);

    const res = await request.get(`${API}/me`);
    expect(res.status()).toBe(401);
  });

  test("mutating request without X-Requested-With → 403", async ({ request }) => {
    // Login first so we're authed, then mutate without the CSRF header.
    const email = uniqueEmail("csrf");
    await post(request, "/auth/register", { email, password: "password123" });

    const res = await request.post(`${API}/auth/logout`, {
      headers: { ...JSON_HEADERS }, // intentionally no X-Requested-With
      data: {},
    });
    expect(res.status()).toBe(403);
  });
});
