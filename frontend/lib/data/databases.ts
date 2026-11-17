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
import * as api from "@/lib/api/databases";
import * as local from "./local/databases";
import { isLocalMode } from "./mode";

/** Repository seam over databases (guest → local store, user → API). */

export function createDatabase(
  pageId: string,
  body: { title?: string; icon?: string },
): Promise<DatabaseDTO> {
  return isLocalMode()
    ? local.createDatabase(pageId, body)
    : api.createDatabase(pageId, body);
}

export function getDatabase(id: string, viewId?: string): Promise<DatabaseDTO> {
  return isLocalMode()
    ? local.getDatabase(id, viewId)
    : api.getDatabase(id, viewId);
}

export function listPageDatabases(pageId: string): Promise<DatabaseDTO[]> {
  return isLocalMode()
    ? local.listPageDatabases(pageId)
    : api.listPageDatabases(pageId);
}

export function deleteDatabase(id: string): Promise<void> {
  return isLocalMode() ? local.deleteDatabase(id) : api.deleteDatabase(id);
}

export function addProperty(
  databaseId: string,
  body: { name: string; type: PropertyType; options?: unknown },
): Promise<PropertyDTO> {
  return isLocalMode()
    ? local.addProperty(databaseId, body)
    : api.addProperty(databaseId, body);
}

export function updateProperty(
  databaseId: string,
  propertyId: string,
  body: { name?: string; options?: unknown },
): Promise<PropertyDTO> {
  return isLocalMode()
    ? local.updateProperty(databaseId, propertyId, body)
    : api.updateProperty(databaseId, propertyId, body);
}

export function deleteProperty(
  databaseId: string,
  propertyId: string,
): Promise<void> {
  return isLocalMode()
    ? local.deleteProperty(databaseId, propertyId)
    : api.deleteProperty(databaseId, propertyId);
}

export function addRow(
  databaseId: string,
  body?: { template_id?: string | null },
): Promise<{ page_id: string; title: string }> {
  return isLocalMode()
    ? local.addRow(databaseId, body)
    : api.addRow(databaseId, body);
}

export function deleteRow(rowPageId: string): Promise<void> {
  return isLocalMode() ? local.deleteRow(rowPageId) : api.deleteRow(rowPageId);
}

export function updatePropertyValue(
  rowPageId: string,
  propertyId: string,
  value: unknown,
): Promise<{ value: unknown; computed: Record<string, ComputedCell> }> {
  return isLocalMode()
    ? local.updatePropertyValue(rowPageId, propertyId, value)
    : api.updatePropertyValue(rowPageId, propertyId, value);
}

// ── Views ──────────────────────────────────────────────────────────────────

export function createView(
  databaseId: string,
  body: { name?: string; type?: ViewType; config?: ViewConfig },
): Promise<DatabaseViewDTO> {
  return isLocalMode()
    ? local.createView(databaseId, body)
    : api.createView(databaseId, body);
}

export function updateView(
  databaseId: string,
  viewId: string,
  body: { name?: string; type?: ViewType; config?: ViewConfig },
): Promise<DatabaseViewDTO> {
  return isLocalMode()
    ? local.updateView(databaseId, viewId, body)
    : api.updateView(databaseId, viewId, body);
}

export function deleteView(
  databaseId: string,
  viewId: string,
): Promise<void> {
  return isLocalMode()
    ? local.deleteView(databaseId, viewId)
    : api.deleteView(databaseId, viewId);
}

// ── Templates ──────────────────────────────────────────────────────────────

export function listTemplates(databaseId: string): Promise<TemplateDTO[]> {
  return isLocalMode()
    ? local.listTemplates(databaseId)
    : api.listTemplates(databaseId);
}

export function createTemplate(
  databaseId: string,
  body: { name?: string; icon?: string },
): Promise<TemplateDTO> {
  return isLocalMode()
    ? local.createTemplate(databaseId, body)
    : api.createTemplate(databaseId, body);
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
  return isLocalMode()
    ? local.updateTemplate(databaseId, templateId, body)
    : api.updateTemplate(databaseId, templateId, body);
}

export function deleteTemplate(
  databaseId: string,
  templateId: string,
): Promise<void> {
  return isLocalMode()
    ? local.deleteTemplate(databaseId, templateId)
    : api.deleteTemplate(databaseId, templateId);
}
