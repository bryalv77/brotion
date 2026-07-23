import { request } from "./client.js";
import type {
  DatabaseDTO,
  PropertyDTO,
  PropertyType,
} from "@notion-clone/shared";

export function createDatabase(
  pageId: string,
  body: { title?: string; icon?: string },
): Promise<DatabaseDTO> {
  return request<{ database: DatabaseDTO }>(`pages/${pageId}/databases`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.database);
}

export function getDatabase(id: string): Promise<DatabaseDTO> {
  return request<{ database: DatabaseDTO }>(`databases/${id}`).then((r) => r.database);
}

export function deleteDatabase(id: string): Promise<void> {
  return request<void>(`databases/${id}`, { method: "DELETE" });
}

export function addProperty(
  databaseId: string,
  body: { name: string; type: PropertyType },
): Promise<PropertyDTO> {
  return request<{ property: PropertyDTO }>(`databases/${databaseId}/properties`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.property);
}

export function addRow(databaseId: string): Promise<{ page_id: string; title: string }> {
  return request<{ row: { page_id: string; title: string } }>(
    `databases/${databaseId}/rows`,
    { method: "POST", body: "{}" },
  ).then((r) => r.row);
}

export function updatePropertyValue(
  rowPageId: string,
  propertyId: string,
  value: unknown,
): Promise<void> {
  return request<void>(`rows/${rowPageId}/properties/${propertyId}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}
