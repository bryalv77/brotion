import { useParams, useNavigate } from "react-router-dom";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher.js";
import { PageTree } from "./PageTree.js";
import { useUI } from "../stores/ui.js";
import { useSession } from "../stores/session.js";

export function Sidebar() {
  const { wsId } = useParams();
  const navigate = useNavigate();
  const { setQuickSearchOpen } = useUI();
  const { user, signOut } = useSession();
  const { toggleSidebar } = useUI();

  return (
    <aside className="flex w-60 flex-col border-r border-neutral-200 bg-neutral-50">
      {/* Workspace switcher */}
      <div className="border-b border-neutral-200 p-2">
        <WorkspaceSwitcher />
      </div>

      {/* Search */}
      <div className="space-y-1 p-2">
        <button
          onClick={() => setQuickSearchOpen(true)}
          aria-label="Search pages"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200"
        >
          <span className="text-neutral-400">🔍</span>
          Search
          <kbd className="ml-auto rounded border border-neutral-300 bg-white px-1 text-xs text-neutral-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-y-auto px-2">
        {wsId && <PageTree workspaceId={wsId} />}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 p-2">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-sm text-neutral-700">
            {user?.name || user?.email}
          </span>
          <button
            data-testid="logout-btn"
            onClick={() => {
              void signOut().finally(() => navigate("/login", { replace: true }));
            }}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
            title="Log out"
          >
            ⏻
          </button>
        </div>
        <button
          onClick={toggleSidebar}
          className="mt-1 w-full rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-200"
        >
          Collapse sidebar
        </button>
      </div>
    </aside>
  );
}
