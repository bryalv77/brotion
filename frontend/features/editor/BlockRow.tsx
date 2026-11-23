import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { BlockDTO } from "@notion-clone/shared";
import { colors } from "@/lib/theme";
import { DatabaseView } from "@/components/DatabaseView";
import { PageGlyph } from "@/components/ui";
import { PageRefCard } from "./PageRefCard";
import { blockToText, richTextToPlainText, textRun } from "./blocks";
import { SlashMenu, type BlockConversion } from "./SlashMenu";
import { GripVertical, Lightbulb, Plus, Square, SquareCheck, X } from "lucide-react-native";

export interface BlockRowProps {
  block: BlockDTO;
  /** 1-based number for numbered_list_item rows. */
  listIndex: number;
  /** table_row children of a table block (passed in by the Editor). */
  tableRows: BlockDTO[];
  onChangeText: (id: string, text: string) => void;
  onChangeContent: (id: string, content: Record<string, unknown>) => void;
  onToggleChecked: (id: string, checked: boolean) => void;
  onAddBelow: (id: string) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string, conversion: BlockConversion) => void;
  onMove: (id: string, targetId: string, pos: "before" | "after") => void;
  autoFocus?: boolean;
  /** Bump to re-focus an already-mounted block. */
  focusNonce?: number;
}

const TEXT_STYLES: Record<string, string> = {
  paragraph: "text-base text-ink",
  heading1: "text-3xl font-semibold text-ink",
  heading2: "text-2xl font-medium text-ink",
  heading3: "text-xl font-medium text-ink",
  bulleted_list_item: "text-base text-ink",
  numbered_list_item: "text-base text-ink",
  todo: "text-base text-ink",
  quote: "text-base italic text-ink",
  callout: "text-base text-ink",
  code: "text-sm font-mono text-ink",
};

/** Id of the block currently being dragged (one drag at a time, shared across rows). */
let draggingId: string | null = null;

