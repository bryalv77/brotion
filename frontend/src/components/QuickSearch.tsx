import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUI } from "../stores/ui.js";
import { request } from "../api/client.js";
import type { SearchResultDTO } from "@notion-clone/shared";

export function QuickSearch() {
  const { quickSearchOpen, setQuickSearchOpen } = useUI();
  const { wsId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultDTO[]>([]);

  if (!quickSearchOpen) return null;

  async function handleSearch(q: string) {
    setQuery(q);
    if (!q.trim() || !wsId) {
      setResults([]);
      return;
    }
    try {
      const data = await request<{ results: SearchResultDTO[] }>(
        `workspaces/${wsId}/search?q=${encodeURIComponent(q)}`,
      );
      setResults(data.results);
    } catch {
      setResults([]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[15vh] dark:bg-black/50"
      onClick={() => setQuickSearchOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="text"
          placeholder="Search pages…"
          value={query}
          onChange={(e) => void handleSearch(e.target.value)}
          className="w-full rounded-t-xl border-b border-neutral-200 px-4 py-3 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query.trim() && (
            <p className="px-2 py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No results
            </p>
          )}
          {results.map((r) => (
            <button
              key={r.page_id}
              onClick={() => {
                navigate(`/app/${wsId}/${r.page_id}`);
                setQuickSearchOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {r.title || "Untitled"}
              </span>
              {r.snippet && (
                <span
                  className="text-xs text-neutral-500 dark:text-neutral-400"
                  dangerouslySetInnerHTML={{ __html: r.snippet }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
