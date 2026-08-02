import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getDatabase, updatePropertyValue } from "../api/databases.js";
import { CellEditor, FormulaCell } from "./db/CellEditor.js";
import {
  readFormulaSource,
  rowValuesByName,
  allValuesByName,
} from "./db/helpers.js";

/**
 * When a database row is opened as a page (rows ARE pages), this panel renders
 * the row's properties as editable fields above the editor. Title is handled by
 * PageHeader (and synced to the Name cell server-side).
 */
export function RowProperties({
  databaseId,
  rowPageId,
}: {
  databaseId: string;
  rowPageId: string;
}) {
  const qc = useQueryClient();
  const { wsId } = useParams();
  const { data: db } = useQuery({
    queryKey: ["database", databaseId],
    queryFn: () => getDatabase(databaseId),
  });
  if (!db) return null;

  const row = db.rows.find((r) => r.page_id === rowPageId);
  if (!row) return null;

  const updateCell = (propertyId: string, value: unknown) => {
    updatePropertyValue(row.page_id, propertyId, value).then(() =>
      qc.invalidateQueries({ queryKey: ["database", databaseId] }),
    );
  };

  return (
    <div className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-700">
      <Link
        to={wsId ? `/app/${wsId}` : "#"}
        className="mb-2 inline-block text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        ← Back to {db.title || "database"}
      </Link>
      <div className="flex flex-col gap-1.5">
        {db.properties.map((prop) => {
          const val = row.values.find((v) => v.property_id === prop.id);
          return (
            <div key={prop.id} className="flex items-start gap-3 text-sm">
              <div className="w-32 shrink-0 pt-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {prop.name}
              </div>
              <div className="min-w-[12rem] flex-1">
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
                    onChange={(v) => updateCell(prop.id, v)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
