import { Platform } from "react-native";
import type {
  ApiError,
  ApiResponse,
  NativeSessionTokens,
} from "@notion-clone/shared";
import { tokenStorage } from "../storage";
import { ApiClientError, isUnauthorized } from "./errors";

/**
 * Base URL for the API. Expo web and the native simulators can reach
 * http://localhost:4000; a physical device needs your machine's LAN address,
 * e.g. EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 expo start
 */
const HOST = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");
const BASE = `${HOST}/api/v1`;

const IS_WEB = Platform.OS === "web";

async function rawRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    // FormData must not set Content-Type: the runtime adds the multipart boundary.
    ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    // Required by the backend's CSRF guard for all mutations.
    "X-Requested-With": "XMLHttpRequest",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (!IS_WEB) {
    // Native can't use httpOnly cookies: identify as native and send the
    // access token as a bearer token from secure storage.
    headers["X-Client-Platform"] = "native";
    const tokens = await tokenStorage.get();
    if (tokens) headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: IS_WEB ? "include" : "omit",
  });

  const text = await res.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected non-JSON response (status ${res.status})`);
    }
  }

  if (!res.ok && (!body || !("error" in (body as object)))) {
    throw new ApiClientError(`Request failed (${res.status})`, res.status, "HTTP_ERROR");
  }
  if (!body) return undefined as T;

  const parsed = body as ApiResponse<T>;
  if ("error" in parsed) {
    const err = parsed as ApiError;
    throw new ApiClientError(
      err.error.message,
      res.status,
      err.error.code,
    );
  }
  return parsed.data;
}

/** Swap the refresh token for a fresh token pair. Returns false on failure. */
async function refreshSession(): Promise<boolean> {
  if (IS_WEB) {
    // Browser relies on the httpOnly refresh cookie; no local token to swap.
    try {
      await rawRequest("/auth/refresh", { method: "POST" });
      return true;
    } catch {
      return false;
    }
  }

  const tokens = await tokenStorage.get();
  if (!tokens) return false;
  try {
    const data = await rawRequest<{ user: unknown; tokens: NativeSessionTokens }>(
      "/auth/refresh",
      {
        method: "POST",
        headers: { "X-Refresh-Token": tokens.refreshToken },
      },
    );
    if (data.tokens) await tokenStorage.set(data.tokens);
    return true;
  } catch {
    await tokenStorage.clear();
    return false;
  }
}

/** Public API request wrapper: retries once after a token refresh on 401. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await rawRequest<T>(path, init);
  } catch (err) {
    if (!isUnauthorized(err)) throw err;
    // Don't try to refresh the refresh endpoint itself — avoid loops.
    if (path.replace(/^\//, "").startsWith("auth/")) throw err;
    if (!(await refreshSession())) throw err;
    return rawRequest<T>(path, init);
  }
}

/** Extract native tokens from a login/register response and persist them. */
export async function persistNativeTokens(
  payload: { tokens?: NativeSessionTokens } | undefined,
): Promise<void> {
  if (!IS_WEB && payload?.tokens) await tokenStorage.set(payload.tokens);
}

/** Clear all locally held credentials (called on sign-out). */
export async function clearCredentials(): Promise<void> {
  if (!IS_WEB) await tokenStorage.clear();
}
