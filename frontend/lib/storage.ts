import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Token storage. On iOS/Android this is Keychain / Keystore via SecureStore.
 * Expo SecureStore has no web implementation, so the web app uses localStorage
 * (the web session itself lives in httpOnly cookies; these tokens are only
 * used by the native clients).
 */
const ACCESS_KEY = "nc_access_token";
const REFRESH_KEY = "nc_refresh_token";
const IS_WEB = Platform.OS === "web";

function webGet(key: string): string | null {
  return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
}

function webSet(key: string, value: string): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
}

function webRemove(key: string): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(key);
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenStorage = {
  async get(): Promise<StoredTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      IS_WEB ? webGet(ACCESS_KEY) : SecureStore.getItemAsync(ACCESS_KEY),
      IS_WEB ? webGet(REFRESH_KEY) : SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },

  async set(tokens: StoredTokens): Promise<void> {
    if (IS_WEB) {
      webSet(ACCESS_KEY, tokens.accessToken);
      webSet(REFRESH_KEY, tokens.refreshToken);
      return;
    }
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    if (IS_WEB) {
      webRemove(ACCESS_KEY);
      webRemove(REFRESH_KEY);
      return;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};

/**
 * Remembers whether this device had a signed-in session (set on login,
 * cleared on logout/expiry). On boot with the server unreachable it lets us
 * tell "known user is offline" (offer reconnect) apart from "never logged
 * in" (go straight to local guest mode). On native the presence of tokens
 * already carries this, but the flag keeps one uniform code path.
 */
const HAD_SESSION_KEY = "nc-had-session";

export const sessionFlag = {
  async get(): Promise<boolean> {
    return IS_WEB
      ? webGet(HAD_SESSION_KEY) === "1"
      : (await SecureStore.getItemAsync(HAD_SESSION_KEY)) === "1";
  },
  async set(): Promise<void> {
    if (IS_WEB) {
      webSet(HAD_SESSION_KEY, "1");
      return;
    }
    await SecureStore.setItemAsync(HAD_SESSION_KEY, "1");
  },
  async clear(): Promise<void> {
    if (IS_WEB) {
      webRemove(HAD_SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(HAD_SESSION_KEY);
  },
};
