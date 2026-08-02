import { useState, useMemo, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { ComputedCell, PropertyType } from "@notion-clone/shared";
import { updateProperty, getDatabase } from "../../api/databases.js";
import { evaluateFormula } from "../../features/formulas/parser.js";
import { formatValue, readFormulaSource, readSelectOptions, colorFor } from "./helpers.js";

/**
 * Type-aware cell editor shared by every view renderer and the row-page
 * property panel. Dispatches on `type`. select/multi_select/status render
 * colored chips; formula is read-only with an edit popover; system types
 * (created_time/by, last_edited_time/by) are read-only displays.
 */
export function CellEditor({
  databaseId: _databaseId,
  propertyId: _propertyId,
  type,
  value,
  options,
  relationDatabaseId,
  onChange,
}: {
  databaseId?: string;
  propertyId: string;
  type: PropertyType;
  value: unknown;
  options: unknown;
  /** For `relation` props: the target database to pick rows from. */
  relationDatabaseId?: string | null;
  onChange: (v: unknown) => void;
}) {
  const opts = readSelectOptions(options);
  const str = value == null ? "" : String(value);

  // Read-only system types: just display the derived value.
  if (
    type === "created_time" ||
    type === "last_edited_time" ||
    type === "created_by" ||
    type === "last_edited_by"
  ) {
    return (
      <span className="px-1 py-0.5 text-sm text-neutral-500 dark:text-neutral-400">
        {formatValue(value)}
      </span>
    );
  }

  // Rollup is computed server-side and read-only.
  if (type === "rollup") {
    return (
      <span className="px-1 py-0.5 text-sm text-neutral-700 dark:text-neutral-300">
        {formatValue(value)}
      </span>
    );
  }

  if (type === "relation") {
    return (
      <RelationEditor
        relationDatabaseId={relationDatabaseId}
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
      />
    );
  }

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

  if (type === "select" || type === "status") {
    return (
      <select
        value={str}
        onChange={(e) => onChange(e.currentTarget.value || null)}
        className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-neutral-700 hover:border-neutral-200 focus:border-blue-500 dark:text-neutral-300 dark:hover:border-neutral-700"
      >
        <option value="">—</option>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.value}
          </option>
        ))}
      </select>
    );
  }

  if (type === "multi_select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <MultiSelectEditor
        options={opts}
        selected={selected}
        onChange={onChange}
      />
    );
  }

  // text / number / url
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

function MultiSelectEditor({
  options,
  selected,
  onChange,
}: {
  options: Array<{ value: string; color?: string }>;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = options.filter((o) => !selected.includes(o.value));
  return (
    <div className="relative flex flex-wrap items-center gap-1">
      {selected.map((s) => (
        <span
          key={s}
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs ${colorFor(s)}`}
        >
          {s}
          <button
            type="button"
            onClick={() => onChange(selected.filter((x) => x !== s))}
            className="hover:opacity-70"
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded px-1 text-xs text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        +
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[10rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900">
          {available.length === 0 && (
            <div className="px-2 py-1 text-xs text-neutral-400">No more options</div>
          )}
          {available.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange([...selected, o.value]);
                setOpen(false);
              }}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span className={`h-2 w-2 rounded-full ${colorFor(o.value)}`} />
              {o.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationEditor({
  relationDatabaseId,
  value,
  onChange,
}: {
  relationDatabaseId?: string | null;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  // Fetch the target db's rows for the picker (titles only).
  const { data: targetDb } = useQuery({
    queryKey: ["database", relationDatabaseId],
    queryFn: () => getDatabase(relationDatabaseId!),
    enabled: !!relationDatabaseId && open,
  });

  const selected = value;
  const available =
    targetDb?.rows.filter((r) => !selected.includes(r.page_id)) ?? [];

  return (
    <div className="relative flex flex-wrap items-center gap-1">
      {selected.map((id) => {
        const row = targetDb?.rows.find((r) => r.page_id === id);
        return (
          <span
            key={id}
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs ${colorFor(id)}`}
          >
            {row ? rowTitle(row, targetDb!) : id.slice(-4)}
            <button
              type="button"
              onClick={() => onChange(selected.filter((x) => x !== id))}
              className="hover:opacity-70"
            >
              ×
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded px-1 text-xs text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        +
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[12rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-900">
          {!targetDb && <div className="px-2 py-1 text-xs text-neutral-400">Loading…</div>}
          {targetDb && available.length === 0 && (
            <div className="px-2 py-1 text-xs text-neutral-400">No rows to add</div>
          )}
          {available.map((r) => (
            <button
              key={r.page_id}
              type="button"
              onClick={() => {
                onChange([...selected, r.page_id]);
                setOpen(false);
              }}
              className="block w-full truncate px-2 py-1 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {targetDb && rowTitle(r, targetDb)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Best-effort row label: the Name cell value, else the page title, else id. */
function rowTitle(
  row: { page_id: string; title: string; values: Array<{ property_id: string; value: unknown }> },
  db: { properties: Array<{ id: string; name: string }> },
): string {
  const nameProp = db.properties.find((p) => p.name === "Name");
  const cell = nameProp
    ? row.values.find((v) => v.property_id === nameProp.id)?.value
    : undefined;
  if (typeof cell === "string" && cell) return cell;
  return row.title || row.page_id.slice(-4);
}

interface FormulaCellProps {
  databaseId: string;
  propertyId: string;
  propertyName: string;
  source: string;
  rowValuesByName: Record<string, unknown>;
  allValuesByName: Record<string, unknown[]>;
  computed: ComputedCell | undefined;
}

export function FormulaCell({
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

export { readFormulaSource };
