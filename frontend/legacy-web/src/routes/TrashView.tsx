import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTrashedPages, restorePage, permanentDeletePage } from "../api/pages.js";

export function TrashView() {
  const { wsId } = useParams();
  const qc = useQueryClient();
  const { data: pages, isLoading } = useQuery({
    queryKey: ["trash", wsId],
    queryFn: () => listTrashedPages(wsId!),
    enabled: !!wsId,
  });

  const restoreMut = useMutation({
    mutationFn: (pageId: string) => restorePage(pageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash", wsId] });
      qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });

  const permDeleteMut = useMutation({
    mutationFn: (pageId: string) => permanentDeletePage(pageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trash", wsId] }),
  });

  return (
    <div className="mx-auto max-w-3xl px-16 py-12">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        🗑️ Trash
      </h1>
      {isLoading && (
        <p className="text-sm text-neutral-400">Loading…</p>
      )}
      {pages && pages.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-400">
          Trash is empty.
        </p>
      )}
      <div className="space-y-2">
        {pages?.map((page) => (
          <div
            key={page.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-2.5 dark:border-neutral-600"
          >
            <span className="text-lg">{page.icon || "📄"}</span>
            <span className="flex-1 truncate text-sm text-neutral-700 dark:text-neutral-300">
              {page.title || "Untitled"}
            </span>
            <button
              onClick={() => restoreMut.mutate(page.id)}
              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Restore
            </button>
            <button
              onClick={() => {
                if (confirm("Permanently delete this page? This cannot be undone.")) {
                  permDeleteMut.mutate(page.id);
                }
              }}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              Delete forever
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
