import { useNavigate, useParams } from "react-router-dom";
import type { DatabaseDTO } from "@notion-clone/shared";
import { CellEditor, FormulaCell } from "../CellEditor.js";
import { readFormulaSource, rowValuesByName, allValuesByName, colorFor } from "../helpers.js";

/**
 * Compact list view: one line per row, primary property (Name) prominent,
 * other visible properties as muted inline fields. Clicking a row opens it
 * as a page (rows ARE pages).
 */
export function ListView({
  db,
  hidden,
  updateCell,
}: {
  db: DatabaseDTO;
  hidden: string[];
  updateCell: (rowPageId: string, propertyId: string, value: unknown) => void;
}) {
  const navigate = useNavigate();
  const { wsId } = useParams();
  const visibleProps = db.properties.filter((p) => !hidden.includes(p.name));
  const primary = db.properties[0]; // the first property (default "Name")

  return (
    <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-600">
      {db.rows.map((row) => (
        <div
          key={row.page_id}
          onClick={() => wsId && navigate(`/app/${wsId}/${row.page_id}`)}
          className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
        >
          <span className="text-base">{db.icon || "📄"}</span>
          <div className="flex flex-1 flex-wrap items-center gap-3 text-sm">
            {visibleProps.map((prop) => {
              const val = row.values.find((v) => v.property_id === prop.id);
              const isPrimary = prop.id === primary?.id;
              return (
                <div
                  key={prop.id}
                  onClick={(e) => e.stopPropagation()}
                  className={isPrimary ? "min-w-[12rem] font-medium text-neutral-800 dark:text-neutral-100" : "min-w-[6rem] text-neutral-500 dark:text-neutral-400"}
                >
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
                  ) : prop.type === "select" || prop.type === "status" || prop.type === "multi_select" ? (
                    <ChipValue value={val?.value} />
                  ) : (
                    <CellEditor
                      databaseId={db.id}
                      propertyId={prop.id}
                      type={prop.type}
                      value={val?.value}
                      options={prop.options}
                      onChange={(v) => updateCell(row.page_id, prop.id, v)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {db.rows.length === 0 && (
        <div className="px-3 py-6 text-center text-sm text-neutral-400">No rows</div>
      )}
    </div>
  );
}

function ChipValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((s) => (
          <span key={s} className={`rounded px-1.5 py-0.5 text-xs ${colorFor(s)}`}>
            {s}
          </span>
        ))}
      </div>
    );
  }
  if (value === null || value === undefined || value === "") return <span className="text-neutral-300">—</span>;
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${colorFor(String(value))}`}>
      {String(value)}
    </span>
  );
}
