import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDatabase,
  addProperty,
  addRow,
  updatePropertyValue,
  deleteDatabase,
} from "../api/databases.js";
import type { PropertyType } from "@notion-clone/shared";

interface DatabaseViewProps {
  databaseId: string;
}

export function DatabaseView({ databaseId }: DatabaseViewProps) {
  const qc = useQueryClient();
  const { data: db, isLoading } = useQuery({
    queryKey: ["database", databaseId],
    queryFn: () => getDatabase(databaseId),
  });
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<PropertyType>("text");

  const addPropMut = useMutation({
    mutationFn: () => addProperty(databaseId, { name: newColName, type: newColType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["database", databaseId] });
      setAddingColumn(false);
      setNewColName("");
    },
  });

  const addRowMut = useMutation({
    mutationFn: () => addRow(databaseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["database", databaseId] }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteDatabase(databaseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["page"] }),
  });

  const updateCell = useCallback(
    (rowPageId: string, propertyId: string, value: unknown) => {
      void updatePropertyValue(rowPageId, propertyId, value).then(() => {
        qc.invalidateQueries({ queryKey: ["database", databaseId] });
      });
    },
    [databaseId, qc],
  );

  if (isLoading || !db) return null;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-2">
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

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
              {db.properties.map((prop) => (
                <th
                  key={prop.id}
                  className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-400"
                >
                  {prop.name}
                  <span className="ml-1 normal-case text-neutral-300 dark:text-neutral-600">
                    {prop.type}
                  </span>
                </th>
              ))}
              <th className="w-8 px-2 py-2">
                <button
                  onClick={() => setAddingColumn(!addingColumn)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  title="Add column"
                >
                  +
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {addingColumn && (
              <tr className="border-b border-neutral-200 bg-blue-50 dark:border-neutral-700 dark:bg-neutral-900">
                <td colSpan={db.properties.length + 1} className="px-3 py-2">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Column name"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value as PropertyType)}
                      className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                      <option value="date">Date</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="url">URL</option>
                    </select>
                    <button
                      onClick={() => newColName && addPropMut.mutate()}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {db.rows.map((row) => (
              <tr
                key={row.page_id}
                className="border-b border-neutral-200 last:border-0 dark:border-neutral-700"
              >
                {db.properties.map((prop) => {
                  const val = row.values.find((v) => v.property_id === prop.id);
                  return (
                    <td key={prop.id} className="px-3 py-1.5">
                      <CellEditor
                        type={prop.type}
                        value={val?.value}
                        onChange={(v) => updateCell(row.page_id, prop.id, v)}
                      />
                    </td>
                  );
                })}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => addRowMut.mutate()}
        className="mt-2 rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        + New row
      </button>
    </div>
  );
}

function CellEditor({
  type,
  value,
  onChange,
}: {
  type: PropertyType;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const str = value == null ? "" : String(value);

  if (type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    );
  }

  if (type === "date") {
    return (
      <input
        type="date"
        value={str}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-700 hover:border-neutral-200 focus:border-blue-500 dark:text-neutral-300 dark:hover:border-neutral-700"
      />
    );
  }

  return (
    <input
      type={type === "number" ? "number" : "text"}
      defaultValue={str}
      onBlur={(e) => {
        const v = type === "number" ? Number(e.target.value) : e.target.value;
        onChange(v || null);
      }}
      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-700 hover:border-neutral-200 focus:border-blue-500 dark:text-neutral-300 dark:hover:border-neutral-700"
    />
  );
}
