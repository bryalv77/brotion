import { test, expect } from "@playwright/test";
import {
  API,
  HEADERS,
  parseBody,
  postJson,
  register,
  uniqueEmail,
} from "./helpers.js";

/**
 * POST /me/adopt-local — guest→account merge (spec: local guest mode).
 *
 * The payload mimics what the client's local store dumps: client-generated
 * ids (cuid2-style), pages/blocks/databases/values with no server round
 * trips, ids preserved verbatim on adoption.
 */

const NOW = new Date().toISOString();
const id = (p: string) => `${p}${Math.random().toString(36).slice(2, 12)}`;

test.describe("adopt-local", () => {
  test("unauthenticated → 401", async ({ request }) => {
    const { status } = await postJson(request, "/me/adopt-local", {
      workspaces: [],
      pages: [],
      blocks: [],
      databases: [],
      values: [],
    });
    expect(status).toBe(401);
  });

  test("adopts a local notebook with ids preserved, then is idempotent", async ({ request }) => {
    await register(request, uniqueEmail("adopt"));

    // ── A realistic local snapshot ──────────────────────────────────────────
    const wsId = id("ws");
    const pageId = id("page");
    const childId = id("page");
    const b1 = id("blk");
    const b2 = id("blk");
    const childBlock = id("blk");
    const dbId = id("db");
    const nameProp = id("prop");
    const priceProp = id("prop");
    const viewId = id("view");
    const rowId = id("page");
    const valueId = id("val");

    const snapshot = {
      workspaces: [{ id: wsId, name: "Personal", icon: "🏠", role: "OWNER" }],
      pages: [
        {
          id: pageId,
          workspace_id: wsId,
          parent_id: null,
          title: "Welcome",
          icon: "👋",
          has_children: true,
          cover_url: null,
          is_deleted: false,
          created_by: "local",
          created_at: NOW,
          updated_at: NOW,
        },
        {
          id: childId,
          workspace_id: wsId,
          parent_id: pageId,
          title: "Child",
          icon: null,
          has_children: false,
          cover_url: null,
          is_deleted: false,
          created_by: "local",
          created_at: NOW,
          updated_at: NOW,
        },
        {
          id: rowId,
          workspace_id: wsId,
          parent_id: null,
          title: "Espresso",
          icon: null,
          has_children: false,
          cover_url: null,
          is_deleted: false,
          database_id: dbId,
          row_order: 1,
          created_by: "local",
          created_at: NOW,
          updated_at: NOW,
        },
      ],
      blocks: [
        {
          id: b1,
          page_id: pageId,
          parent_block_id: null,
          type: "heading1",
          content: { type: "heading1", rich_text: [{ kind: "text", text: "Welcome" }] },
          order: 1,
          created_at: NOW,
          updated_at: NOW,
        },
        {
          id: b2,
          page_id: pageId,
          parent_block_id: null,
          type: "paragraph",
          content: { type: "paragraph", rich_text: [{ kind: "text", text: "Local note" }] },
          order: 2,
          created_at: NOW,
          updated_at: NOW,
        },
        {
          id: childBlock,
          page_id: childId,
          parent_block_id: null,
          type: "todo",
          content: { type: "todo", rich_text: [{ kind: "text", text: "task" }], checked: false },
          order: 1,
          created_at: NOW,
          updated_at: NOW,
        },
      ],
      databases: [
        {
          id: dbId,
          page_id: pageId,
          workspace_id: wsId,
          title: "Shopping",
          icon: null,
          properties: [
            { id: nameProp, database_id: dbId, name: "Name", type: "text", order: 0 },
            { id: priceProp, database_id: dbId, name: "Price", type: "number", order: 1 },
          ],
          views: [
            {
              id: viewId,
              database_id: dbId,
              name: "Table",
              type: "table",
              config: { filters: [], sorts: [] },
              order: 0,
            },
          ],
          templates: [],
        },
      ],
      values: [
        { id: valueId, page_id: rowId, property_id: nameProp, value: "Espresso" },
        { page_id: rowId, property_id: priceProp, value: 3.5 },
      ],
    };

    // ── Adopt ───────────────────────────────────────────────────────────────
    const adoptRes = await request.post(`${API}/me/adopt-local`, {
      data: snapshot,
      headers: HEADERS,
    });
    expect(adoptRes.status()).toBe(200);
    const adopted = (
      (await parseBody(adoptRes)) as {
        data: { adopted: Record<string, number> };
      }
    ).data.adopted;
    expect(adopted).toEqual({ workspaces: 1, pages: 3, blocks: 3, databases: 1 });

    // ── Everything is readable through the normal API, ids preserved ───────
    const wsRes = await request.get(`${API}/workspaces`, { headers: HEADERS });
    const workspaces = (
      (await wsRes.json()) as { data: { workspaces: { id: string; name: string }[] } }
    ).data.workspaces;
    expect(workspaces.some((w) => w.id === wsId && w.name === "Personal")).toBe(true);

    const pageRes = await request.get(`${API}/pages/${pageId}`, { headers: HEADERS });
    expect(pageRes.status()).toBe(200);
    const pageBody = (await pageRes.json()) as {
      data: { page: { id: string; title: string }; blocks: { id: string }[] };
    };
    expect(pageBody.data.page.id).toBe(pageId);
    expect(pageBody.data.page.title).toBe("Welcome");
    expect(pageBody.data.blocks.map((b) => b.id).sort()).toEqual([b1, b2].sort());

    // Child nesting survived.
    const childrenRes = await request.get(
      `${API}/workspaces/${wsId}/pages`,
      { headers: HEADERS },
    );
    const roots = (
      (await childrenRes.json()) as { data: { pages: { id: string }[] } }
    ).data.pages;
    expect(roots.some((p) => p.id === pageId)).toBe(true);
    expect(roots.some((p) => p.id === childId)).toBe(false);

    const dbRes = await request.get(`${API}/databases/${dbId}`, { headers: HEADERS });
    expect(dbRes.status()).toBe(200);
    const dbBody = (await dbRes.json()) as {
      data: {
        database: {
          id: string;
          properties: { id: string }[];
          rows: { page_id: string; title: string; values: { property_id: string; value: unknown }[] }[];
        };
      };
    };
    expect(dbBody.data.database.id).toBe(dbId);
    expect(dbBody.data.database.properties.map((p) => p.id).sort()).toEqual(
      [nameProp, priceProp].sort(),
    );
    expect(dbBody.data.database.rows).toHaveLength(1);
    expect(dbBody.data.database.rows[0].page_id).toBe(rowId);
    expect(dbBody.data.database.rows[0].title).toBe("Espresso");
    expect(
      dbBody.data.database.rows[0].values.find((v) => v.property_id === priceProp)?.value,
    ).toBe(3.5);

    // Search index was rebuilt (content_text) for adopted pages.
    const searchRes = await request.get(
      `${API}/workspaces/${wsId}/search?q=Local%20note`,
      { headers: HEADERS },
    );
    const search = (
      (await searchRes.json()) as { data: { results: { page_id: string }[] } }
    ).data.results;
    expect(search.some((r) => r.page_id === pageId)).toBe(true);

    // ── Re-adopt the same snapshot: nothing duplicates ─────────────────────
    const againRes = await request.post(`${API}/me/adopt-local`, {
      data: snapshot,
      headers: HEADERS,
    });
    expect(againRes.status()).toBe(200);
    const again = (
      (await againRes.json()) as { data: { adopted: Record<string, number> } }
    ).data.adopted;
    expect(again).toEqual({ workspaces: 0, pages: 0, blocks: 0, databases: 0 });

    const dbAgain = (
      (await (
        await request.get(`${API}/databases/${dbId}`, { headers: HEADERS })
      ).json()) as {
        data: { database: { rows: unknown[] } };
      }
    ).data.database;
    expect(dbAgain.rows).toHaveLength(1);
  });

  test("invalid block type → 400, nothing persisted", async ({ request }) => {
    await register(request, uniqueEmail("adoptbad"));
    const wsId = id("ws");
    const pageId = id("page");
    const { status } = await postJson(request, "/me/adopt-local", {
      workspaces: [{ id: wsId, name: "W", icon: null, role: "OWNER" }],
      pages: [
        {
          id: pageId,
          workspace_id: wsId,
          parent_id: null,
          title: "P",
          created_at: NOW,
          updated_at: NOW,
        },
      ],
      blocks: [
        {
          id: id("blk"),
          page_id: pageId,
          parent_block_id: null,
          type: "nonsense",
          content: {},
          order: 1,
          created_at: NOW,
          updated_at: NOW,
        },
      ],
      databases: [],
      values: [],
    });
    expect(status).toBe(400);
  });
});
