import { Redirect } from "expo-router";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { EmptyState, Loading } from "@/components/ui";

export default function WorkspaceIndex() {
  const { data: workspaces, isLoading } = useWorkspaces();

  if (isLoading) return <Loading label="Loading workspaces…" />;

  if (!workspaces || workspaces.length === 0) {
    return (
      <EmptyState
        title="No workspaces"
        message="Ask an admin to add you to a workspace, or use + in the sidebar to create one."
      />
    );
  }

  return <Redirect href={`/(app)/workspace/${workspaces[0].id}`} />;
}
