import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { BlockType } from "@notion-clone/shared";
import { Button, Input } from "@/components/ui";

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
  label: string;
  icon: string;
  type: BlockType;
  needsFields?: "image" | "page_ref";
}

// The "+" menu on each row. Typing "/"-detection is deliberately not used —
// it is unreliable with RN TextInput, so conversion is always explicit.
const ITEMS: MenuItem[] = [
  { label: "Text", icon: "¶", type: "paragraph" },
  { label: "Heading 1", icon: "H₁", type: "heading1" },
  { label: "Heading 2", icon: "H₂", type: "heading2" },
  { label: "Heading 3", icon: "H₃", type: "heading3" },
  { label: "Bulleted list", icon: "•", type: "bulleted_list_item" },
  { label: "Numbered list", icon: "1.", type: "numbered_list_item" },
  { label: "To-do", icon: "☐", type: "todo" },
  { label: "Quote", icon: "❝", type: "quote" },
  { label: "Callout", icon: "💡", type: "callout" },
  { label: "Code", icon: "</>", type: "code" },
  { label: "Divider", icon: "—", type: "divider" },
  { label: "Image", icon: "🖼", type: "image", needsFields: "image" },
  { label: "Page reference", icon: "🔗", type: "page_ref", needsFields: "page_ref" },
];

export function SlashMenu({ visible, onClose, onSelect }: SlashMenuProps) {
  const [pending, setPending] = useState<"image" | "page_ref" | null>(null);
  const [url, setUrl] = useState("");
  const [pageId, setPageId] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!visible) {
      setPending(null);
      setUrl("");
      setPageId("");
      setTitle("");
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
    } else if (pending === "page_ref") {
      onSelect({ type: "page_ref", extras: { pageId, title } });
    }
    setPending(null);
    setUrl("");
    setPageId("");
    setTitle("");
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
          <Pressable onPress={onClose} accessibilityRole="button" className="px-2 py-1">
            <Text className="text-base text-accent">Close</Text>
          </Pressable>
        </View>

        {pending === "image" ? (
          <View className="gap-3">
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/image.png"
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
              value={pageId}
              onChangeText={setPageId}
              placeholder="Page id"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Page title (optional)"
            />
            <Button title="Apply" onPress={applyFields} />
            <Button title="Back" variant="ghost" onPress={() => setPending(null)} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {ITEMS.map((item) => (
              <Pressable
                key={item.type}
                onPress={() => choose(item)}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-lg px-3 py-2"
              >
                <Text className="w-7 text-center text-lg text-inkLight">{item.icon}</Text>
                <Text className="text-base text-ink">{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
