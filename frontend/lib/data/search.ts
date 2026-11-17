import type { SearchResultDTO } from "@notion-clone/shared";
import * as local from "./local/search";
import { isLocalMode } from "./mode";
import { request } from "@/lib/api/client";

/** Repository seam over workspace search (local mode never hits the API). */
export async function search(
  workspaceId: string,
  q: string,
): Promise<SearchResultDTO[]> {
  if (isLocalMode()) return local.search(workspaceId, q);
  const data = await request<{ results: SearchResultDTO[] }>(
    `workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}`,
  );
  return data.results;
}
