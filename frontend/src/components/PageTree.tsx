import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChildPages } from "../hooks/useChildPages.js";
import { useCreatePage } from "../hooks/useCreatePage.js";
import { deletePage } from "../api/pages.js";
import { importFile } from "../api/import.js";
import { useToast } from "../stores/toast.js";
import type { PageSummaryDTO } from "@notion-clone/shared";

export function PageTree({ workspaceId }: { workspaceId: string }) {
  const { data: pages, isLoading } = useChildPages(workspaceId, null);
  const createPage = useCreatePage(workspaceId);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      showToast("Importing…", "info");
      const page = await importFile(workspaceId, file);
      window.location.href = `/app/${workspaceId}/${page.id}`;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed");
    }
  }

  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-400">
          Pages
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => importInputRef.current?.click()}
            className="rounded px-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            title="Import file (MD, TXT, DOCX, PDF, XLSX)"
          >
            ↥
          </button>
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
        <input
          ref={importInputRef}
          type="file"
          accept=".md,.markdown,.txt,.docx,.pdf,.xlsx,.xls"
          className="hidden"
          onChange={(e) => void handleImport(e.target.files?.[0])}
        />
      </div>
      {isLoading && (
        <div className="px-2 text-sm text-neutral-400 dark:text-neutral-400">Loading…</div>
      )}
      {pages?.map((p) => (
        <PageTreeNode key={p.id} page={p} workspaceId={workspaceId} />
      ))}
      {pages?.length === 0 && !isLoading && (
        <div className="px-2 py-1 text-sm text-neutral-400 dark:text-neutral-400">
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { pageId: activePageId } = useParams();
  const qc = useQueryClient();
  const { data: children } = useChildPages(expanded ? workspaceId : undefined, page.id);
  const createSubPage = useCreatePage(workspaceId);
  const isActive = page.id === activePageId;

  async function handleDelete() {
    setMenuOpen(false);
    await deletePage(page.id);
    qc.invalidateQueries({ queryKey: ["pages"] });
  }

  function handleCreateSubPage() {
    setMenuOpen(false);
    createSubPage.mutate(
      { title: "", parent_id: page.id },
      {
        onSuccess: (newPage) => {
          setExpanded(true);
          qc.invalidateQueries({ queryKey: ["pages"] });
          window.location.href = `/app/${workspaceId}/${newPage.id}`;
        },
      },
    );
  }

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
        {/* Context menu trigger */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="hidden rounded px-1 text-neutral-400 hover:text-neutral-700 group-hover:inline dark:hover:text-neutral-300"
          title="Page actions"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            className="absolute z-50 ml-8 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              onClick={handleCreateSubPage}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              📄 Add subpage
            </button>
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
      {expanded && page.has_children && (
        <div className="ml-4 border-l border-neutral-200 pl-1 dark:border-neutral-600">
          {children?.map((c) => (
            <PageTreeNode key={c.id} page={c} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  );
}
