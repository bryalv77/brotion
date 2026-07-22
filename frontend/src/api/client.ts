import type { ApiError, ApiResponse } from "@notion-clone/shared";

const BASE = "/api/v1";

/**
 * Typed API client. Wraps fetch with the standard envelope, credentials,
 * and the CSRF header required by mutating endpoints (see shared/contracts.md).
 * Every later feature reuses this — no ad-hoc fetch calls.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let body: unknown;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`Unexpected non-JSON response (status ${res.status})`);
    }
  }

  // 204 No Content or empty body → return undefined (for void endpoints like logout).
  if (!body) return undefined as T;

  const parsed = body as ApiResponse<T>;
  if ("error" in parsed) {
    const err = parsed as ApiError;
    throw new ApiClientError(err.error.message, res.status, err.error.code);
  }
  return parsed.data;
}

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
