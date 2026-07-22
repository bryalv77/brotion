import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";

interface SlashMenuProps {
  editor: Editor | null;
  onSelect: (action: string) => void;
}

interface MenuItem {
  label: string;
  icon: string;
  action: string;
  keywords: string;
}

const ITEMS: MenuItem[] = [
  { label: "Text", icon: "📝", action: "paragraph", keywords: "text paragraph" },
  { label: "Heading 1", icon: "H₁", action: "heading1", keywords: "h1 heading title" },
  { label: "Heading 2", icon: "H₂", action: "heading2", keywords: "h2 heading" },
  { label: "Heading 3", icon: "H₃", action: "heading3", keywords: "h3 heading" },
  { label: "Bulleted list", icon: "•", action: "bulleted_list_item", keywords: "bullet list ul" },
  { label: "Numbered list", icon: "1.", action: "numbered_list_item", keywords: "numbered list ol" },
  { label: "To-do", icon: "☐", action: "todo", keywords: "todo task checkbox check" },
  { label: "Quote", icon: "❝", action: "quote", keywords: "quote blockquote" },
  { label: "Code", icon: "</>", action: "code", keywords: "code block pre" },
  { label: "Divider", icon: "—", action: "divider", keywords: "divider hr line rule" },
];

export function SlashMenu({ editor, onSelect }: SlashMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const queryRef = useRef("");
  const openRef = useRef(false);

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    queryRef.current = "";
    setQuery("");
  }, []);

  const selectItem = useCallback(
    (item: MenuItem) => {
      if (!editor) return;
      const { from } = editor.state.selection;
      // Remove the "/" + any typed filter from the editor.
      const removeCount = 1 + queryRef.current.length;
      editor.chain().focus().deleteRange({ from: from - removeCount, to: from }).run();
      onSelect(item.action);
      close();
    },
    [editor, onSelect, close],
  );

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    function onKeyDown(e: KeyboardEvent) {
      if (!editor) return;

      // Detect "/" at start of empty line.
      if (e.key === "/" && !openRef.current) {
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(from - 1, from, "\n");
        if (textBefore === "" || textBefore === " ") {
          // Open on next tick (after the "/" is inserted).
          setTimeout(() => {
            openRef.current = true;
            setOpen(true);
            queryRef.current = "";
            setQuery("");
            setSelectedIndex(0);
          }, 10);
        }
        return;
      }

      if (!openRef.current) return;

      const filtered = getFiltered(queryRef.current);

      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) selectItem(filtered[selectedIndex]);
      } else if (e.key === "Backspace") {
        queryRef.current = queryRef.current.slice(0, -1);
        setQuery(queryRef.current);
        if (!queryRef.current) close();
      } else if (e.key.length === 1 && e.key !== "/") {
        queryRef.current += e.key;
        setQuery(queryRef.current);
        setSelectedIndex(0);
      }
    }

    dom.addEventListener("keydown", onKeyDown, true);
    return () => dom.removeEventListener("keydown", onKeyDown, true);
  }, [editor, selectedIndex, selectItem, close]);

  const filtered = getFiltered(query);

  if (!open || filtered.length === 0) return null;

  return (
    <div className="nc-slash-menu" contentEditable={false}>
      {filtered.map((item, i) => (
        <button
          key={item.action}
          className={`nc-slash-item ${i === selectedIndex ? "active" : ""}`}
          onMouseEnter={() => setSelectedIndex(i)}
          onClick={() => selectItem(item)}
        >
          <span className="nc-slash-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function getFiltered(query: string): MenuItem[] {
  if (!query) return ITEMS;
  const q = query.toLowerCase();
  return ITEMS.filter(
    (item) =>
      item.keywords.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q),
  );
}
