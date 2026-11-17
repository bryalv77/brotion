import { secureStore } from "./secureStore";

/** Native-client auth tokens (the web session lives in httpOnly cookies and never reads these). */
const ACCESS_KEY = "nc_access_token";
const REFRESH_KEY = "nc_refresh_token";

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenStorage = {
  async get(): Promise<StoredTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      secureStore.get(ACCESS_KEY),
      secureStore.get(REFRESH_KEY),
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },

  async set(tokens: StoredTokens): Promise<void> {
    await Promise.all([
      secureStore.set(ACCESS_KEY, tokens.accessToken),
      secureStore.set(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([secureStore.remove(ACCESS_KEY), secureStore.remove(REFRESH_KEY)]);
  },
};

/**
 * Remembers whether this device had a signed-in session. With the server
 * unreachable at boot it tells "known user is offline" (offer reconnect) apart
 * from "never logged in" (straight to local guest mode).
 */
const HAD_SESSION_KEY = "nc-had-session";

export const sessionFlag = {
  get: async (): Promise<boolean> => (await secureStore.get(HAD_SESSION_KEY)) === "1",
  set: (): Promise<void> => secureStore.set(HAD_SESSION_KEY, "1"),
  clear: (): Promise<void> => secureStore.remove(HAD_SESSION_KEY),
};
