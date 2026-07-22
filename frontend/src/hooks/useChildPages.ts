import { useQuery } from "@tanstack/react-query";
import { listChildPages } from "../api/pages.js";

export function useChildPages(workspaceId: string | undefined, parentId: string | null) {
  return useQuery({
    queryKey: ["pages", "children", workspaceId, parentId],
    queryFn: () => listChildPages(workspaceId!, parentId),
    enabled: !!workspaceId,
  });
}
