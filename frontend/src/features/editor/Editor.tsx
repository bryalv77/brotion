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
import type { BlockDTO } from "@notion-clone/shared";
import { blocksToDoc } from "./serializers.js";
import { SlashMenu } from "./SlashMenu.js";
import { useBlockSync } from "./useBlockSync.js";
import { uploadImage } from "../../api/files.js";
import { useToast } from "../../stores/toast.js";
import "./editor.css";

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
  const lastDocRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing…",
      }),
    ],
    content: blocksToDoc(blocks),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as unknown as { type: string; content?: PMNode[] };
      const jsonStr = JSON.stringify(json);
      if (jsonStr !== lastDocRef.current) {
        lastDocRef.current = jsonStr;
        void syncBlock(json, blocks);
      }
    },
  });

  useEffect(() => {
    if (editor && blocks) {
      editor.commands.setContent(blocksToDoc(blocks));
      lastDocRef.current = JSON.stringify(editor.getJSON());
    }
    // pageId change triggers reload; blocks are passed via setContent.
  }, [pageId]);

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
        case "table":
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          break;
        case "image":
          imageInputRef.current?.click();
          break;
      }
    },
    [editor],
  );

  const { showToast } = useToast();
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

  return (
    <div className="nc-editor-wrapper">
      <div className="nc-save-indicator">
        {saveStatus === "saving" && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500">Saved</span>
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
