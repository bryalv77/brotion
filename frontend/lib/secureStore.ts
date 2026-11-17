import * as SecureStore from "expo-secure-store";

/** iOS/Android: Keychain / Keystore. The web twin is `secureStore.web.ts`. */
export const secureStore = {
  get: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};
