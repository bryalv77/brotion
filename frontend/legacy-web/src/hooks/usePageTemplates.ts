import { useQuery } from "@tanstack/react-query";
import { listPageTemplates } from "../api/page-templates.js";

export function usePageTemplates() {
  return useQuery({
    queryKey: ["page-templates"],
    queryFn: listPageTemplates,
  });
}
