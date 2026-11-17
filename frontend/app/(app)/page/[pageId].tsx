import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPage, updatePage } from "@/lib/data/pages";
import { qk } from "@/lib/queryClient";
import { usePageBreadcrumbs } from "@/hooks/usePageBreadcrumbs";
import { Editor } from "@/features/editor/Editor";
import { PageDatabases } from "@/components/PageDatabases";
import { PageAttachments } from "@/components/PageAttachments";
import { H1, Input, Loading, Muted, ErrorBanner, Divider } from "@/components/ui";

export default function PageScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: qk.page(pageId),
    queryFn: () => getPage(pageId!),
    enabled: !!pageId,
  });
  const { data: breadcrumbs } = usePageBreadcrumbs(pageId);

  const rename = useMutation({
    mutationFn: (next: string) => updatePage(pageId!, { title: next }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.page(pageId) }),
  });

  useEffect(() => {
    if (data?.page.title !== undefined) setTitle(data.page.title);
  }, [data?.page.title]);

  if (isLoading) return <Loading label="Loading page…" />;
  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Muted>Page not found</Muted>
      </View>
    );
  }

  const { page, blocks } = data;

  const commitTitle = () => {
    setEditingTitle(false);
    const next = title.trim() || "Untitled";
    if (next !== page.title) rename.mutate(next);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="mx-auto w-full max-w-3xl px-5 py-8">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <View className="mb-4 flex-row flex-wrap items-center gap-1">
          {breadcrumbs.map((crumb, i) => (
            <Pressable
              key={crumb.id}
              onPress={() => router.push(`/(app)/page/${crumb.id}`)}
              className="flex-row items-center gap-1"
            >
              <Muted className="text-xs">
                {i > 0 ? " / " : ""}
                {crumb.icon ? `${crumb.icon} ` : ""}
                {crumb.title || "Untitled"}
              </Muted>
            </Pressable>
          ))}
          <Muted className="text-xs"> / </Muted>
        </View>
      ) : null}

      {editingTitle ? (
        <Input
          value={title}
          onChangeText={setTitle}
          onBlur={commitTitle}
          onSubmitEditing={commitTitle}
          autoFocus
          className="text-3xl font-semibold"
        />
      ) : (
        <Pressable onPress={() => setEditingTitle(true)} accessibilityRole="button">
          <H1>{page.icon ? `${page.icon} ` : ""}{page.title || "Untitled"}</H1>
        </Pressable>
      )}

      <ErrorBanner message={rename.error?.message ?? null} />

      <View className="mt-6">
        <Editor pageId={page.id} initialBlocks={blocks} />
      </View>

      <View className="mt-10 gap-8">
        <Divider />
        <PageDatabases pageId={page.id} />
        <PageAttachments pageId={page.id} />
      </View>
    </ScrollView>
  );
}
