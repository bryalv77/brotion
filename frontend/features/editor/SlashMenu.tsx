import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { BlockType } from "@notion-clone/shared";
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  SquareCheck,
  type LucideIcon,
} from "lucide-react-native";
import { Button, Input } from "@/components/ui";
import { colors } from "@/lib/theme";
import { useSearchResults } from "@/components/QuickSearch";

/** What the menu asks the Editor to do to the current block. */
export interface BlockConversion {
  type: BlockType;
  /** Filled in for types that need more than plain text. */
  extras?: { url?: string; pageId?: string; title?: string };
}

export interface SlashMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (conversion: BlockConversion) => void;
}

interface MenuItem {
  group: "Basic" | "Lists" | "Media";
  label: string;
  icon: LucideIcon;
  type: BlockType;
  needsFields?: "image" | "page_ref";
}

// Opened from the "+" on each row, or by typing "/" into an empty text block
// (detected in BlockRow from the changed value, not from key events).
const ITEMS: MenuItem[] = [
  { label: "Text", icon: Pilcrow, group: "Basic", type: "paragraph" },
  { label: "Heading 1", icon: Heading1, group: "Basic", type: "heading1" },
  { label: "Heading 2", icon: Heading2, group: "Basic", type: "heading2" },
  { label: "Heading 3", icon: Heading3, group: "Basic", type: "heading3" },
  { label: "Bulleted list", icon: List, group: "Lists", type: "bulleted_list_item" },
  { label: "Numbered list", icon: ListOrdered, group: "Lists", type: "numbered_list_item" },
  { label: "To-do", icon: SquareCheck, group: "Lists", type: "todo" },
  { label: "Quote", icon: Quote, group: "Basic", type: "quote" },
  { label: "Callout", icon: Lightbulb, group: "Basic", type: "callout" },
  { label: "Code", icon: Code, group: "Basic", type: "code" },
  { label: "Divider", icon: Minus, group: "Basic", type: "divider" },
  { label: "Image", icon: ImageIcon, group: "Media", type: "image", needsFields: "image" },
  { label: "Page reference", icon: LinkIcon, group: "Media", type: "page_ref", needsFields: "page_ref" },
];

export function SlashMenu({ visible, onClose, onSelect }: SlashMenuProps) {
  const [pending, setPending] = useState<"image" | "page_ref" | null>(null);
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [pageQuery, setPageQuery] = useState("");
  const pageSearch = useSearchResults(pending === "page_ref" ? pageQuery : "");

  useEffect(() => {
    if (!visible) {
      setPending(null);
      setUrl("");
      setQuery("");
      setPageQuery("");
    }
  }, [visible]);

  function choose(item: MenuItem) {
    if (item.needsFields) {
      setPending(item.needsFields);
      return;
    }
    onSelect({ type: item.type });
    onClose();
  }

  function applyFields() {
    if (pending === "image") {
      onSelect({ type: "image", extras: { url } });
    }
    setPending(null);
    setUrl("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-white px-5 pt-5">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-medium text-ink">
            {pending === "image"
              ? "Image URL"
              : pending === "page_ref"
                ? "Page reference"
                : "Change block type"}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} className="px-2 py-2">
            <Text className="text-base text-accent">Close</Text>
          </Pressable>
        </View>

        {pending === "image" ? (
          <View className="gap-3">
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/image.png"
              accessibilityLabel="Image URL"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Button title="Apply" onPress={applyFields} />
            <Button title="Back" variant="ghost" onPress={() => setPending(null)} />
          </View>
        ) : pending === "page_ref" ? (
          <View className="gap-3">
            <Input
              value={pageQuery}
              onChangeText={setPageQuery}
              placeholder="Search pages"
              accessibilityLabel="Search pages"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
              {pageSearch.results.map((r) => (
                <Pressable
                  key={r.page_id}
                  onPress={() => {
                    onSelect({ type: "page_ref", extras: { pageId: r.page_id, title: r.title } });
                    onClose();
                  }}
                  accessibilityRole="button"
                  className="min-h-11 justify-center rounded-lg px-3 py-2 active:bg-surface-hover"
                >
                  <Text numberOfLines={1} className="text-base text-ink">
                    {r.title || "Untitled"}
                  </Text>
                </Pressable>
              ))}
              {pageSearch.searched && pageSearch.results.length === 0 ? (
                <Text className="px-3 py-2 text-sm text-inkLight">No results</Text>
              ) : null}
            </ScrollView>
            <Button title="Back" variant="ghost" onPress={() => setPending(null)} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Filter"
              accessibilityLabel="Filter block types"
              autoCapitalize="none"
              autoCorrect={false}
              className="mb-2"
            />
            {(["Basic", "Lists", "Media"] as const).map((group) => {
              const items = ITEMS.filter(
                (i) => i.group === group && i.label.toLowerCase().includes(query.trim().toLowerCase()),
              );
              if (items.length === 0) return null;
              return (
                <View key={group} className="mb-2">
                  <Text className="px-3 pb-1 pt-2 text-xs text-inkLight">{group}</Text>
                  {items.map((item) => (
                    <Pressable
                      key={item.type}
                      onPress={() => choose(item)}
                      accessibilityRole="button"
                      className="min-h-11 flex-row items-center gap-3 rounded-lg px-3 py-2 active:bg-surface-hover"
                    >
                      <item.icon size={18} strokeWidth={1.5} color={colors.inkLight} />
                      <Text className="text-base text-ink">{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
