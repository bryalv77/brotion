import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDatabase } from "../api/databases.js";

export function useCreateDatabase(pageId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; icon?: string }) =>
      createDatabase(pageId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-databases", pageId] });
    },
  });
}
