import { getPrisma, disconnectPrisma } from "../src/prisma/client.js";
import { hashPassword } from "../src/security/password.js";

/**
 * Wipe all tables and re-seed the demo user/workspace/page.
 *
 * Used by the e2e globalSetup so every `playwright test` run starts from a
 * known state. The shared demo user is required by all UI tests, so we can't
 * just truncate — we re-create it (with the same fixed ids) right after.
 *
 * Order matters: child rows before parents. We use $transaction with raw SQL
 * `TRUNCATE ... CASCADE` because it's faster than deleting one model at a time
 * and respects FK dependencies automatically.
 */
async function main(): Promise<void> {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE
       "property_values",
       "properties",
       "database_views",
       "templates",
       "databases",
       "comments",
       "page_permissions",
       "attachments",
       "blocks",
       "pages",
       "workspace_members",
       "workspaces",
       "sessions",
       "users"
     RESTART IDENTITY CASCADE`,
  );

  const passwordHash = await hashPassword("password123");
  const user = await prisma.user.create({
    data: {
      email: "demo@notion.local",
      name: "Demo User",
      password_hash: passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      id: "demo-workspace",
      name: "My Workspace",
      icon: "🏠",
      created_by: user.id,
    },
  });
  await prisma.workspaceMember.create({
    data: {
      workspace_id: workspace.id,
      user_id: user.id,
      role: "OWNER",
    },
  });

  const page = await prisma.page.create({
    data: {
      id: "demo-welcome-page",
      workspace_id: workspace.id,
      title: "Welcome",
      created_by: user.id,
    },
  });
  await prisma.block.create({
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

  // eslint-disable-next-line no-console
  console.log("✓ e2e reset complete: demo user + workspace + Welcome page");
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("e2e reset failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectPrisma();
  });
