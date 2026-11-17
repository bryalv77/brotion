import { useState } from "react";
import type { DatabaseDTO, Filter, FilterOp, Sort, ViewConfig } from "@notion-clone/shared";

/**
 * A compact filter + sort builder for a view. Edits call `onChange` with the
 * updated ViewConfig (the parent persists it via PATCH /views/:id).
 */
export function FilterSortBar({
  db,
  config,
  onChange,
}: {
  db: DatabaseDTO;
  config: ViewConfig;
  onChange: (cfg: ViewConfig) => void;
}) {
  const [openPanel, setOpenPanel] = useState<"filter" | "sort" | null>(null);

  const updateFilters = (filters: Filter[]) =>
    onChange({ ...config, filters });
  const updateSorts = (sorts: Sort[]) => onChange({ ...config, sorts });

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setOpenPanel(openPanel === "filter" ? null : "filter")}
        className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        🔎 Filter{config.filters.length > 0 ? ` (${config.filters.length})` : ""}
      </button>
      <button
        onClick={() => setOpenPanel(openPanel === "sort" ? null : "sort")}
        className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        ↕ Sort{config.sorts.length > 0 ? ` (${config.sorts.length})` : ""}
      </button>

      {openPanel === "filter" && (
        <Panel onClose={() => setOpenPanel(null)}>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-neutral-500">Filters (AND)</div>
            {config.filters.map((f, i) => (
              <div key={i} className="flex items-center gap-1">
                <select
                  value={f.property}
                  onChange={(e) =>
                    updateFilters(
                      config.filters.map((x, j) =>
                        j === i ? { ...x, property: e.target.value } : x,
                      ),
                    )
                  }
                  className="rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {db.properties.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={f.op}
                  onChange={(e) =>
                    updateFilters(
                      config.filters.map((x, j) =>
                        j === i ? { ...x, op: e.target.value as FilterOp } : x,
                      ),
                    )
                  }
                  className="rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {["eq", "ne", "contains", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty", "any_of", "none_of"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {f.op !== "is_empty" && f.op !== "is_not_empty" && (
                  <input
                    type="text"
                    value={typeof f.value === "string" ? f.value : Array.isArray(f.value) ? f.value.join(",") : String(f.value ?? "")}
                    onChange={(e) =>
                      updateFilters(
                        config.filters.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      )
                    }
                    className="w-24 rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                )}
                <button
                  onClick={() => updateFilters(config.filters.filter((_, j) => j !== i))}
                  className="text-neutral-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateFilters([
                  ...config.filters,
                  { property: db.properties[0]?.name ?? "", op: "contains", value: "" },
                ])
              }
              className="self-start rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              + Add filter
            </button>
          </div>
        </Panel>
      )}

      {openPanel === "sort" && (
        <Panel onClose={() => setOpenPanel(null)}>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-neutral-500">Sorts</div>
            {config.sorts.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <select
                  value={s.property}
                  onChange={(e) =>
                    updateSorts(
                      config.sorts.map((x, j) =>
                        j === i ? { ...x, property: e.target.value } : x,
                      ),
                    )
                  }
                  className="rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {db.properties.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={s.direction}
                  onChange={(e) =>
                    updateSorts(
                      config.sorts.map((x, j) =>
                        j === i ? { ...x, direction: e.target.value as "asc" | "desc" } : x,
                      ),
                    )
                  }
                  className="rounded border border-neutral-300 px-1 py-0.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <button
                  onClick={() => updateSorts(config.sorts.filter((_, j) => j !== i))}
                  className="text-neutral-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateSorts([
                  ...config.sorts,
                  { property: db.properties[0]?.name ?? "", direction: "asc" },
                ])
              }
              className="self-start rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              + Add sort
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-600 dark:bg-neutral-900"
      onMouseLeave={onClose}
    >
      {children}
    </div>
  );
}
