import { Platform } from "react-native";
import type {
  ApiError,
  ApiResponse,
  NativeSessionTokens,
} from "@notion-clone/shared";
import { tokenStorage } from "../storage";

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

/** Error thrown for every non-2xx API response. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 401;
}

async function rawRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
export async function refreshSession(): Promise<boolean> {
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
    if (path.startsWith("/auth/")) throw err;
    if (!(await refreshSession())) throw err;
    return rawRequest<T>(path, init);
  }
}

/**
 * Multipart variant used by file upload / import. Deliberately does NOT set
 * Content-Type — React Native and the browser set the boundary themselves.
 */
export async function multipartRequest<T>(
  path: string,
  form: FormData,
): Promise<T> {
  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (!IS_WEB) {
    headers["X-Client-Platform"] = "native";
    const tokens = await tokenStorage.get();
    if (tokens) headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers,
    credentials: IS_WEB ? "include" : "omit",
    body: form,
  });

  const text = await res.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Upload failed (status ${res.status})`);
    }
  }
  if (!res.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `Upload failed (${res.status})`;
    throw new Error(message);
  }
  const parsed = body as ApiResponse<T>;
  if ("error" in parsed) {
    throw new ApiClientError(parsed.error.message, res.status, parsed.error.code);
  }
  return parsed.data;
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
