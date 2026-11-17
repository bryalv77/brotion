import { useQuery } from "@tanstack/react-query";
import { listPageDatabases } from "@/lib/data/databases";

export function usePageDatabases(pageId?: string) {
  return useQuery({
    queryKey: ["page-databases", pageId],
    queryFn: () => listPageDatabases(pageId!),
    enabled: !!pageId,
  });
}
