import { useState } from "react";
import { useCreatePage } from "../../hooks/useCreatePage.js";
import { TemplateGalleryModal } from "./TemplateGalleryModal.js";

/**
 * First-click modal for creating a page: "Blank Page" (today's behavior,
 * unchanged) or "Choose a Template" (opens the gallery in its place).
 */
export function NewPageModal({
  workspaceId,
  parentId,
  onClose,
}: {
  workspaceId: string;
  parentId: string | null;
  onClose: () => void;
}) {
  const [view, setView] = useState<"choice" | "gallery">("choice");
  const createPage = useCreatePage(workspaceId);

  if (view === "gallery") {
    return (
      <TemplateGalleryModal
        workspaceId={workspaceId}
        parentId={parentId}
        onBack={() => setView("choice")}
        onClose={onClose}
      />
    );
  }

  function handleBlankPage() {
    createPage.mutate(
      { title: "", parent_id: parentId },
      {
        onSuccess: (page) => {
          onClose();
          window.location.href = `/app/${workspaceId}/${page.id}`;
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-2 shadow-xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          New page
        </div>
        <button
          onClick={handleBlankPage}
          disabled={createPage.isPending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
        >
          <span className="text-xl">📄</span>
          <span>
            <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Blank Page
            </span>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400">
              Start with an empty page
            </span>
          </span>
        </button>
        <button
          onClick={() => setView("gallery")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <span className="text-xl">🗂️</span>
          <span>
            <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Choose a Template
            </span>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400">
              Start pre-filled with pages, databases, and sample content
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
