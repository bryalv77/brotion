import { createJSONStorage } from "zustand/middleware";
import { secureStore } from "./secureStore";

/** Persists non-sensitive UI preferences. */
export const appStorage = createJSONStorage(() => ({
  getItem: secureStore.get,
  setItem: secureStore.set,
  removeItem: secureStore.remove,
}));
