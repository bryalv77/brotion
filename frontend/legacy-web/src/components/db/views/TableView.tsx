import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DatabaseDTO, PropertyType } from "@notion-clone/shared";
import {
  addProperty,
  deleteProperty,
  deleteRow,
  addRow,
} from "../../../api/databases.js";
import { CellEditor, FormulaCell } from "../CellEditor.js";
import { TemplatesModal } from "../TemplatesModal.js";
import {
  readFormulaSource,
  rowValuesByName,
  allValuesByName,
} from "../helpers.js";

/** The classic spreadsheet grid. */
export function TableView({
  db,
  hidden,
  updateCell,
}: {
  db: DatabaseDTO;
  hidden: string[];
  updateCell: (rowPageId: string, propertyId: string, value: unknown) => void;
}) {
  const qc = useQueryClient();
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<PropertyType>("text");
  const [newColFormula, setNewColFormula] = useState("");
  const [newColSelectOptions, setNewColSelectOptions] = useState("");
  const [newRowMenuOpen, setNewRowMenuOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const newRowMenuRef = useRef<HTMLDivElement>(null);

  const templates = db.templates ?? [];

  // Close the "New row" dropdown on outside click.
  useEffect(() => {
    if (!newRowMenuOpen) return;
    function onDown(e: MouseEvent) {
      if (newRowMenuRef.current && !newRowMenuRef.current.contains(e.target as Node)) {
        setNewRowMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [newRowMenuOpen]);

  const visibleProps = db.properties.filter((p) => !hidden.includes(p.name));

  const addPropMut = useMutation({
    mutationFn: () =>
      addProperty(db.id, {
        name: newColName,
        type: newColType,
        ...(newColType === "formula"
          ? { options: { formula: newColFormula } }
          : newColType === "select" || newColType === "multi_select" || newColType === "status"
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
      qc.invalidateQueries({ queryKey: ["database", db.id] });
      setAddingColumn(false);
      setNewColName("");
      setNewColFormula("");
      setNewColSelectOptions("");
    },
  });

  const addRowMut = useMutation({
    mutationFn: (vars?: { template_id?: string | null }) =>
      addRow(db.id, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["database", db.id] }),
  });

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-600">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800">
              {visibleProps.map((prop) => (
                <th
                  key={prop.id}
                  className="group px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-400"
                >
                  <span className="inline-flex items-center gap-1">
                    {prop.name}
                    <span className="normal-case text-neutral-300 dark:text-neutral-400">
                      {prop.type}
                    </span>
                    <button
                      onClick={() => {
                        deleteProperty(db.id, prop.id).then(() =>
                          qc.invalidateQueries({ queryKey: ["database", db.id] }),
                        );
                      }}
                      className="ml-0.5 hidden text-neutral-300 hover:text-red-500 group-hover:inline dark:text-neutral-500"
                      title="Delete column"
                    >
                      ×
                    </button>
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
                <td colSpan={visibleProps.length + 1} className="px-3 py-2">
                  <NewColumnForm
                    name={newColName}
                    type={newColType}
                    formula={newColFormula}
                    selectOptions={newColSelectOptions}
                    onName={setNewColName}
                    onType={setNewColType}
                    onFormula={setNewColFormula}
                    onSelectOptions={setNewColSelectOptions}
                    onAdd={() => newColName && addPropMut.mutate()}
                  />
                </td>
              </tr>
            )}
            {db.rows.map((row) => (
              <tr
                key={row.page_id}
                className="border-b border-neutral-200 last:border-0 dark:border-neutral-600"
              >
                {visibleProps.map((prop) => {
                  const val = row.values.find((v) => v.property_id === prop.id);
                  return (
                    <td key={prop.id} className="px-3 py-1.5">
                      {prop.type === "formula" ? (
                        <FormulaCell
                          databaseId={db.id}
                          propertyId={prop.id}
                          propertyName={prop.name}
                          source={readFormulaSource(prop.options)}
                          rowValuesByName={rowValuesByName(row, db.properties)}
                          allValuesByName={allValuesByName(db.rows, db.properties)}
                          computed={row.computed?.[prop.id]}
                        />
                      ) : (
                        <CellEditor
                          databaseId={db.id}
                          propertyId={prop.id}
                          type={prop.type}
                          value={val?.value}
                          options={prop.options}
                          relationDatabaseId={prop.relation_database_id}
                          onChange={(v) => updateCell(row.page_id, prop.id, v)}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-2">
                  <button
                    onClick={() => {
                      deleteRow(row.page_id).then(() =>
                        qc.invalidateQueries({ queryKey: ["database", db.id] }),
                      );
                    }}
                    className="text-neutral-300 hover:text-red-500 dark:text-neutral-600"
                    title="Delete row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="relative" ref={newRowMenuRef}>
          <button
            data-testid="new-row-btn"
            onClick={() => {
              // With no templates, "New row" creates an empty row directly.
              if (templates.length === 0) {
                addRowMut.mutate({});
              } else {
                setNewRowMenuOpen((v) => !v);
              }
            }}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            + New row
          </button>
          {newRowMenuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800">
              {/* Default template (or plain empty row) is the primary action. */}
              <button
                data-testid="new-row-default"
                onClick={() => {
                  // Omitting template_id lets the backend apply the default
                  // template if one exists, else an empty row.
                  addRowMut.mutate({});
                  setNewRowMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                New row
                {templates.some((t) => t.is_default) && (
                  <span className="text-[10px] text-neutral-400">
                    (default template)
                  </span>
                )}
              </button>
              <div className="my-1 border-t border-neutral-200 dark:border-neutral-600" />
              {templates.map((t) => (
                <button
                  key={t.id}
                  data-testid={`new-row-template-${t.id}`}
                  onClick={() => {
                    addRowMut.mutate({ template_id: t.id });
                    setNewRowMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <span>{t.icon ?? "📄"}</span>
                  {t.name || "Untitled template"}
                </button>
              ))}
            </div>
          )}
        </div>
        {templates.length > 0 && (
          <button
            data-testid="manage-templates-btn"
            onClick={() => setTemplatesOpen(true)}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Templates
          </button>
        )}
      </div>

      {templatesOpen && <TemplatesModal db={db} onClose={() => setTemplatesOpen(false)} />}
    </div>
  );
}

function NewColumnForm({
  name,
  type,
  formula,
  selectOptions,
  onName,
  onType,
  onFormula,
  onSelectOptions,
  onAdd,
}: {
  name: string;
  type: PropertyType;
  formula: string;
  selectOptions: string;
  onName: (s: string) => void;
  onType: (t: PropertyType) => void;
  onFormula: (s: string) => void;
  onSelectOptions: (s: string) => void;
  onAdd: () => void;
}) {
  const needsOptions = type === "select" || type === "multi_select" || type === "status";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          placeholder="Column name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <select
          value={type}
          onChange={(e) => onType(e.target.value as PropertyType)}
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="select">Select</option>
          <option value="multi_select">Multi-select</option>
          <option value="status">Status</option>
          <option value="date">Date</option>
          <option value="checkbox">Checkbox</option>
          <option value="url">URL</option>
          <option value="formula">Formula</option>
          <option value="created_time">Created time</option>
          <option value="created_by">Created by</option>
          <option value="last_edited_time">Last edited time</option>
          <option value="last_edited_by">Last edited by</option>
        </select>
        <button
          onClick={onAdd}
          disabled={!name || (type === "formula" && !formula)}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      {type === "formula" && (
        <input
          type="text"
          placeholder='e.g. prop("Price") * prop("Qty") or sum(prop("Price"))'
          value={formula}
          onChange={(e) => onFormula(e.target.value)}
          className="rounded border border-neutral-300 px-2 py-1 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
      )}
      {needsOptions && (
        <input
          type="text"
          placeholder="Options (comma-separated, e.g. Low, Medium, High)"
          value={selectOptions}
          onChange={(e) => onSelectOptions(e.target.value)}
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
      )}
    </div>
  );
}
