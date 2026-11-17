import { qk } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDatabase } from "@/lib/data/databases";

export function useCreateDatabase(pageId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; icon?: string }) =>
      createDatabase(pageId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.pageDatabases(pageId!) });
      qc.invalidateQueries({ queryKey: qk.page(pageId!) });
    },
  });
}
