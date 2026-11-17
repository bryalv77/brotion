import { useMemo } from "react";
import { View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useChildPages } from "@/hooks/useChildPages";
import { useCreatePage } from "@/hooks/useCreatePage";
import { qk } from "@/lib/queryClient";
import { getWorkspace } from "@/lib/data/workspaces";
import { Button, EmptyState, H2, Loading, Muted, ScrollScreen, ErrorBanner } from "@/components/ui";

export default function WorkspaceView() {
  const { wsId } = useLocalSearchParams<{ wsId: string }>();
  const { data: workspaces } = useWorkspaces();
  const { data: workspace, isLoading } = useQuery({
    queryKey: qk.workspace(wsId),
    queryFn: () => getWorkspace(wsId),
    enabled: !!wsId,
  });
  const { data: rootPages, isLoading: pagesLoading } = useChildPages(wsId, null);
  const createPage = useCreatePage(wsId);

  const valid = useMemo(
    () => !workspaces || workspaces.some((w) => w.id === wsId),
    [workspaces, wsId],
  );

  if (!wsId) return <Redirect href="/(app)/" />;
  if (!valid && workspaces?.length) {
    return <Redirect href={`/(app)/workspace/${workspaces[0].id}`} />;
  }
  if (isLoading || pagesLoading) return <Loading label="Opening workspace…" />;

  if (rootPages && rootPages.length > 0) {
    return <Redirect href={`/(app)/page/${rootPages[0].id}`} />;
  }

  const addFirstPage = async () => {
    try {
      const page = await createPage.mutateAsync({ title: "Untitled", parent_id: null });
      router.push(`/(app)/page/${page.id}`);
    } catch {
      // surfaced by mutation error banner below
    }
  };

  return (
    <ScrollScreen>
      <View className="mb-6">
        <H2>{workspace?.name ?? "Workspace"}</H2>
        <Muted className="mt-1">Your pages live here. Create one to get started.</Muted>
      </View>
      <ErrorBanner message={createPage.error?.message ?? null} />
      <EmptyState
        title="No pages yet"
        message="Create your first page to start writing."
        action={<Button title="New page" onPress={addFirstPage} loading={createPage.isPending} />}
      />
    </ScrollScreen>
  );
}
