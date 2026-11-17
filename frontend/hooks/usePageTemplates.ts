import { useQuery } from "@tanstack/react-query";
import { listPageTemplates } from "@/lib/data/page-templates";

export function usePageTemplates() {
  return useQuery({
    queryKey: ["page-templates"],
    queryFn: listPageTemplates,
  });
}
