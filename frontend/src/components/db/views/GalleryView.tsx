import { useNavigate, useParams } from "react-router-dom";
import type { DatabaseDTO } from "@notion-clone/shared";
import { colorFor } from "../helpers.js";

/**
 * Gallery: a responsive card grid. Each card shows the primary property as the
 * title plus a couple of secondary properties. Click opens the row as a page.
 */
export function GalleryView({
  db,
  hidden,
}: {
  db: DatabaseDTO;
  hidden: string[];
}) {
  const navigate = useNavigate();
  const { wsId } = useParams();
  const visibleProps = db.properties.filter((p) => !hidden.includes(p.name));
  const primary = db.properties[0];
  const secondary = visibleProps.filter((p) => p.id !== primary?.id).slice(0, 3);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {db.rows.map((row) => {
        const name = primary
          ? (row.values.find((v) => v.property_id === primary.id)?.value as string) || "Untitled"
          : "Untitled";
        return (
          <div
            key={row.page_id}
            onClick={() => wsId && navigate(`/app/${wsId}/${row.page_id}`)}
            className="flex cursor-pointer flex-col rounded-lg border border-neutral-200 bg-white p-3 shadow-sm hover:border-neutral-300 hover:shadow dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
          >
            <div className="mb-2 flex h-24 items-center justify-center rounded-md bg-neutral-100 text-3xl dark:bg-neutral-800">
              {db.icon || "📄"}
            </div>
            <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {name}
            </div>
            <div className="mt-1 flex flex-col gap-0.5">
              {secondary.map((p) => {
                const val = row.values.find((v) => v.property_id === p.id)?.value;
                return (
                  <div key={p.id} className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="text-neutral-400">{p.name}:</span>
                    {Array.isArray(val) ? (
                      (val as string[]).map((s) => (
                        <span key={s} className={`rounded px-1 py-0.5 text-[10px] ${colorFor(s)}`}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span>{val == null || val === "" ? "—" : String(val)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {db.rows.length === 0 && (
        <div className="col-span-full rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400 dark:border-neutral-600">
          No rows
        </div>
      )}
    </div>
  );
}
