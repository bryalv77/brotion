import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.js";
import { QuickSearch } from "./QuickSearch.js";
import { useUI } from "../stores/ui.js";

export function AppShell() {
  const { sidebarCollapsed, setQuickSearchOpen, toggleSidebar } = useUI();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Cmd/Ctrl+K → quick search.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setQuickSearchOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Desktop sidebar */}
      {!sidebarCollapsed && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Mobile sidebar (overlay) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed left-3 top-3 z-30 rounded-md border border-neutral-200 bg-white p-1.5 text-neutral-600 shadow-sm md:hidden"
          aria-label="Open sidebar"
        >
          ☰
        </button>
        {/* Collapse toggle (desktop) */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="fixed left-[15rem] top-3 z-20 hidden rounded-md border border-neutral-200 bg-white p-1 text-neutral-400 shadow-sm hover:text-neutral-700 md:block"
            aria-label="Collapse sidebar"
          >
            ←
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="fixed left-3 top-3 z-20 hidden rounded-md border border-neutral-200 bg-white p-1 text-neutral-400 shadow-sm hover:text-neutral-700 md:block"
            aria-label="Open sidebar"
          >
            →
          </button>
        )}
        <Outlet />
      </main>
      <QuickSearch />
    </div>
  );
}
