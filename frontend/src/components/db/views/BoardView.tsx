import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { DatabaseDTO, DatabaseViewDTO } from "@notion-clone/shared";
import { updatePropertyValue } from "../../../api/databases.js";
import { readSelectOptions, colorFor } from "../helpers.js";

// Module-level drag state (read during dragover; dataTransfer is restricted).
let draggedRowId: string | null = null;

/**
 * Kanban board. Groups rows by a select/status/multi_select property named in
 * `view.config.group_by`. If none is set (or the property has no options),
 * shows a prompt to configure grouping. Dragging a card to another column
 * PATCHes the row's cell to that column's value.
 */
export function BoardView({
  db,
  view,
}: {
  db: DatabaseDTO;
  view: DatabaseViewDTO;
}) {
  const navigate = useNavigate();
  const { wsId } = useParams();
  const qc = useQueryClient();

  const groupByName = view.config.group_by;
  const groupProp = db.properties.find((p) => p.name === groupByName);
  const isGroupable =
    groupProp &&
    (groupProp.type === "select" ||
      groupProp.type === "status" ||
      groupProp.type === "multi_select");
  const options = groupProp ? readSelectOptions(groupProp.options) : [];

  if (!isGroupable || options.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400 dark:border-neutral-600">
        Set a <strong>group_by</strong> property (a Select, Status, or Multi-select
        with options) in this view's config to see a board.
        <div className="mt-2 text-xs">
          Group by: {groupByName ?? "—"} ({groupProp?.type ?? "none"})
        </div>
      </div>
    );
  }

  const isMulti = groupProp!.type === "multi_select";

  // Partition rows into columns. A row with no value → "No status" column.
  const groups = new Map<string, typeof db.rows>();
  for (const o of options) groups.set(o.value, []);
  groups.set("__none__", []);
  for (const row of db.rows) {
    const val = row.values.find((v) => v.property_id === groupProp!.id)?.value;
    const arr = Array.isArray(val) ? (val as string[]) : val ? [String(val)] : [];
    if (arr.length === 0) {
      groups.get("__none__")!.push(row);
      continue;
    }
    for (const s of arr) {
      if (groups.has(s)) groups.get(s)!.push(row);
    }
  }

  const handleDrop = (rowId: string, columnValue: string | null) => {
    if (isMulti) {
      // Replace the set with just the dropped column (simple, predictable).
      updatePropertyValue(rowId, groupProp!.id, columnValue ? [columnValue] : []).then(() =>
        qc.invalidateQueries({ queryKey: ["database", db.id] }),
      );
    } else {
      updatePropertyValue(rowId, groupProp!.id, columnValue).then(() =>
        qc.invalidateQueries({ queryKey: ["database", db.id] }),
      );
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[...groups.entries()].map(([key, rows]) => {
        const label = key === "__none__" ? "No status" : key;
        return (
          <BoardColumn
            key={key}
            title={label}
            rows={rows}
            primaryPropId={db.properties[0]?.id}
            onDrop={(rowId) => handleDrop(rowId, key === "__none__" ? null : key)}
            onCardClick={(rowId) => wsId && navigate(`/app/${wsId}/${rowId}`)}
          />
        );
      })}
    </div>
  );
}

function BoardColumn({
  title,
  rows,
  primaryPropId,
  onDrop,
  onCardClick,
}: {
  title: string;
  rows: Array<{ page_id: string; title: string; values: Array<{ property_id: string; value: unknown }> }>;
  primaryPropId: string | undefined;
  onDrop: (rowId: string) => void;
  onCardClick: (rowId: string) => void;
}) {
  const [isTarget, setIsTarget] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (draggedRowId) {
          e.preventDefault();
          setIsTarget(true);
        }
      }}
      onDragLeave={() => setIsTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain") || draggedRowId;
        setIsTarget(false);
        draggedRowId = null;
        if (id) onDrop(id);
      }}
      className={`flex w-64 shrink-0 flex-col rounded-lg border bg-neutral-50 dark:bg-neutral-800/50 ${
        isTarget ? "border-blue-400 ring-2 ring-blue-400/40" : "border-neutral-200 dark:border-neutral-700"
      }`}
    >
      <div
        data-testid={`board-column-${title}`}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300"
      >
        <span className={`h-2 w-2 rounded-full ${colorFor(title)}`} />
        {title}
        <span className="ml-auto text-neutral-400">{rows.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {rows.map((row) => {
          const name = primaryPropId
            ? (row.values.find((v) => v.property_id === primaryPropId)?.value as string) || "Untitled"
            : "Untitled";
          return (
            <div
              key={row.page_id}
              draggable
              onDragStart={(e) => {
                draggedRowId = row.page_id;
                e.dataTransfer.setData("text/plain", row.page_id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                draggedRowId = null;
              }}
              onClick={() => onCardClick(row.page_id)}
              className="cursor-pointer rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-sm hover:border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:border-neutral-500"
            >
              <div className="truncate text-neutral-800 dark:text-neutral-100">
                {name}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-md border border-dashed border-neutral-200 p-3 text-center text-xs text-neutral-400 dark:border-neutral-700">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
