import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DatabaseViewDTO, ViewConfig, ViewType } from "@notion-clone/shared";
import {
  getDatabase,
  deleteDatabase,
  updatePropertyValue,
  createView,
  updateView,
} from "../api/databases.js";
import { TableView } from "./db/views/TableView.js";
import { ListView } from "./db/views/ListView.js";
import { BoardView } from "./db/views/BoardView.js";
import { GalleryView } from "./db/views/GalleryView.js";
import { FilterSortBar } from "./db/FilterSortBar.js";

interface DatabaseViewProps {
  databaseId: string;
}

/**
 * Database shell: title + view tabs + filter/sort bar, delegating the body to
 * a renderer chosen by the active view's type. Views are persisted lenses on
 * the same underlying rows (one data source, many views).
 */
export function DatabaseView({ databaseId }: DatabaseViewProps) {
  const qc = useQueryClient();
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  // Fetch with the active view applied (filters/sorts server-side).
  const { data: db, isLoading } = useQuery({
    queryKey: ["database", databaseId, activeViewId],
    queryFn: () => getDatabase(databaseId, activeViewId ?? undefined),
  });

  const activeView: DatabaseViewDTO | undefined =
    db?.views.find((v) => v.id === activeViewId) ?? db?.views[0];
  const config: ViewConfig = activeView?.config ?? { filters: [], sorts: [] };
  const hidden = config.hidden ?? [];

  const deleteMut = useMutation({
    mutationFn: () => deleteDatabase(databaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-databases"] });
      qc.invalidateQueries({ queryKey: ["page"] });
    },
  });

  const updateCell = useCallback(
    (rowPageId: string, propertyId: string, value: unknown) => {
      // Optimistic update of the cell so the value reflects immediately; the
      // invalidation below overwrites with authoritative server state.
      qc.setQueryData<typeof db>(["database", databaseId, activeViewId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map((r) =>
            r.page_id === rowPageId
              ? {
                  ...r,
                  values: [
                    ...r.values.filter((v) => v.property_id !== propertyId),
                    { id: "", property_id: propertyId, value },
                  ],
                }
              : r,
          ),
        };
      });
      updatePropertyValue(rowPageId, propertyId, value).then(() =>
        qc.invalidateQueries({ queryKey: ["database", databaseId] }),
      );
    },
    [databaseId, activeViewId, qc],
  );

  const persistConfig = useCallback(
    (cfg: ViewConfig) => {
      if (!activeView) return;
      updateView(databaseId, activeView.id, { config: cfg }).then(() =>
        qc.invalidateQueries({ queryKey: ["database", databaseId] }),
      );
    },
    [databaseId, activeView, qc],
  );

  const createViewMut = useMutation({
    mutationFn: (input: { name: string; type: ViewType }) =>
      createView(databaseId, input),
    onSuccess: (view) => {
      qc.invalidateQueries({ queryKey: ["database", databaseId] });
      setActiveViewId(view.id);
    },
  });

  if (isLoading || !db) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{db.icon || "📊"}</span>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {db.title || "Untitled database"}
        </h2>
        <button
          onClick={() => deleteMut.mutate()}
          className="ml-auto rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
        >
          Delete
        </button>
      </div>

      {/* View tabs */}
      <div className="mb-2 flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {db.views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveViewId(v.id)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-xs ${
              activeView?.id === v.id
                ? "border-blue-500 font-medium text-neutral-800 dark:text-neutral-100"
                : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {viewIcon(v.type)} {v.name}
          </button>
        ))}
        <div className="relative">
          <button
            data-testid="add-view-btn"
            onClick={() => setViewMenuOpen(!viewMenuOpen)}
            className="px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            title="Add view"
          >
            +
          </button>
          {viewMenuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900">
              {(["table", "list", "board", "gallery"] as ViewType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    createViewMut.mutate({ name: cap(t), type: t });
                    setViewMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {viewIcon(t)} {cap(t)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter / sort bar */}
      <div className="mb-3">
        <FilterSortBar db={db} config={config} onChange={persistConfig} />
        {/* Board views also expose a group-by selector. */}
        {activeView?.type === "board" && (
          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            Group by
            <select
              data-testid="group-by-select"
              value={config.group_by ?? ""}
              onChange={(e) =>
                persistConfig({ ...config, group_by: e.target.value || null })
              }
              className="rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="">—</option>
              {db.properties
                .filter((p) => p.type === "select" || p.type === "status" || p.type === "multi_select")
                .map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Body renderer */}
      {activeView?.type === "table" || !activeView ? (
        <TableView db={db} hidden={hidden} updateCell={updateCell} />
      ) : activeView.type === "list" ? (
        <ListView db={db} hidden={hidden} updateCell={updateCell} />
      ) : activeView.type === "board" ? (
        <BoardView db={db} view={activeView} />
      ) : (
        <GalleryView db={db} hidden={hidden} />
      )}
    </div>
  );
}

function viewIcon(type: ViewType): string {
  switch (type) {
    case "table":
      return "📋";
    case "list":
      return "☰";
    case "board":
      return "📑";
    case "gallery":
      return "🖼️";
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
