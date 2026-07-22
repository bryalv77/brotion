import { getPrisma } from "../src/prisma/client.js";
import { hashPassword } from "../src/security/password.js";

/**
 * Seed demo data so the app is usable out of the box:
 *   user:      demo@notion.local / password123
 *   workspace: "My Workspace" (owned by demo user)
 *   page:      "Welcome" with one paragraph block
 *
 * Idempotent: re-running upserts the existing demo data instead of failing.
 */
async function main(): Promise<void> {
  const prisma = getPrisma();
  const passwordHash = await hashPassword("password123");
  const user = await prisma.user.upsert({
    where: { email: "demo@notion.local" },
    update: { password_hash: passwordHash, name: "Demo User" },
    create: {
      email: "demo@notion.local",
      name: "Demo User",
      password_hash: passwordHash,
    },
  });

  // Workspace (create + upsert membership to remain idempotent).
  const workspace = await prisma.workspace.upsert({
    where: { id: "demo-workspace" },
    update: { name: "My Workspace", icon: "🏠" },
    create: {
      id: "demo-workspace",
      name: "My Workspace",
      icon: "🏠",
      created_by: user.id,
    },
  });
  await prisma.workspaceMember.upsert({
    where: {
      workspace_id_user_id: { workspace_id: workspace.id, user_id: user.id },
    },
    update: { role: "OWNER" },
    create: {
      workspace_id: workspace.id,
      user_id: user.id,
      role: "OWNER",
    },
  });

  // Welcome page + one block.
  const page = await prisma.page.upsert({
    where: { id: "demo-welcome-page" },
    update: { title: "Welcome", created_by: user.id },
    create: {
      id: "demo-welcome-page",
      workspace_id: workspace.id,
      title: "Welcome",
      created_by: user.id,
    },
  });
  const existingBlock = await prisma.block.findFirst({
    where: { page_id: page.id },
  });
  if (!existingBlock) {
    const created = await prisma.block.create({
      data: {
        page_id: page.id,
        type: "paragraph",
        content: {
          type: "paragraph",
          rich_text: [
            {
              kind: "text",
              text: "Welcome to your Notion clone. Start writing here.",
            },
          ],
        },
        order: 1.0,
        created_by: user.id,
      },
    });
    await refreshContentText(page.id, created.content);
  }

  // eslint-disable-next-line no-console
  console.log(
    "✓ Seed complete: demo user + workspace 'My Workspace' + 'Welcome' page",
  );
}

/** Keep pages.content_text in sync with block text (mirrors the service helper). */
async function refreshContentText(
  pageId: string,
  _blockContent: unknown,
): Promise<void> {
  const prisma = getPrisma();
  const blocks = await prisma.block.findMany({ where: { page_id: pageId } });
  const text = blocks
    .map((b) => extractText(b.content))
    .filter(Boolean)
    .join(" ");
  await prisma.page.update({
    where: { id: pageId },
    data: { content_text: text },
  });
}

function extractText(content: unknown): string {
  if (typeof content !== "object" || content === null) return "";
  const c = content as Record<string, unknown>;
  if (typeof c.text === "string") return c.text;
  if (Array.isArray(c.rich_text)) {
    return c.rich_text
      .map((r) =>
        typeof r === "object" && r !== null && "text" in r
          ? String((r as Record<string, unknown>).text ?? "")
          : "",
      )
      .join(" ");
  }
  return "";
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { disconnectPrisma } = await import("../src/prisma/client.js");
    await disconnectPrisma();
  });
