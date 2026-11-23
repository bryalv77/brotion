import { ThemedModal } from "@/components/ThemedModal";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { router, usePathname } from "expo-router";
import { colors } from "@/lib/theme";
import type { SearchResultDTO } from "@notion-clone/shared";
import { useUI } from "@/stores/ui";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { search } from "@/lib/data/search";
import { Input } from "@/components/ui";

function workspaceIdFromPath(path: string): string | undefined {
  return path.match(/\/workspace\/([^/]+)/)?.[1];
}

/** Strip the simple HTML tags the API may include in a snippet. */
function plainSnippet(snippet: string): string {
  return snippet.replace(/<[^>]*>/g, "").trim();
}

/** Debounced workspace search shared by QuickSearch and the page-reference picker. */
export function useSearchResults(query: string) {
  const pathname = usePathname();
  const { data: workspaces } = useWorkspaces();

  // On a page route there is no workspace id in the URL, so fall back to the
  // user's first workspace (the same one the index route redirects to).
  const wsId = workspaceIdFromPath(pathname) ?? workspaces?.[0]?.id;

  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q || !wsId) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const found = await search(wsId, q);
          if (!cancelled) setResults(found);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) {
            setLoading(false);
            setSearched(true);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, wsId]);

  return { results, loading, searched, reset: () => { setResults([]); setSearched(false); } };
}

export function QuickSearch() {
  const quickSearchOpen = useUI((s) => s.quickSearchOpen);
  const setQuickSearchOpen = useUI((s) => s.setQuickSearchOpen);
  const [query, setQuery] = useState("");
  const { results, loading, searched, reset } = useSearchResults(query);

  function close() {
    setQuickSearchOpen(false);
    setQuery("");
    reset();
  }

  function select(result: SearchResultDTO) {
    router.push(`/(app)/page/${result.page_id}`);
    close();
  }

  // Cmd/Ctrl+K toggles search (web only).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const open = useUI.getState().quickSearchOpen;
        if (open) close();
        else setQuickSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const trimmed = query.trim();

  return (
    <ThemedModal
      visible={quickSearchOpen}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View
        className="flex-1 items-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", paddingTop: "14%" }}
      >
        <Pressable
          onPress={close}
          accessibilityLabel="Close search"
          className="absolute inset-0"
        />
        <View
          className="w-full overflow-hidden rounded-xl border border-border bg-surface"
          style={{
            maxWidth: 520,
            shadowColor: "#37352f",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <View className="flex-row items-center justify-between border-b border-border px-4 py-2">
            <Text className="text-sm font-medium text-ink">Search</Text>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close search"
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-md active:bg-surface-hover"
            >
              <X size={18} strokeWidth={1.5} color={colors.inkLight} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2 border-b border-border px-4">
            <Search size={16} strokeWidth={1.5} color={colors.inkFaint} />
            <Input
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search pages…"
              returnKeyType="search"
              className="flex-1 rounded-none border-0 bg-transparent px-0"
              style={{ outlineStyle: "none" } as object}
            />
          </View>

          <View className="min-h-[96px] max-h-80">
            {!trimmed ? (
              <View className="px-4 py-8 items-center">
                <Text className="text-sm text-inkFaint">Type to search</Text>
              </View>
            ) : loading ? (
              <View className="flex-row items-center justify-center gap-2 py-8">
                <ActivityIndicator color={colors.accent} />
                <Text className="text-sm text-inkFaint">Searching…</Text>
              </View>
            ) : results.length === 0 ? (
              <View className="px-4 py-8 items-center">
                <Text className="text-sm text-inkFaint">
                  {searched ? "No results" : "Searching…"}
                </Text>
              </View>
            ) : (
              <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                {results.map((result) => (
                  <Pressable
                    key={result.page_id}
                    onPress={() => select(result)}
                    accessibilityRole="button"
                    className="border-b border-border px-4 py-3 active:bg-surface-hover"
                  >
                    <Text numberOfLines={1} className="text-sm font-medium text-ink">
                      {result.title || "Untitled"}
                    </Text>
                    {result.snippet ? (
                      <Text numberOfLines={2} className="mt-1 text-xs text-inkLight">
                        {plainSnippet(result.snippet)}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </ThemedModal>
  );
}
