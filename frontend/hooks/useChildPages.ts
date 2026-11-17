import { useQuery } from "@tanstack/react-query";
import { listChildPages } from "@/lib/data/pages";

export function useChildPages(workspaceId: string | undefined, parentId: string | null) {
  return useQuery({
    queryKey: ["pages", "children", workspaceId, parentId],
    queryFn: () => listChildPages(workspaceId!, parentId),
    enabled: !!workspaceId,
  });
}
