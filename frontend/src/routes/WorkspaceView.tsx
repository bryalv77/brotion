import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useWorkspaces } from "../hooks/useWorkspaces.js";
import { useChildPages } from "../hooks/useChildPages.js";

/**
 * Shown at `/app/:wsId` with no specific page selected. Redirects to the first
 * page if one exists; otherwise shows an empty-state CTA.
 */
export function WorkspaceView() {
  const { wsId } = useParams();
  const { data: workspaces } = useWorkspaces();
  const { data: rootPages } = useChildPages(wsId, null);

  useEffect(() => {
    // Side-effect-free; just triggers the queries.
  }, [wsId, workspaces, rootPages]);

  if (!wsId) return <Navigate to="/app" replace />;

  if (workspaces && workspaces.length > 0 && !workspaces.some((w) => w.id === wsId)) {
    return <Navigate to={`/app/${workspaces[0].id}`} replace />;
  }

  if (rootPages && rootPages.length > 0) {
    return <Navigate to={`/app/${wsId}/${rootPages[0].id}`} replace />;
  }

  return (
    <div className="flex h-full items-center justify-center text-neutral-400">
      <div className="text-center">
        <p className="text-lg">No pages yet</p>
        <p className="mt-1 text-sm">Click + in the sidebar to create your first page.</p>
      </div>
    </div>
  );
}
