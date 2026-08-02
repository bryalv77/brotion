import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useChildPages } from "../hooks/useChildPages.js";
import { useCreatePage } from "../hooks/useCreatePage.js";
import { useMovePage } from "../hooks/useMovePage.js";
import { deletePage } from "../api/pages.js";
import { importFile } from "../api/import.js";
import { useToast } from "../stores/toast.js";
import type { PageSummaryDTO } from "@notion-clone/shared";

// Module-level drag state. We set this on dragstart and read it during
// dragover/drop, because dataTransfer.getData() is restricted outside drop.
let draggedId: string | null = null;

export function PageTree({ workspaceId }: { workspaceId: string }) {
  const { data: pages, isLoading } = useChildPages(workspaceId, null);
  const createPage = useCreatePage(workspaceId);
  const movePage = useMovePage();
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

  // Drop on empty background → move to workspace root.
  function handleRootDrop(e: React.DragEvent) {
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (!id) return;
    // Only treat as a root drop if the drop didn't land on a node (nodes stop
    // propagation). Avoid no-op self-moves; the server guards the rest.
    if (id) {
      e.preventDefault();
      e.stopPropagation();
      movePage.mutate({ id, newParentId: null });
    }
    draggedId = null;
  }

  return (
    <div
      className="py-1"
      onDragOver={(e) => {
        if (draggedId) e.preventDefault(); // allow drop
      }}
      onDrop={handleRootDrop}
    >
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
        <PageTreeNode key={p.id} page={p} workspaceId={workspaceId} movePage={movePage} />
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
  movePage,
}: {
  page: PageSummaryDTO;
  workspaceId: string;
  movePage: ReturnType<typeof useMovePage>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const { pageId: activePageId } = useParams();
  const qc = useQueryClient();
  const { data: children } = useChildPages(expanded ? workspaceId : undefined, page.id);
  const createSubPage = useCreatePage(workspaceId);
  const isActive = page.id === activePageId;

  // ── drag-to-reparent ────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent) {
    draggedId = page.id;
    e.dataTransfer.setData("text/plain", page.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    if (!draggedId || draggedId === page.id) return;
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    if (!isDropTarget) setIsDropTarget(true);
  }

  function handleDragLeave() {
    if (isDropTarget) setIsDropTarget(false);
  }

  function handleDrop(e: React.DragEvent) {
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    e.preventDefault();
    e.stopPropagation(); // don't bubble to the root-drop handler
    setIsDropTarget(false);
    draggedId = null;
    // Client-side pre-guard (fast feedback). The server is authoritative.
    if (!id || id === page.id) return;
    movePage.mutate({ id, newParentId: page.id });
  }

  function handleDragEnd() {
    draggedId = null;
    setIsDropTarget(false);
  }

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
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className={`group flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
          isActive
            ? "bg-neutral-200 font-medium dark:bg-neutral-700"
            : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
        } ${isDropTarget ? "ring-2 ring-blue-400/60 ring-inset" : ""} ${
          draggedId === page.id ? "opacity-50" : ""
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
            <PageTreeNode key={c.id} page={c} workspaceId={workspaceId} movePage={movePage} />
          ))}
        </div>
      )}
    </div>
  );
}
