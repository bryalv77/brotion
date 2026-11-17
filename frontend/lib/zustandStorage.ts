import { Platform } from "react-native";
import { createJSONStorage, type StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

/**
 * Persist non-sensitive UI preferences. iOS/Android use SecureStore; the web
 * app uses localStorage because expo-secure-store has no web implementation.
 */
const IS_WEB = Platform.OS === "web";

const storage: StateStorage = {
  getItem: (name) =>
    IS_WEB
      ? Promise.resolve(typeof localStorage === "undefined" ? null : localStorage.getItem(name))
      : SecureStore.getItemAsync(name),
  setItem: (name, value) =>
    IS_WEB
      ? Promise.resolve(
          typeof localStorage !== "undefined" ? localStorage.setItem(name, value) : undefined,
        )
      : SecureStore.setItemAsync(name, value),
  removeItem: (name) =>
    IS_WEB
      ? Promise.resolve(
          typeof localStorage !== "undefined" ? localStorage.removeItem(name) : undefined,
        )
      : SecureStore.deleteItemAsync(name),
};

export const appStorage = createJSONStorage(() => storage);
