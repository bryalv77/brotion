import { forwardRef, useState } from "react";
import { instantiatePageTemplate } from "../../api/page-templates.js";
import { useTemplatePrefs } from "../../hooks/useTemplatePrefs.js";
import { useToast } from "../../stores/toast.js";
import type { PageTemplateSummaryDTO } from "@notion-clone/shared";

export const TemplateCard = forwardRef<
  HTMLDivElement,
  {
    template: PageTemplateSummaryDTO;
    workspaceId: string;
    parentId: string | null;
    isFavorite: boolean;
    onClose: () => void;
    tabIndex: number;
    onFocus: () => void;
  }
>(function TemplateCard({ template, workspaceId, parentId, isFavorite, onClose, tabIndex, onFocus }, ref) {
  const { toggleFavorite, recordUsed } = useTemplatePrefs();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleUse() {
    if (isPending) return;
    setIsPending(true);
    try {
      const page = await instantiatePageTemplate(workspaceId, template.id, parentId);
      recordUsed(template.id);
      onClose();
      window.location.href = `/app/${workspaceId}/${page.id}`;
    } catch (err) {
      setIsPending(false);
      showToast(err instanceof Error ? err.message : "Failed to create page from template");
    }
  }

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={tabIndex}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void handleUse();
        }
      }}
      className="group relative flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 text-left outline-none hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 dark:border-neutral-700 dark:hover:border-blue-500 dark:focus:border-blue-500"
      style={{ borderTopColor: template.previewColor, borderTopWidth: 3 }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(template.id);
        }}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className="absolute right-2 top-2 text-lg text-neutral-300 hover:text-yellow-500 dark:text-neutral-600 dark:hover:text-yellow-400"
      >
        {isFavorite ? "★" : "☆"}
      </button>

      <div className="flex items-center gap-2">
        <span className="text-2xl">{template.icon}</span>
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {template.name}
        </span>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">{template.description}</p>

      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          void handleUse();
        }}
        disabled={isPending}
        className="mt-1 w-full rounded-md bg-blue-500 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity hover:bg-blue-600 focus:opacity-100 disabled:opacity-50 group-hover:opacity-100 group-focus:opacity-100"
      >
        {isPending ? "Creating…" : "Use Template"}
      </button>
    </div>
  );
});
