import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appStorage } from "@/lib/zustandStorage";

export type PageSort = "az" | "za" | "edited" | "created";

interface SidebarPrefsState {
  sort: PageSort;
  /** Starred ("Featured") page ids; device-local, works for guests too. */
  featured: string[];
  setSort: (sort: PageSort) => void;
  toggleFeatured: (id: string) => void;
}

export const useSidebarPrefs = create<SidebarPrefsState>()(
  persist(
    (set) => ({
      sort: "az",
      featured: [],
      setSort: (sort) => set({ sort }),
      toggleFeatured: (id) =>
        set((s) => ({
          featured: s.featured.includes(id) ? s.featured.filter((f) => f !== id) : [...s.featured, id],
        })),
    }),
    { name: "nc-sidebar-prefs", storage: appStorage },
  ),
);
