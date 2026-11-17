import { useColorScheme } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appStorage } from "@/lib/zustandStorage";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
      toggle: () => {
        const current = get().mode;
        const next =
          current === "light" ? "dark" : current === "dark" ? "system" : "light";
        set({ mode: next });
      },
    }),
    { name: "nc-theme", storage: appStorage },
  ),
);

/** Resolve the stored mode against the OS colour scheme. */
export function useIsDark(): boolean {
  const { mode } = useTheme();
  const scheme = useColorScheme();
  return mode === "dark" || (mode === "system" && scheme === "dark");
}
