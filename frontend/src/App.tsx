import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth.js";
import { AppShell } from "./components/AppShell.js";
import { LoginPage } from "./routes/LoginPage.js";
import { RegisterPage } from "./routes/RegisterPage.js";
import { WorkspaceView } from "./routes/WorkspaceView.js";
import { PageView } from "./routes/PageView.js";
import { useWorkspaces } from "./hooks/useWorkspaces.js";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<WorkspaceIndex />} />
          <Route path=":wsId" element={<WorkspaceView />} />
          <Route path=":wsId/:pageId" element={<PageView />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

/** Redirect /app to the first workspace (loaded inside RequireAuth). */
function WorkspaceIndex() {
  const { data: workspaces, isLoading } = useWorkspaces();
  if (isLoading) return <div className="p-8 text-neutral-400">Loading…</div>;
  if (!workspaces || workspaces.length === 0)
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        <div className="text-center">
          <p className="text-lg">No workspaces</p>
          <p className="mt-1 text-sm">Ask an admin to add you to a workspace.</p>
        </div>
      </div>
    );
  return <Navigate to={`/app/${workspaces[0].id}`} replace />;
}
