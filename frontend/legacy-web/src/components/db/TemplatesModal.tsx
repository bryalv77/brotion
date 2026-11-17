import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DatabaseDTO } from "@notion-clone/shared";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../../api/databases.js";

/**
 * Modal for managing a database's templates: create, rename, mark default,
 * delete, and open a template's hidden body page in the editor.
 *
 * The template body is a normal page (is_template=true server-side, hidden from
 * the sidebar/search) edited with the standard editor; "Edit content" navigates
 * to it like any other page. Templates are factories: editing one never affects
 * rows already created from it.
 */
export function TemplatesModal({
  db,
  onClose,
}: {
  db: DatabaseDTO;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { wsId } = useParams();
  const templates = db.templates ?? [];
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["database", db.id] });

  const createMut = useMutation({
    mutationFn: () => createTemplate(db.id, { name: newName.trim() || undefined }),
    onSuccess: () => {
      invalidate();
      setNewName("");
    },
  });

  const renameMut = useMutation({
    mutationFn: (vars: { id: string; name: string }) =>
      updateTemplate(db.id, vars.id, { name: vars.name }),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const setDefaultMut = useMutation({
    mutationFn: (id: string) => updateTemplate(db.id, id, { is_default: true }),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(db.id, id),
    onSuccess: invalidate,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[12vh] dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-600">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Templates
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {/* Create new template */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="New template name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createMut.mutate();
              }}
              className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            />
            <button
              data-testid="create-template-btn"
              onClick={() => createMut.mutate()}
              disabled={!newName.trim()}
              className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-40"
            >
              + New
            </button>
          </div>

          {templates.length === 0 && (
            <p className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-400">
              No templates yet. A template pre-fills new rows with content and
              property values.
            </p>
          )}

          <ul className="space-y-1">
            {templates.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-600"
              >
                {editingId === t.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          renameMut.mutate({ id: t.id, name: editName });
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 rounded-md border border-neutral-200 px-2 py-1 text-sm outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                    />
                    <button
                      onClick={() =>
                        renameMut.mutate({ id: t.id, name: editName })
                      }
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base">{t.icon ?? "📄"}</span>
                    <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {t.name || "Untitled template"}
                    </span>
                    {t.is_default && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        Default
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(t.id);
                        setEditName(t.name);
                      }}
                      className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      title="Rename"
                    >
                      Rename
                    </button>
                    {!t.is_default && (
                      <button
                        onClick={() => setDefaultMut.mutate(t.id)}
                        className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Make default"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      data-testid={`edit-template-${t.id}`}
                      onClick={() => {
                        if (wsId) {
                          onClose();
                          navigate(`/app/${wsId}/${t.page_id}`);
                        }
                      }}
                      className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      title="Edit content"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete template "${t.name || "Untitled"}"? Rows already created from it are not affected.`,
                          )
                        )
                          deleteMut.mutate(t.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