export function BlockRow({
  block,
  listIndex,
  tableRows,
  onChangeText,
  onChangeContent,
  onToggleChecked,
  onAddBelow,
  onDelete,
  onConvert,
  onMove,
  autoFocus,
  focusNonce,
}: BlockRowProps) {
  const c = block.content;
  const isCode = block.type === "code";
  const [text, setText] = useState(() => blockToText(block));
  const [lang, setLang] = useState(c.type === "code" ? c.language : "plaintext");
  const [url, setUrl] = useState(c.type === "image" ? c.url : "");
  const [caption, setCaption] = useState(
    c.type === "image" ? richTextToPlainText(c.caption) : "",
  );
  const [menuVisible, setMenuVisible] = useState(false);
  // On web the row controls reveal on hover or focus; native keeps them visible.
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(0);
  const showChrome = Platform.OS !== "web" || hover || focus > 0 || menuVisible;
  const chromeStyle = { opacity: showChrome ? 1 : 0 } as const;
  const chromeFocus = {
    onFocus: () => setFocus((n) => n + 1),
    onBlur: () => setFocus((n) => Math.max(0, n - 1)),
  };

  // ── drag & drop reorder (web only; uses native HTML5 drag events) ───────────
  const rowRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  // Re-focus on demand (autoFocus alone only applies on mount).
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus, focusNonce]);
  const handleRef = useRef<any>(null);
  const [dropPos, setDropPos] = useState<"before" | "after" | null>(null);
  const moveRef = useRef(onMove);
  moveRef.current = onMove;
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const row = rowRef.current as HTMLElement | null;
    const handle = handleRef.current as HTMLElement | null;
    if (!row || !handle) return;
    const posFor = (e: DragEvent) => {
      const r = row.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2 ? "before" : "after";
    };
    const onStart = (e: DragEvent) => {
      draggingId = block.id;
      e.dataTransfer?.setData("text/plain", block.id); // Firefox needs data to start a drag
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      e.dataTransfer?.setDragImage(row, 0, 0);
    };
    const onEnd = () => {
      draggingId = null;
      setDropPos(null);
    };
    const onOver = (e: DragEvent) => {
      if (!draggingId || draggingId === block.id) return;
      e.preventDefault();
      setDropPos(posFor(e));
    };
    const onLeave = (e: DragEvent) => {
      if (!row.contains(e.relatedTarget as Node | null)) setDropPos(null);
    };
    const onDrop = (e: DragEvent) => {
      if (!draggingId || draggingId === block.id) return;
      e.preventDefault();
      moveRef.current(draggingId, block.id, posFor(e));
      onEnd();
    };
    handle.draggable = true;
    handle.addEventListener("dragstart", onStart);
    handle.addEventListener("dragend", onEnd);
    row.addEventListener("dragover", onOver);
    row.addEventListener("dragleave", onLeave);
    row.addEventListener("drop", onDrop);
    return () => {
      handle.removeEventListener("dragstart", onStart);
      handle.removeEventListener("dragend", onEnd);
      row.removeEventListener("dragover", onOver);
      row.removeEventListener("dragleave", onLeave);
      row.removeEventListener("drop", onDrop);
    };
  }, [block.id]);

  // A slash-menu conversion keeps the same row (keyed by block.id) but swaps
  // its content shape — reflect externally supplied image/code fields then.
  useEffect(() => {
    if (block.type === "image" && c.type === "image") {
      setUrl(c.url);
      setCaption(richTextToPlainText(c.caption));
    }
    if (block.type === "code" && c.type === "code") {
      setLang(c.language);
    }
  }, [block.type, c]);

  function handleTextChange(value: string) {
    // A lone "/" opens the block menu and is not kept as text.
    if (value === "/" && !isCode && text === "") {
      setMenuVisible(true);
      return;
    }
    setText(value);
    onChangeText(block.id, value);
  }

  function updateImage(patch: { url?: string; caption?: string }) {
    const nextUrl = patch.url ?? url;
    const nextCaption = patch.caption ?? caption;
    const old = c.type === "image" ? c : undefined;
    onChangeContent(block.id, {
      type: "image",
      url: nextUrl,
      ...(old?.alt !== undefined ? { alt: old.alt } : {}),
      ...(old?.mime_type !== undefined ? { mime_type: old.mime_type } : {}),
      caption: [textRun(nextCaption)],
    });
  }

  function updateLanguage(value: string) {
    setLang(value);
    const old = c.type === "code" ? c : undefined;
    onChangeContent(block.id, {
      type: "code",
      text,
      language: value,
      ...(old?.caption !== undefined ? { caption: old.caption } : {}),
    });
  }

  // ── text-bearing block input ────────────────────────────────────────────────
  const textInput: ReactNode = (
    <TextInput
      ref={inputRef}
      value={text}
      onChangeText={handleTextChange}
      // Multiline RN inputs give no reliable Enter key event — use the explicit
      // "Add block below" button for code instead.
      onSubmitEditing={isCode ? undefined : () => onAddBelow(block.id)}
      autoFocus={autoFocus}
      multiline={isCode}
      numberOfLines={isCode ? 8 : 1}
      placeholder={isCode ? "// code" : "Type / for blocks"}
      placeholderTextColor={colors.placeholder}
      className={`flex-1 py-1 ${TEXT_STYLES[block.type] ?? "text-base text-ink"}`}
      style={isCode ? { minHeight: 150, textAlignVertical: "top" } : undefined}
    />
  );

  let body: ReactNode;

  if (isCode) {
    body = (
      <View className="rounded-lg border border-border bg-surface-hover px-3 py-2">
        {textInput}
        <View className="mt-2 flex-row items-center gap-2">
          <Text className="text-xs text-inkLight">Language</Text>
          <TextInput
            value={lang}
            onChangeText={updateLanguage}
            placeholder="plaintext"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
            autoCorrect={false}
            className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
          />
        </View>
      </View>
    );
  } else if (block.type === "callout") {
    body = (
      <View className="flex-row items-start gap-2 rounded-lg bg-surface-hover px-3 py-2">
        {c.type === "callout" && c.icon ? (
          <Text className="text-base">{c.icon}</Text>
        ) : (
          <Lightbulb size={18} strokeWidth={1.5} color={colors.inkLight} />
        )}
        <View className="flex-1">{textInput}</View>
      </View>
    );
  } else if (block.type === "quote") {
    body = (
      <View className="flex-row gap-2">
        <View className="w-0.5 self-stretch bg-inkFaint" />
        <View className="flex-1">{textInput}</View>
      </View>
    );
  } else if (block.type === "divider") {
    body = <View className="my-3 h-px w-full bg-border" />;
  } else if (block.type === "image") {
    body = (
      <View className="gap-2">
        {url.trim() !== "" ? (
          <Image
            source={{ uri: url }}
            resizeMode="cover"
            style={{ width: "100%", height: 200, borderRadius: 8 }}
          />
        ) : (
          <View className="h-32 items-center justify-center rounded-lg bg-surface-hover">
            <Text className="text-sm text-inkLight">No image URL yet</Text>
          </View>
        )}
        <TextInput
          value={url}
          onChangeText={(value) => {
            setUrl(value);
            updateImage({ url: value });
          }}
          placeholder="Image URL"
          placeholderTextColor={colors.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          className="rounded border border-border px-2 py-1 text-xs text-ink"
        />
        <TextInput
          value={caption}
          onChangeText={(value) => {
            setCaption(value);
            updateImage({ caption: value });
          }}
          placeholder="Caption"
          placeholderTextColor={colors.inkFaint}
          className="rounded border border-border px-2 py-1 text-xs text-ink"
        />
      </View>
    );
  } else if (block.type === "database") {
    body = c.type === "database" ? <DatabaseView databaseId={c.database_id} /> : null;
  } else if (block.type === "page_ref") {
    body = c.type === "page_ref" ? <PageRefCard pageId={c.page_id} title={c.title} icon={c.icon} /> : null;
  } else if (block.type === "table") {
    const table = c.type === "table" ? c : undefined;
    const rowCellCount = (row: BlockDTO) =>
      row.content.type === "table_row" ? row.content.cells.length : 0;
    const columnCount = Math.max(
      table?.column_count ?? 1,
      1,
      ...tableRows.map(rowCellCount),
    );
    body = (
      <ScrollView horizontal contentContainerStyle={{ minWidth: "100%" }}>
        <View>
          {tableRows.map((row, rowIndex) => {
            const cells = row.content.type === "table_row" ? row.content.cells : [];
            return (
              <View key={row.id} className="flex-row">
                {Array.from({ length: Math.max(columnCount, cells.length) }, (_, colIndex) => (
                  <View
                    key={colIndex}
                    className="border-b border-r border-border px-2 py-2"
                    style={{ minWidth: 100, flex: 1 }}
                  >
                    <Text
                      className={`text-sm text-ink ${
                        table?.has_header_row && rowIndex === 0 ? "font-medium" : ""
                      }`}
                    >
                      {richTextToPlainText(cells[colIndex])}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
          {tableRows.length === 0 ? (
            <Text className="py-2 text-sm text-inkLight">Empty table</Text>
          ) : null}
        </View>
      </ScrollView>
    );
  } else {
    body = textInput;
  }

  // ── left-hand prefix (bullets, numbers, checkbox) ────────────────────────────
  let prefix: ReactNode = null;
  if (block.type === "bulleted_list_item") {
    prefix = <Text className="w-5 pt-1 text-center text-base text-ink">•</Text>;
  } else if (block.type === "numbered_list_item") {
    prefix = <Text className="min-w-5 pt-1 text-sm text-inkLight">{listIndex}.</Text>;
  } else if (block.type === "todo") {
    const checked = c.type === "todo" && c.checked;
    prefix = (
      <Pressable
        onPress={() => onToggleChecked(block.id, !checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={text || "To-do"}
        hitSlop={12}
        className="pt-1"
      >
        {checked ? (
          <SquareCheck size={18} strokeWidth={1.5} color={colors.accent} />
        ) : (
          <Square size={18} strokeWidth={1.5} color={colors.inkLight} />
        )}
      </Pressable>
    );
  }

  return (
    <View
      ref={rowRef}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="py-1"
    >
      {dropPos ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 h-0.5 bg-accent"
          style={dropPos === "before" ? { top: 0 } : { bottom: 0 }}
        />
      ) : null}
      <View className="flex-row items-start gap-2">
        {Platform.OS === "web" ? (
          <View ref={handleRef} accessibilityLabel="Drag to reorder" className="h-8 items-center justify-center" style={[chromeStyle, { cursor: "grab" } as object]}>
            <GripVertical size={18} strokeWidth={1.5} color={colors.inkFaint} />
          </View>
        ) : null}
        <Pressable
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Change block type"
          hitSlop={12}
          className="h-8 items-center justify-center"
          style={chromeStyle}
          {...chromeFocus}
        >
          <Plus size={18} strokeWidth={1.5} color={colors.inkFaint} />
        </Pressable>
        {prefix}
        <View className="flex-1">{body}</View>
        <Pressable
          onPress={() => onDelete(block.id)}
          accessibilityRole="button"
          accessibilityLabel="Delete block"
          hitSlop={12}
          className="h-8 items-center justify-center px-1"
          style={chromeStyle}
          {...chromeFocus}
        >
          <X size={16} strokeWidth={1.5} color={colors.inkFaint} />
        </Pressable>
      </View>

      {isCode ? (
        <Pressable onPress={() => onAddBelow(block.id)} accessibilityRole="button" hitSlop={12} className="ml-8 mt-1 self-start">
          <Text className="text-xs text-accent">Add block below</Text>
        </Pressable>
      ) : null}

      <SlashMenu
        pageId={block.page_id}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={(conversion) => onConvert(block.id, conversion)}
      />
    </View>
  );
}

/** Convenience for callers that only need to know if a row is text-bearing. */
export function isTextType(type: string): boolean {
  return type in TEXT_STYLES;
}
