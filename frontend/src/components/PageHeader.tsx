import { useState, useRef, useEffect } from "react";
import type { PageDTO, PageSummaryDTO } from "@notion-clone/shared";
import { updatePage } from "../api/pages.js";
import { useQueryClient } from "@tanstack/react-query";
import { EmojiPicker } from "./EmojiPicker.js";

interface PageHeaderProps {
  page: PageDTO;
}

export function PageHeader({ page }: PageHeaderProps) {
  const [title, setTitle] = useState(page.title || "");
  const [icon, setIcon] = useState(page.icon);
  const [coverUrl, setCoverUrl] = useState(page.cover_url);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverInput, setCoverInput] = useState("");
  const [hovered, setHovered] = useState(false);
  const qc = useQueryClient();
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(page.title || "");
    setIcon(page.icon);
    setCoverUrl(page.cover_url);
  }, [page.id, page.title, page.icon, page.cover_url]);

  /**
   * Push the updated page into every relevant cache slice so the sidebar /
   * page tree reflects the new title/icon/cover immediately, without waiting
   * for a refetch round-trip.
   */
  function applyToCaches(updated: PageDTO) {
    // 1) Detail cache for the open page.
    qc.setQueryData(["page", updated.id], (prev: unknown) => {
      const old = (prev as { page: PageDTO; blocks: unknown } | undefined)?.page;
      if (!old) return prev;
      return { page: { ...old, ...updated }, blocks: (prev as { blocks: unknown }).blocks };
    });

    // 2) Any "pages children" list — patch the matching entry in place so the
    //    sidebar/tree re-renders with the new title without a refetch.
    const applyToList = (key: readonly unknown[]) => {
      qc.setQueryData(key, (prev: unknown) => {
        if (!Array.isArray(prev)) return prev;
        return (prev as PageSummaryDTO[]).map((p) =>
          p.id === updated.id
            ? { ...p, title: updated.title, icon: updated.icon }
            : p,
        );
      });
    };
    applyToList(["pages", "children", updated.workspace_id, null]);
    applyToList(["pages", "children", updated.workspace_id, updated.parent_id ?? null]);
  }

  function invalidatePageLists() {
    qc.invalidateQueries({ queryKey: ["pages", "children"] });
  }

  function saveTitle(next?: string) {
    const value = (next ?? title).trim();
    if (value === (page.title || "")) return;
    void updatePage(page.id, { title: value })
      .then((updated) => {
        applyToCaches(updated);
        invalidatePageLists();
      })
      .catch(() => {
        /* swallow — toast would go here */
      });
  }

  function saveIcon(emoji: string | null) {
    setIcon(emoji);
    void updatePage(page.id, { icon: emoji ?? undefined })
      .then((updated) => {
        applyToCaches(updated);
        invalidatePageLists();
      })
      .catch(() => {
        /* swallow */
      });
  }

  function saveCover(url: string | null) {
    setCoverUrl(url);
    setShowCoverInput(false);
    setCoverInput("");
    void updatePage(page.id, { cover_url: url ?? undefined })
      .then((updated) => {
        applyToCaches(updated);
        invalidatePageLists();
      })
      .catch(() => {
        /* swallow */
      });
  }

  return (
    <div className="mb-8" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Cover */}
      {coverUrl && (
        <div className="group relative mb-4 h-48 w-full overflow-hidden rounded-lg">
          <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
          {hovered && (
            <button
              onClick={() => saveCover(null)}
              className="absolute right-3 top-3 rounded-md bg-white/80 px-2 py-1 text-xs text-neutral-700 hover:bg-white"
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Icon + Title row */}
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className="relative pt-1">
          {icon ? (
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-5xl leading-none hover:bg-neutral-100 rounded-lg p-1"
            >
              {icon}
            </button>
          ) : (
            hovered && (
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                😀 Icon
              </button>
            )
          )}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => saveIcon(emoji)}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
          {icon && hovered && (
            <button
              onClick={() => saveIcon(null)}
              className="absolute -right-2 -top-2 rounded-full bg-neutral-300 px-1 text-xs text-neutral-700 hover:bg-neutral-400"
            >
              ×
            </button>
          )}
        </div>

        {/* Title */}
        <div className="flex-1">
          <div
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={() => {
              // contentEditable mutates the DOM directly, so read the current
              // text from the ref instead of trusting React state.
              const next = titleRef.current?.textContent?.trim() ?? "";
              setTitle(next);
              saveTitle(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                titleRef.current?.blur();
              }
            }}
            className="text-4xl font-bold text-neutral-900 outline-none"
            data-placeholder="Untitled"
          >
            {title}
          </div>
        </div>
      </div>

      {/* Cover add button */}
      {!coverUrl && hovered && !showCoverInput && (
        <button
          onClick={() => setShowCoverInput(true)}
          className="mt-4 rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
        >
          🖼️ Add cover
        </button>
      )}
      {showCoverInput && (
        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            type="url"
            placeholder="Paste image URL…"
            value={coverInput}
            onChange={(e) => setCoverInput(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none"
          />
          <button
            onClick={() => coverInput && saveCover(coverInput)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => setShowCoverInput(false)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
