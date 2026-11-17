import { ApiClientError } from "@/lib/api/errors";

/**
 * Shared helpers for the local (guest) repository implementations. Errors
 * are thrown as `ApiClientError` with the same codes the server uses, so
 * every screen's existing error handling works unchanged.
 */

export function notFound(message: string): ApiClientError {
  return new ApiClientError(message, 404, "NOT_FOUND");
}

export function badRequest(
  message: string,
  code = "BAD_REQUEST",
): ApiClientError {
  return new ApiClientError(message, 400, code);
}

export function unprocessable(
  message: string,
  code: string,
): ApiClientError {
  return new ApiClientError(message, 422, code);
}
