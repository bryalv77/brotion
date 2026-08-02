import { useQuery } from "@tanstack/react-query";
import { getPageBreadcrumbs } from "../api/pages.js";

/** Ancestor chain (root→leaf) for the breadcrumb bar at the top of a page. */
export function usePageBreadcrumbs(pageId: string | undefined) {
  return useQuery({
    queryKey: ["pages", "ancestors", pageId],
    queryFn: () => getPageBreadcrumbs(pageId!),
    enabled: !!pageId,
    staleTime: 30_000,
  });
}
