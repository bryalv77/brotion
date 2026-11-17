/** Web: expo-secure-store has no web implementation, so this uses localStorage. */
const ls = (): Storage | null => (typeof localStorage === "undefined" ? null : localStorage);

export const secureStore = {
  get: async (key: string): Promise<string | null> => ls()?.getItem(key) ?? null,
  set: async (key: string, value: string): Promise<void> => ls()?.setItem(key, value),
  remove: async (key: string): Promise<void> => ls()?.removeItem(key),
};
