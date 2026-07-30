import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDatabase,
  addProperty,
  updateProperty,
  addRow,
  updatePropertyValue,
  deleteDatabase,
} from "../api/databases.js";
import type { ComputedCell, PropertyType, PropertyValueDTO } from "@notion-clone/shared";
import { evaluateFormula } from "../features/formulas/parser.js";

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
  const [newColFormula, setNewColFormula] = useState("");
  const [newColSelectOptions, setNewColSelectOptions] = useState("");

  const addPropMut = useMutation({
    mutationFn: () =>
      addProperty(databaseId, {
        name: newColName,
        type: newColType,
        ...(newColType === "formula"
          ? { options: { formula: newColFormula } }
          : newColType === "select"
            ? {
                options: {
                  options: newColSelectOptions
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s !== ""),
                },
              }
            : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["database", databaseId] });
      setAddingColumn(false);
      setNewColName("");
      setNewColFormula("");
      setNewColSelectOptions("");
    },
  });

  const addRowMut = useMutation({
    mutationFn: () => addRow(databaseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["database", databaseId] }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteDatabase(databaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-databases"] });
      qc.invalidateQueries({ queryKey: ["page"] });
    },
  });

  const updateCell = useCallback(
    (rowPageId: string, propertyId: string, value: unknown) => {
      // Optimistic update of the current cell so the value reflects
      // immediately. The full refetch below will overwrite this with
      // the authoritative server state (including fresh formula cells
      // on every row — aggregations can change any row's value when
      // one row's input changes).
      qc.setQueryData<typeof db>(["database", databaseId], (prev) => {
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

      updatePropertyValue(rowPageId, propertyId, value).then(() => {
        // Refetch the whole database so every row's formula cells get
        // re-evaluated. Critical for aggregations: changing row A's
        // Price changes the `sum(prop("Price"))` shown on row B.
        qc.invalidateQueries({ queryKey: ["database", databaseId] });
      });
    },
    [databaseId, qc],
  );

  if (isLoading || !db) return null;

  return (
    <div>
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

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-600">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800">
              {db.properties.map((prop) => (
                <th
                  key={prop.id}
                  className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-400"
                >
                  {prop.name}
                  <span className="ml-1 normal-case text-neutral-300 dark:text-neutral-400">
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
              <tr className="border-b border-neutral-200 bg-blue-50 dark:border-neutral-600 dark:bg-neutral-900">
                <td colSpan={db.properties.length + 1} className="px-3 py-2">
                  <div className="flex flex-col gap-2">
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
                        <option value="formula">Formula</option>
                      </select>
                      <button
                        onClick={() => newColName && addPropMut.mutate()}
                        disabled={!newColName || (newColType === "formula" && !newColFormula)}
                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                    {newColType === "formula" && (
                      <input
                        type="text"
                        placeholder='e.g. prop("Price") * prop("Qty") or sum(prop("Price"))'
                        value={newColFormula}
                        onChange={(e) => setNewColFormula(e.target.value)}
                        className="rounded border border-neutral-300 px-2 py-1 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                    )}
                    {newColType === "select" && (
                      <input
                        type="text"
                        placeholder="Options (comma-separated, e.g. Low, Medium, High)"
                        value={newColSelectOptions}
                        onChange={(e) => setNewColSelectOptions(e.target.value)}
                        className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                      />
                    )}
                  </div>
                </td>
              </tr>
            )}
            {db.rows.map((row) => (
              <tr
                key={row.page_id}
                className="border-b border-neutral-200 last:border-0 dark:border-neutral-600"
              >
                {db.properties.map((prop) => {
                  const val = row.values.find((v) => v.property_id === prop.id);
                  return (
                    <td key={prop.id} className="px-3 py-1.5">
                      {prop.type === "formula" ? (
                        <FormulaCell
                          databaseId={databaseId}
                          propertyId={prop.id}
                          propertyName={prop.name}
                          source={readFormulaSource(prop.options)}
                          rowValuesByName={rowValuesByName(row, db.properties)}
                          allValuesByName={allValuesByName(db.rows, db.properties)}
                          computed={row.computed?.[prop.id]}
                        />
                      ) : (
                        <CellEditor
                          type={prop.type}
                          value={val?.value}
                          options={readSelectOptions(prop.options)}
                          onChange={(v) => updateCell(row.page_id, prop.id, v)}
                        />
                      )}
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
        className="mt-2 rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        + New row
      </button>
    </div>
  );
}

function rowValuesByName(
  row: { values: PropertyValueDTO[] },
  properties: Array<{ id: string; name: string }>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const v of row.values) {
    const p = properties.find((pp) => pp.id === v.property_id);
    if (p) out[p.name] = v.value;
  }
  return out;
}

/**
 * Build the per-column all-rows view used by aggregation functions
 * (`sum(prop("X"))` etc.) in formula live previews. Mirrors what the
 * backend loads.
 */
function allValuesByName(
  rows: Array<{ values: PropertyValueDTO[] }>,
  properties: Array<{ id: string; name: string }>,
): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  for (const p of properties) out[p.name] = [];
  for (const row of rows) {
    for (const v of row.values) {
      const p = properties.find((pp) => pp.id === v.property_id);
      if (p) out[p.name].push(v.value);
    }
  }
  return out;
}

/** Extract the list of allowed options from a select property's `options`. */
function readSelectOptions(options: unknown): string[] {
  if (
    options !== null &&
    options !== undefined &&
    typeof options === "object" &&
    "options" in options &&
    Array.isArray((options as { options: unknown }).options)
  ) {
    return (options as { options: unknown[] })
      .options.filter((o): o is string => typeof o === "string");
  }
  return [];
}

function CellEditor({
  type,
  value,
  options,
  onChange,
}: {
  type: PropertyType;
  value: unknown;
  options: string[];
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
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={str}
          onChange={(e) => onChange(e.currentTarget.value || null)}
          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-700 hover:border-neutral-200 focus:border-blue-500 dark:text-neutral-300 dark:hover:border-neutral-700"
        />
        {str !== "" && (
          <button
            onClick={() => onChange(null)}
            className="rounded px-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
            title="Clear"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  if (type === "select") {
    return (
      <select
        value={str}
        onChange={(e) => onChange(e.currentTarget.value || null)}
        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-700 hover:border-neutral-200 focus:border-blue-500 dark:text-neutral-300 dark:hover:border-neutral-700"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type === "number" ? "number" : "text"}
      defaultValue={str}
      onBlur={(e) => {
        const v = type === "number" ? Number(e.target.value) : e.target.value;
        onChange(v === "" || (type === "number" && Number.isNaN(v as number)) ? null : v);
      }}
      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-700 hover:border-neutral-200 focus:border-blue-500 dark:text-neutral-300 dark:hover:border-neutral-700"
    />
  );
}

interface FormulaCellProps {
  databaseId: string;
  propertyId: string;
  propertyName: string;
  /** Current formula source from the property's `options`. */
  source: string;
  rowValuesByName: Record<string, unknown>;
  /** All values per property name across every row (for aggregations). */
  allValuesByName: Record<string, unknown[]>;
  computed: ComputedCell | undefined;
}

function FormulaCell({
  databaseId,
  propertyId,
  propertyName,
  source,
  rowValuesByName,
  allValuesByName,
  computed,
}: FormulaCellProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(source);

  const saveMut = useMutation({
    mutationFn: (src: string) =>
      updateProperty(databaseId, propertyId, { options: { formula: src } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["database", databaseId] }),
  });

  // Live preview against the current row (only the in-progress `draft`).
  // Aggregations get the full all-rows view.
  const preview = useMemo<ComputedCell>(() => {
    if (!draft.trim()) {
      return { status: "error", error: { code: "parse", message: "Empty formula" } };
    }
    return evaluateFormula(draft, rowValuesByName, allValuesByName);
  }, [draft, rowValuesByName, allValuesByName]);

  const isError = computed?.status === "error" || preview.status === "error";
  const display = computed?.status === "ok" ? computed.value : "—";
  const errorMsg = computed?.error?.message ?? preview.error?.message ?? "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(source);
          setOpen(true);
        }}
        title={isError ? `⚠ ${errorMsg}` : `Formula: ${source}`}
        className={
          "w-full rounded px-1 py-0.5 text-left text-sm " +
          (isError
            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800")
        }
        aria-label={
          computed?.status === "ok"
            ? `Formula result: ${String(computed.value)}`
            : `Formula error: ${errorMsg}`
        }
      >
        {isError ? `⚠ ${errorMsg}` : formatValue(display)}
      </button>
      {open && (
        <FormulaPopover
          source={draft}
          onChange={setDraft}
          onClose={() => setOpen(false)}
          onSave={(src) => {
            saveMut.mutate(src, { onSuccess: () => setOpen(false) });
          }}
          preview={preview}
          propertyName={propertyName}
        />
      )}
    </div>
  );
}

function FormulaPopover({
  source,
  onChange,
  onClose,
  onSave,
  preview,
  propertyName,
}: {
  source: string;
  onChange: (s: string) => void;
  onClose: () => void;
  onSave: (src: string) => void;
  preview: ComputedCell;
  propertyName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-20 mt-1 w-80 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-600 dark:bg-neutral-900"
    >
      <div className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
        {propertyName} =
      </div>
      <input
        autoFocus
        type="text"
        value={source}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && source.trim()) onSave(source);
          else if (e.key === "Escape") onClose();
        }}
        placeholder='e.g. prop("Price") * prop("Qty")'
        className="w-full rounded border border-neutral-300 px-2 py-1 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <div className="mt-2 text-xs">
        <span className="text-neutral-500 dark:text-neutral-400">→ </span>
        {preview.status === "ok" ? (
          <span className="font-medium text-neutral-800 dark:text-neutral-100">
            {formatValue(preview.value)}
          </span>
        ) : (
          <span className="text-red-500">⚠ {preview.error?.message}</span>
        )}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          onClick={() => source.trim() && onSave(source)}
          disabled={!source.trim() || preview.status === "error"}
          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "number") return String(v);
  return String(v);
}

/**
 * Extract a formula source from a property's `options` field. Returns "" if
 * the field is missing or malformed.
 */
function readFormulaSource(options: unknown): string {
  if (
    options !== null &&
    options !== undefined &&
    typeof options === "object" &&
    "formula" in options &&
    typeof (options as { formula: unknown }).formula === "string"
  ) {
    return (options as { formula: string }).formula;
  }
  return "";
}
