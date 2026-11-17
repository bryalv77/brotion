import { Link } from "react-router-dom";
import type { PageDTO } from "@notion-clone/shared";
import { usePageBreadcrumbs } from "../hooks/usePageBreadcrumbs.js";

/**
 * Ancestor chain rendered above the page header. Root pages (no ancestors)
 * render nothing, so top-level pages get no breadcrumb bar.
 */
export function Breadcrumbs({ page }: { page: PageDTO }) {
  const { data: ancestors } = usePageBreadcrumbs(page.id);

  if (!ancestors || ancestors.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex flex-wrap items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
    >
      {ancestors.map((a, i) => {
        const isLast = i === ancestors.length - 1;
        return (
          <span key={a.id} className="flex items-center gap-1">
            <Link
              to={`/app/${page.workspace_id}/${a.id}`}
              className={`flex max-w-[160px] items-center gap-1 rounded px-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
                isLast ? "font-medium text-neutral-600 dark:text-neutral-300" : ""
              }`}
            >
              <span className="shrink-0">{a.icon || "📄"}</span>
              <span className="truncate">{a.title || "Untitled"}</span>
            </Link>
            {!isLast && <span className="text-neutral-400">›</span>}
          </span>
        );
      })}
    </nav>
  );
}
