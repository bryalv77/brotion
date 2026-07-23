import type { Database, Property, PropertyValue } from "@prisma/client";
import type { Page } from "@prisma/client";
import type {
  DatabaseDTO,
  PropertyDTO,
  PropertyValueDTO,
} from "@notion-clone/shared";

export function toPropertyDTO(p: Property): PropertyDTO {
  return {
    id: p.id,
    database_id: p.database_id,
    name: p.name,
    type: p.type,
    options: p.options ?? undefined,
    order: p.order,
  };
}

export function toPropertyValueDTO(
  v: PropertyValue,
): PropertyValueDTO {
  return { id: v.id, property_id: v.property_id, value: v.value };
}

export function toDatabaseDTO(
  db: Database & { properties: Property[]; rows?: Array<Page & { property_values: PropertyValue[] }> },
): DatabaseDTO {
  return {
    id: db.id,
    page_id: db.page_id,
    workspace_id: db.workspace_id,
    title: db.title,
    icon: db.icon,
    properties: db.properties.map(toPropertyDTO),
    rows: (db.rows ?? []).map((p) => ({
      page_id: p.id,
      title: p.title,
      values: p.property_values.map(toPropertyValueDTO),
    })),
  };
}
