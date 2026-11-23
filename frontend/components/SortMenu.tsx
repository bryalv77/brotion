import { ThemedModal } from "@/components/ThemedModal";
import { useState } from "react";
import { Modal, Pressable, Text } from "react-native";
import { ArrowUpDown, Check } from "lucide-react-native";
import { useSidebarPrefs, type PageSort } from "@/stores/sidebarPrefs";
import { colors } from "@/lib/theme";
import { H2 } from "@/components/ui";

const OPTIONS: { value: PageSort; label: string }[] = [
  { value: "az", label: "Alphabetical (A–Z)" },
  { value: "za", label: "Alphabetical (Z–A)" },
  { value: "edited", label: "Last edited" },
  { value: "created", label: "Date created" },
];

/** Small icon button that opens the sidebar sort menu. */
export function SortMenu() {
  const [open, setOpen] = useState(false);
  const sort = useSidebarPrefs((s) => s.sort);
  const setSort = useSidebarPrefs((s) => s.setSort);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Sort pages"
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-md active:bg-surface-hover"
      >
        <ArrowUpDown size={16} strokeWidth={1.5} color={colors.inkLight} />
      </Pressable>
      <ThemedModal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="mx-auto w-full max-w-lg gap-1 rounded-t-2xl bg-surface p-5 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <H2>Sort pages</H2>
            {OPTIONS.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  setSort(o.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                className="h-11 flex-row items-center justify-between rounded-lg px-3 active:bg-surface-hover"
              >
                <Text className="text-base text-ink">{o.label}</Text>
                {sort === o.value ? <Check size={16} strokeWidth={1.5} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </ThemedModal>
    </>
  );
}
