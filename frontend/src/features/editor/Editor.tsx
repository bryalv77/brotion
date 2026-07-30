import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import type { BlockDTO } from "@notion-clone/shared";
import { blocksToDoc } from "./serializers.js";
import { SlashMenu } from "./SlashMenu.js";
import { useBlockSync } from "./useBlockSync.js";
import { uploadImage } from "../../api/files.js";
import { useToast } from "../../stores/toast.js";
import { Callout } from "./extensions/Callout.js";
import { PageRef } from "./extensions/PageRef.js";
import { listChildPages } from "../../api/pages.js";
import { useCreateDatabase } from "../../hooks/useCreateDatabase.js";
import "./editor.css";

const lowlight = createLowlight(common);

type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

interface EditorProps {
  pageId: string;
  blocks: BlockDTO[];
}

export function Editor({ pageId, blocks }: EditorProps) {
  const { syncBlock, saveStatus } = useBlockSync(pageId);
  const createDatabase = useCreateDatabase(pageId);
  const { showToast } = useToast();
  // Tracks the doc the editor was last told to render. Used to distinguish
  // "blocks arrived from the server" (must refresh) from "the user is typing
  // and the debounced save invalidated the query" (must NOT clobber).
  const lastServerDocRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Callout,
      PageRef,
      Markdown.configure({
        breaks: true,
        linkify: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing…",
      }),
    ],
    content: blocksToDoc(blocks),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as unknown as { type: string; content?: PMNode[] };
      void syncBlock(json, blocks);
    },
  });

  // Sync the editor with the latest server blocks whenever they (or the
  // pageId) change. Without depending on `blocks` here, freshly-imported
  // blocks arriving after the editor mounts would be invisible until the
  // user manually reloaded the page.
  useEffect(() => {
    if (!editor || !blocks) return;
    const next = JSON.stringify(blocksToDoc(blocks));
    if (next !== lastServerDocRef.current) {
      lastServerDocRef.current = next;
      editor.commands.setContent(JSON.parse(next));
    }
  }, [pageId, blocks, editor]);

  const handleSlashCommand = useCallback(
    (action: string) => {
      if (!editor) return;
      switch (action) {
        case "paragraph":
          editor.chain().focus().setParagraph().run();
          break;
        case "heading1":
          editor.chain().focus().setHeading({ level: 1 }).run();
          break;
        case "heading2":
          editor.chain().focus().setHeading({ level: 2 }).run();
          break;
        case "heading3":
          editor.chain().focus().setHeading({ level: 3 }).run();
          break;
        case "bulleted_list_item":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "numbered_list_item":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "todo":
          editor.chain().focus().toggleTaskList().run();
          break;
        case "quote":
          editor.chain().focus().toggleBlockquote().run();
          break;
        case "code":
          editor.chain().focus().toggleCodeBlock().run();
          break;
        case "divider":
          editor.chain().focus().setHorizontalRule().run();
          break;
        case "callout":
          editor.chain().focus().setCallout().run();
          break;
        case "table":
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        case "image":
          imageInputRef.current?.click();
          break;
        case "page_ref":
          void handlePageRef();
          break;
        case "database":
          createDatabase.mutate(
            { title: "Untitled", icon: "📊" },
            {
              onError: (err) => showToast(err instanceof Error ? err.message : "Could not create database"),
            },
          );
          break;
      }
    },
    [editor, createDatabase, showToast],
  );

  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File | undefined) {
    if (!file || !editor) return;
    try {
      const attachment = await uploadImage(file, { pageId });
      editor.chain().focus().setImage({ src: attachment.url, alt: file.name }).run();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Image upload failed");
    }
  }

  async function handlePageRef() {
    if (!editor) return;
    try {
      const pages = await listChildPages(pageId, null);
      if (pages.length === 0) {
        showToast("No pages found in this workspace to link.");
        return;
      }
      // Simple prompt-based picker for v1.
      const options = pages.map((p, i) => `${i}: ${p.title || "Untitled"}`).join("\n");
      const choice = window.prompt(`Choose a page to link:\n\n${options}`, "0");
      const idx = choice ? parseInt(choice, 10) : -1;
      if (idx >= 0 && idx < pages.length) {
        const target = pages[idx];
        editor
          .chain()
          .focus()
          .insertPageRef({
            pageId: target.id,
            title: target.title || "Untitled",
            icon: target.icon || undefined,
          })
          .run();
      }
    } catch {
      showToast("Failed to load pages for linking.");
    }
  }

  return (
    <div className="nc-editor-wrapper">
      <div className="nc-save-indicator">
        {saveStatus === "saving" && (
          <span className="text-xs text-neutral-400 dark:text-neutral-400">Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-neutral-400 dark:text-neutral-400">Saved</span>
        )}
      </div>
      <EditorContent editor={editor} className="nc-editor" />
      <SlashMenu editor={editor} onSelect={handleSlashCommand} />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleImageUpload(e.target.files?.[0])}
      />
    </div>
  );
}
