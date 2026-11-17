import { useQuery } from "@tanstack/react-query";
import { listPageDatabases } from "../api/databases.js";

export function usePageDatabases(pageId?: string) {
  return useQuery({
    queryKey: ["page-databases", pageId],
    queryFn: () => listPageDatabases(pageId!),
    enabled: !!pageId,
  });
}
