import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  quickSearchOpen: boolean;
  toggleSidebar: () => void;
  setQuickSearchOpen: (open: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      quickSearchOpen: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setQuickSearchOpen: (open) => set({ quickSearchOpen: open }),
    }),
    { name: "nc-ui" },
  ),
);
