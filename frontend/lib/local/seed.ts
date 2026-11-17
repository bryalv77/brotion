import type { BlockDTO } from "@notion-clone/shared";
import { getLocalStore } from "./store";
import { newId } from "./ids";

/**
 * Bootstrap for guest mode: one "Personal" workspace so a visitor lands in a
 * usable notebook instead of an empty state.
 *
 * - Brand-new visitor: workspace + welcome page with starter blocks.
 * - Returning guest (local data was adopted into an account, then signed
 *   out): a clean empty workspace — the first-run content never repeats.
 */
export async function ensureLocalSeeded(): Promise<void> {
  const store = getLocalStore();
  if ((await store.listWorkspaces()).length > 0) return;

  const wsId = newId();
  const seeded = await store.getMeta<boolean>("seeded");
  if (seeded) {
    // Returning guest: empty notebook, no welcome page again.
    await store.putWorkspace({ id: wsId, name: "Personal", icon: "🏠", role: "OWNER" });
    return;
  }

  const pageId = newId();
  const now = new Date().toISOString();

  await store.putWorkspace({
    id: wsId,
    name: "Personal",
    icon: "🏠",
    role: "OWNER",
  });

  await store.putPage({
    id: pageId,
    workspace_id: wsId,
    parent_id: null,
    title: "Welcome",
    icon: "👋",
    has_children: false,
    cover_url: null,
    is_deleted: false,
    created_by: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    row_order: 0,
    is_template: false,
  });

  const contents: Array<Record<string, unknown>> = [
    { type: "heading1", rich_text: [text("Welcome to your notebook")] },
    {
      type: "paragraph",
      rich_text: [
        text("Everything you write here is saved on this device — no account needed. Type "),
        text("/", "code"),
        text(" on an empty line to insert blocks, or use the sidebar to add pages."),
      ],
    },
    {
      type: "todo",
      rich_text: [text("Write your first note")],
      checked: false,
    },
    {
      type: "todo",
      rich_text: [text("Press the ➕ in the sidebar to create a page")],
      checked: false,
    },
    {
      type: "callout",
      rich_text: [
        text(
          "Want your notes on every device? Use “Sign in to sync” in the sidebar — your local notes are uploaded when you create an account.",
        ),
      ],
      icon: "💡",
      color: "blue",
    },
  ];
  await store.putBlocks(contents.map((c, i) => block(pageId, c, i)));

  await store.setMeta("seeded", true);
}

function text(t: string, mark?: "code") {
  return { kind: "text", text: t, ...(mark ? { marks: [mark] } : {}) };
}

function block(
  pageId: string,
  content: Record<string, unknown>,
  order: number,
): BlockDTO {
  const now = new Date().toISOString();
  return {
    id: newId(),
    page_id: pageId,
    parent_block_id: null,
    type: content.type as BlockDTO["type"],
    content: content as unknown as BlockDTO["content"],
    order: order + 1,
    created_at: now,
    updated_at: now,
  };
}
