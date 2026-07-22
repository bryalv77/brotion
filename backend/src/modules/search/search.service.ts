import { Prisma } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import { assertWorkspaceMember } from "../auth/permissions.service.js";
import type { SearchResultDTO } from "@notion-clone/shared";

/**
 * Search across a workspace's pages by title + denormalized content_text.
 *
 * Uses ILIKE for substring match (the tsvector column was removed in the
 * notion_migration_v1 migration). Inputs are escaped so user '%' / '_' are
 * treated literally, and the query is parameterized — no string interpolation.
 */
export async function searchPages(
  workspaceId: string,
  userId: string,
  query: string,
  limit = 20,
): Promise<SearchResultDTO[]> {
  await assertWorkspaceMember(workspaceId, userId);

  const trimmed = query.trim();
  if (!trimmed) return [];

  // Escape LIKE wildcards so they match literally.
  const pattern = `%${trimmed.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

  const rows = await getPrisma().$queryRaw<
    Array<{ id: string; title: string; snippet: string; rank: number }>
  >(Prisma.sql`
    SELECT
      id,
      title,
      coalesce(content_text, '') AS snippet,
      CASE
        WHEN title ILIKE ${pattern} THEN 2
        ELSE 1
      END AS rank
    FROM pages
    WHERE workspace_id = ${workspaceId}
      AND is_deleted = false
      AND (title ILIKE ${pattern} OR content_text ILIKE ${pattern})
    ORDER BY rank DESC, updated_at DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    page_id: r.id,
    title: r.title,
    snippet: r.snippet.slice(0, 200),
    rank: Number(r.rank),
  }));
}
