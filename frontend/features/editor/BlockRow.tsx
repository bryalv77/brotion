import { useEffect, useState, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { BlockDTO } from "@notion-clone/shared";
import { colors } from "@/lib/theme";
import { blockToText, richTextToPlainText, textRun } from "./blocks";
import { SlashMenu, type BlockConversion } from "./SlashMenu";

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
}

const TEXT_STYLES: Record<string, string> = {
  paragraph: "text-base text-ink",
  heading1: "text-3xl font-bold text-ink",
  heading2: "text-2xl font-semibold text-ink",
  heading3: "text-xl font-semibold text-ink",
  bulleted_list_item: "text-base text-ink",
  numbered_list_item: "text-base text-ink",
  todo: "text-base text-ink",
  quote: "text-base italic text-ink",
  callout: "text-base text-ink",
  code: "text-sm font-mono text-ink",
};

const TEXT_TYPES = new Set([
  "paragraph",
  "heading1",
  "heading2",
  "heading3",
  "bulleted_list_item",
  "numbered_list_item",
  "todo",
  "quote",
  "callout",
  "code",
]);

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
      value={text}
      onChangeText={handleTextChange}
      // Multiline RN inputs give no reliable Enter key event — use the explicit
      // "Add block below" button for code instead.
      onSubmitEditing={isCode ? undefined : () => onAddBelow(block.id)}
      multiline={isCode}
      numberOfLines={isCode ? 8 : 1}
      placeholder={isCode ? "// code" : "Type something…"}
      placeholderTextColor={colors.inkFaint}
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
            className="min-w-0 flex-1 rounded border border-border bg-white px-2 py-1 text-xs text-ink"
          />
        </View>
      </View>
    );
  } else if (block.type === "callout") {
    body = (
      <View className="flex-row items-start gap-2 rounded-lg bg-surface-hover px-3 py-2">
        <Text className="text-base">{c.type === "callout" ? (c.icon ?? "💡") : "💡"}</Text>
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
  } else if (block.type === "page_ref") {
    const page = c.type === "page_ref" ? c : undefined;
    // Page navigation lives outside this editor feature; the card is kept
    // tappable so a host screen can wire it up later.
    body = (
      <Pressable accessibilityRole="link" className="flex-row items-center gap-2 rounded-lg border border-border px-3 py-2">
        <Text className="text-lg">{page?.icon ?? "📄"}</Text>
        <Text className="flex-1 text-base text-accent">{page?.title ?? "Untitled"}</Text>
      </Pressable>
    );
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
                        table?.has_header_row && rowIndex === 0 ? "font-bold" : ""
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
        className="pt-1"
      >
        <Text className="text-lg text-ink">{checked ? "☑" : "☐"}</Text>
      </Pressable>
    );
  }

  return (
    <View className="px-4 py-1">
      <View className="flex-row items-start gap-1.5">
        <Pressable
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          hitSlop={8}
          className="pt-1"
        >
          <Text className="text-lg text-inkFaint">+</Text>
        </Pressable>
        {prefix}
        <View className="flex-1">{body}</View>
        <Pressable
          onPress={() => onDelete(block.id)}
          accessibilityRole="button"
          hitSlop={8}
          className="px-1 pt-1"
        >
          <Text className="text-sm text-inkFaint">×</Text>
        </Pressable>
      </View>

      {isCode ? (
        <Pressable onPress={() => onAddBelow(block.id)} className="ml-8 mt-1 self-start">
          <Text className="text-xs text-accent">+ Add block below</Text>
        </Pressable>
      ) : null}

      <SlashMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={(conversion) => onConvert(block.id, conversion)}
      />
    </View>
  );
}

/** Convenience for callers that only need to know if a row is text-bearing. */
export function isTextType(type: string): boolean {
  return TEXT_TYPES.has(type);
}
