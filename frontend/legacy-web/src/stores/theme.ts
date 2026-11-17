import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

/** Resolve "system" to the actual OS preference. */
function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Apply (or remove) the `dark` class on <html>. */
export function applyTheme(mode: ThemeMode): void {
  const isDark = mode === "dark" || (mode === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
      toggle: () => {
        const current = get().mode;
        const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
        applyTheme(next);
        set({ mode: next });
      },
    }),
    {
      name: "nc-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode);
      },
    },
  ),
);

/** Listen for OS theme changes and re-apply if in system mode. */
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const { mode } = useTheme.getState();
    if (mode === "system") applyTheme("system");
  });
}
