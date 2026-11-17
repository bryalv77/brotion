import type { SearchResultDTO } from "@notion-clone/shared";
import { getLocalStore } from "@/lib/local/store";
import { extractText } from "@notion-clone/shared";

/**
 * Local (guest) search: case-insensitive title + block-text matching over
 * the workspace's live pages, with the same result shape the server returns.
 */
export async function search(
  workspaceId: string,
  q: string,
): Promise<SearchResultDTO[]> {
  const store = getLocalStore();
  const needle = q.trim().toLowerCase();
  if (!needle) return [];

  const pages = await store.findPages(
    (p) =>
      p.workspace_id === workspaceId && !p.is_deleted && !p.is_template,
  );
  const results: SearchResultDTO[] = [];
  for (const page of pages) {
    const titleHit = page.title.toLowerCase().includes(needle);
    let snippet = "";
    if (!titleHit) {
      const blocks = await store.listBlocks(page.id);
      for (const b of blocks) {
        const text = extractText(b.content);
        const idx = text.toLowerCase().indexOf(needle);
        if (idx !== -1) {
          snippet = text.slice(Math.max(0, idx - 30), idx + 90).trim();
          break;
        }
      }
      if (!snippet) continue;
    }
    results.push({
      page_id: page.id,
      title: page.title,
      snippet,
      rank: titleHit ? 0 : 1,
    });
  }
  return results
    .sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title))
    .slice(0, 20);
}
