import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENTS = 5;

interface TemplatePrefsState {
  favorites: string[];
  recents: string[];
  toggleFavorite: (id: string) => void;
  recordUsed: (id: string) => void;
}

/** Favorites/recently-used templates — client-only preference, no backend model. */
export const useTemplatePrefs = create<TemplatePrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      recents: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      recordUsed: (id) =>
        set((s) => ({
          recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, MAX_RECENTS),
        })),
    }),
    { name: "nc-template-prefs" },
  ),
);
