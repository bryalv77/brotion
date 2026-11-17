import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ViewType } from "@notion-clone/shared";
import { addRow, createView, getDatabase } from "@/lib/data/databases";
import { qk } from "@/lib/queryClient";
import {
  Button,
  Chip,
  Divider,
  EmptyState,
  ErrorBanner,
  H2,
  Loading,
} from "@/components/ui";
import { BoardView } from "./db/BoardView";
import { FilterSortBar } from "./db/FilterSortBar";
import { GalleryView } from "./db/GalleryView";
import { ListView } from "./db/ListView";
import { TableView } from "./db/TableView";
import { TemplatesModal } from "./db/TemplatesModal";

const VIEW_TYPES: Array<{ type: ViewType; label: string; icon: string }> = [
  { type: "table", label: "Table", icon: "▦" },
  { type: "list", label: "List", icon: "☰" },
  { type: "board", label: "Board", icon: "▤" },
  { type: "gallery", label: "Gallery", icon: "▧" },
];

/**
 * Native database shell: fetches the database with the active view applied,
 * shows the title, view switcher and add-row action, then delegates the body
 * to the renderer matching the selected view's type.
 */
export function DatabaseView({ databaseId, viewId }: { databaseId: string; viewId?: string }) {
  const qc = useQueryClient();
  const [selectedViewId, setSelectedViewId] = useState<string | undefined>(viewId);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  useEffect(() => {
    setSelectedViewId(viewId);
  }, [viewId]);

  const {
    data: db,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.database(databaseId, selectedViewId),
    queryFn: () => getDatabase(databaseId, selectedViewId),
  });

  const activeView = db?.views.find((view) => view.id === selectedViewId) ?? db?.views[0];
  const hidden = activeView?.config.hidden ?? [];

  const invalidateDatabase = () => {
    qc.invalidateQueries({ queryKey: qk.database(databaseId, selectedViewId) });
    qc.invalidateQueries({ queryKey: ["database", databaseId] });
    qc.invalidateQueries({ queryKey: ["page-databases"] });
  };

  const addRowMut = useMutation({
    mutationFn: () => addRow(databaseId),
    onSuccess: invalidateDatabase,
  });

  const createViewMut = useMutation({
    mutationFn: (input: { name: string; type: ViewType }) =>
      createView(databaseId, input),
    onSuccess: (view) => {
      invalidateDatabase();
      setSelectedViewId(view.id);
    },
  });

  const activateType = (type: ViewType, label: string) => {
    const existing = db?.views.find((view) => view.type === type);
    if (existing) setSelectedViewId(existing.id);
    else createViewMut.mutate({ name: label, type });
  };

  if (isLoading) return <Loading label="Loading database…" />;

  if (isError) {
    return (
      <View className="gap-3 p-4">
        <ErrorBanner
          message={error instanceof Error ? error.message : "Could not load this database"}
        />
        <EmptyState
          title="Something went wrong"
          message="The database could not be loaded."
          action={<Button title="Retry" variant="secondary" onPress={() => void refetch()} />}
        />
      </View>
    );
  }

  if (!db) {
    return <EmptyState title="Database not found" message="It may have been deleted." />;
  }

  const activeType = activeView?.type ?? "table";

  return (
    <ScrollView contentContainerClassName="gap-3 p-4">
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{db.icon ?? "📊"}</Text>
        <View className="min-w-0 flex-1">
          <H2>{db.title || "Untitled database"}</H2>
        </View>
        <Button
          title="Templates"
          variant="ghost"
          onPress={() => setTemplatesOpen(true)}
          className="px-2"
        />
        <Button
          title="Add row"
          onPress={() => addRowMut.mutate()}
          loading={addRowMut.isPending}
          className="px-3"
        />
      </View>

      {/* View-type switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row">
          {VIEW_TYPES.map(({ type, label, icon }) => (
            <Chip
              key={type}
              label={`${icon} ${label}`}
              active={activeType === type}
              onPress={() => activateType(type, label)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Saved views (when there is more than one) */}
      {db.views.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {db.views.map((view) => (
              <Chip
                key={view.id}
                label={view.name}
                active={view.id === activeView?.id}
                onPress={() => setSelectedViewId(view.id)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      <FilterSortBar
        databaseId={databaseId}
        viewId={activeView?.id}
        db={db}
        config={activeView?.config ?? { filters: [], sorts: [] }}
      />

      <Divider />

      {/* Body: one renderer per view type */}
      {activeType === "list" ? (
        <ListView
          db={db}
          viewId={activeView?.id}
          hidden={hidden}
          groupBy={activeView?.config.group_by}
        />
      ) : activeType === "board" ? (
        activeView ? (
          <BoardView db={db} view={activeView} />
        ) : (
          <EmptyState title="No view" message="Create a board view to see grouped rows." />
        )
      ) : activeType === "gallery" ? (
        <GalleryView db={db} hidden={hidden} />
      ) : (
        <TableView db={db} viewId={activeView?.id} hidden={hidden} />
      )}

      <TemplatesModal
        databaseId={databaseId}
        viewId={activeView?.id}
        visible={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
    </ScrollView>
  );
}
