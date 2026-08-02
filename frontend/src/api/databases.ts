import { request } from "./client.js";
import type {
  ComputedCell,
  DatabaseDTO,
  DatabaseViewDTO,
  PropertyDTO,
  PropertyType,
  TemplateDTO,
  ViewConfig,
  ViewType,
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

export function getDatabase(id: string, viewId?: string): Promise<DatabaseDTO> {
  const qs = viewId ? `?view_id=${viewId}` : "";
  return request<{ database: DatabaseDTO }>(`databases/${id}${qs}`).then(
    (r) => r.database,
  );
}

export function listPageDatabases(pageId: string): Promise<DatabaseDTO[]> {
  return request<{ databases: DatabaseDTO[] }>(`pages/${pageId}/databases`).then(
    (r) => r.databases,
  );
}

export function deleteDatabase(id: string): Promise<void> {
  return request<void>(`databases/${id}`, { method: "DELETE" });
}

export function addProperty(
  databaseId: string,
  body: { name: string; type: PropertyType; options?: unknown },
): Promise<PropertyDTO> {
  return request<{ property: PropertyDTO }>(`databases/${databaseId}/properties`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.property);
}

export function updateProperty(
  databaseId: string,
  propertyId: string,
  body: { name?: string; options?: unknown },
): Promise<PropertyDTO> {
  return request<{ property: PropertyDTO }>(
    `databases/${databaseId}/properties/${propertyId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  ).then((r) => r.property);
}

export function deleteProperty(databaseId: string, propertyId: string): Promise<void> {
  return request<void>(`databases/${databaseId}/properties/${propertyId}`, {
    method: "DELETE",
  });
}

export function addRow(
  databaseId: string,
  body?: { template_id?: string | null },
): Promise<{ page_id: string; title: string }> {
  return request<{ row: { page_id: string; title: string } }>(
    `databases/${databaseId}/rows`,
    { method: "POST", body: JSON.stringify(body ?? {}) },
  ).then((r) => r.row);
}

export function deleteRow(rowPageId: string): Promise<void> {
  return request<void>(`rows/${rowPageId}`, { method: "DELETE" });
}

export function updatePropertyValue(
  rowPageId: string,
  propertyId: string,
  value: unknown,
): Promise<{ value: unknown; computed: Record<string, ComputedCell> }> {
  return request<{ value: unknown; computed: Record<string, ComputedCell> }>(
    `rows/${rowPageId}/properties/${propertyId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ value }),
    },
  );
}

// ── Views ──────────────────────────────────────────────────────────────────

export function createView(
  databaseId: string,
  body: { name?: string; type?: ViewType; config?: ViewConfig },
): Promise<DatabaseViewDTO> {
  return request<{ view: DatabaseViewDTO }>(`databases/${databaseId}/views`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.view);
}

export function updateView(
  databaseId: string,
  viewId: string,
  body: { name?: string; type?: ViewType; config?: ViewConfig },
): Promise<DatabaseViewDTO> {
  return request<{ view: DatabaseViewDTO }>(
    `databases/${databaseId}/views/${viewId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  ).then((r) => r.view);
}

export function deleteView(databaseId: string, viewId: string): Promise<void> {
  return request<void>(`databases/${databaseId}/views/${viewId}`, {
    method: "DELETE",
  });
}

// ── Templates ──────────────────────────────────────────────────────────────

export function listTemplates(databaseId: string): Promise<TemplateDTO[]> {
  return request<{ templates: TemplateDTO[] }>(
    `databases/${databaseId}/templates`,
  ).then((r) => r.templates);
}

export function createTemplate(
  databaseId: string,
  body: { name?: string; icon?: string },
): Promise<TemplateDTO> {
  return request<{ template: TemplateDTO }>(`databases/${databaseId}/templates`, {
    method: "POST",
    body: JSON.stringify(body),
  }).then((r) => r.template);
}

export function updateTemplate(
  databaseId: string,
  templateId: string,
  body: {
    name?: string;
    icon?: string | null;
    is_default?: boolean;
    default_values?: Record<string, unknown>;
  },
): Promise<TemplateDTO> {
  return request<{ template: TemplateDTO }>(
    `databases/${databaseId}/templates/${templateId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  ).then((r) => r.template);
}

export function deleteTemplate(databaseId: string, templateId: string): Promise<void> {
  return request<void>(`databases/${databaseId}/templates/${templateId}`, {
    method: "DELETE",
  });
}

