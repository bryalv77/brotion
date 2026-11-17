import type { SearchResultDTO } from "@notion-clone/shared";
import { request } from "./client";

export async function search(workspaceId: string, q: string): Promise<SearchResultDTO[]> {
  const data = await request<{ results: SearchResultDTO[] }>(
    `workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}`,
  );
  return data.results;
}
