import type { AdoptLocalRequest, AdoptLocalResponse } from "@notion-clone/shared";
import { request } from "@/lib/api/client";

/** Account-scoped endpoints (currently just guest-data adoption). */
export function adoptLocal(body: AdoptLocalRequest): Promise<AdoptLocalResponse> {
  return request<AdoptLocalResponse>("me/adopt-local", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
