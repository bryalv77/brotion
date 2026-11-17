import { useMemo, useRef, useState } from "react";
import { usePageTemplates } from "../../hooks/usePageTemplates.js";
import { useTemplatePrefs } from "../../hooks/useTemplatePrefs.js";
import { TemplateCard } from "./TemplateCard.js";

export function TemplateGalleryModal({
  workspaceId,
  parentId,
  onBack,
  onClose,
}: {
  workspaceId: string;
  parentId: string | null;
  onBack: () => void;
  onClose: () => void;
}) {
  const { data: templates, isLoading } = usePageTemplates();
  const { favorites, recents } = useTemplatePrefs();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const categories = useMemo(() => {
    if (!templates) return [];
    return Array.from(new Set(templates.map((t) => t.category))).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    if (!templates) return [];
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (category && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [templates, search, category]);

  const recentTemplates = useMemo(() => {
    if (!templates || recents.length === 0) return [];
    return recents
      .map((id) => templates.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t));
  }, [templates, recents]);

  function focusCard(index: number) {
    const clamped = Math.max(0, Math.min(filtered.length - 1, index));
    setFocusedIndex(clamped);
    cardRefs.current[clamped]?.focus();
  }

  function handleGridKeyDown(e: React.KeyboardEvent) {
    const columns = 3;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusCard(focusedIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusCard(focusedIndex - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCard(focusedIndex + columns);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCard(focusedIndex - columns);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[8vh] dark:bg-black/50"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <button
            onClick={onBack}
            title="Back"
            className="rounded px-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            ←
          </button>
          <input
            autoFocus
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none dark:text-neutral-100"
          />
          <button
            onClick={onClose}
            className="rounded px-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            ✕
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                category === null
                  ? "bg-blue-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  category === c
                    ? "bg-blue-500 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto p-4">
          {isLoading && (
            <p className="py-8 text-center text-sm text-neutral-400">Loading templates…</p>
          )}

          {!isLoading && recentTemplates.length > 0 && !search && !category && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Recently Used
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {recentTemplates.map((t) => (
                  <TemplateCard
                    key={`recent-${t.id}`}
                    template={t}
                    workspaceId={workspaceId}
                    parentId={parentId}
                    isFavorite={favorites.includes(t.id)}
                    onClose={onClose}
                    tabIndex={-1}
                    onFocus={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {search || category ? "Results" : "All Templates"}
              </h3>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">No templates match.</p>
              ) : (
                <div
                  className="grid grid-cols-3 gap-3"
                  onKeyDown={handleGridKeyDown}
                >
                  {filtered.map((t, i) => (
                    <TemplateCard
                      key={t.id}
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      template={t}
                      workspaceId={workspaceId}
                      parentId={parentId}
                      isFavorite={favorites.includes(t.id)}
                      onClose={onClose}
                      tabIndex={i === focusedIndex ? 0 : -1}
                      onFocus={() => setFocusedIndex(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
