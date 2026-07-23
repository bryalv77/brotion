import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useChildPages } from "../hooks/useChildPages.js";
import { useCreatePage } from "../hooks/useCreatePage.js";
import type { PageSummaryDTO } from "@notion-clone/shared";

export function PageTree({ workspaceId }: { workspaceId: string }) {
  const { data: pages, isLoading } = useChildPages(workspaceId, null);
  const createPage = useCreatePage(workspaceId);

  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Pages
        </span>
        <button
          onClick={() => {
            createPage.mutate(
              { title: "" },
              {
                onSuccess: (page) => {
                  window.location.href = `/app/${workspaceId}/${page.id}`;
                },
              },
            );
          }}
          className="rounded px-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          title="New page"
        >
          +
        </button>
      </div>
      {isLoading && (
        <div className="px-2 text-sm text-neutral-400 dark:text-neutral-500">Loading…</div>
      )}
      {pages?.map((p) => (
        <PageTreeNode key={p.id} page={p} workspaceId={workspaceId} />
      ))}
      {pages?.length === 0 && !isLoading && (
        <div className="px-2 py-1 text-sm text-neutral-400 dark:text-neutral-500">
          No pages yet
        </div>
      )}
    </div>
  );
}

function PageTreeNode({
  page,
  workspaceId,
}: {
  page: PageSummaryDTO;
  workspaceId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { pageId: activePageId } = useParams();
  const { data: children } = useChildPages(expanded ? workspaceId : undefined, page.id);
  const isActive = page.id === activePageId;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
          isActive
            ? "bg-neutral-200 font-medium dark:bg-neutral-700"
            : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
        }`}
      >
        {page.has_children ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-4 text-xs text-neutral-400"
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-xs">{page.icon || "📄"}</span>
        <Link
          to={`/app/${workspaceId}/${page.id}`}
          className="flex-1 truncate text-neutral-700 dark:text-neutral-300"
        >
          {page.title || "Untitled"}
        </Link>
      </div>
      {expanded && page.has_children && (
        <div className="ml-4 border-l border-neutral-200 pl-1 dark:border-neutral-700">
          {children?.map((c) => (
            <PageTreeNode key={c.id} page={c} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  );
}
