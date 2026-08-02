import type { Prisma } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import { getAccessiblePage } from "../auth/permissions.service.js";
import { toTemplateDTO } from "./databases.dto.js";
import { badRequest, notFound } from "../../utils/errors.js";

/**
 * Template business rules: CRUD + instantiation.
 *
 * A Template is a factory for new database rows. Its block body lives on a
 * hidden Page (is_template=true) and is deep-copied onto a new row when the
 * template is applied; `default_values` are seeded onto that row too. After
 * creation the row is fully independent of the template.
 *
 * Property types that are derived (formula, rollup, created_time, created_by,
 * last_edited_time, last_edited_by) are excluded from `default_values` — they
 * cannot be set, mirroring updatePropertyValue's SYSTEM_NOT_EDITABLE /
 * FORMULA_NOT_EDITABLE guards.
 */

/** Property types that cannot carry a stored default (derived / computed). */
const NON_DEFAULTABLE_TYPES = new Set([
  "formula",
  "rollup",
  "created_time",
  "created_by",
  "last_edited_time",
  "last_edited_by",
]);

/** Load a database row + enforce EDITOR access via its hosting page. */
async function loadDbForEdit(databaseId: string, userId: string) {
  const db = await getPrisma().database.findUnique({
    where: { id: databaseId },
    select: { page_id: true, workspace_id: true },
  });
  if (!db) throw notFound("Database not found.");
  await getAccessiblePage(db.page_id, userId, { minAccess: "EDITOR" });
  return db;
}

/** Resolve a template + enforce access via its database's hosting page. */
async function loadTemplateForEdit(templateId: string, userId: string) {
  const template = await getPrisma().template.findUnique({
    where: { id: templateId },
    include: { database: { select: { page_id: true } } },
  });
  if (!template) throw notFound("Template not found.");
  await getAccessiblePage(template.database.page_id, userId, {
    minAccess: "EDITOR",
  });
  return template;
}

/** Create a template: a hidden body page + the Template row linking it. */
export async function createTemplate(
  databaseId: string,
  userId: string,
  input: { name?: string; icon?: string },
) {
  const db = await loadDbForEdit(databaseId, userId);
  const name = input.name?.trim() ?? "";

  // The first template on a database becomes the default (Notion-like: a
  // single template is implicitly the one applied on "New row").
  const existingCount = await getPrisma().template.count({
    where: { database_id: databaseId },
  });
  const isDefault = existingCount === 0;

  const created = await getPrisma().$transaction(async (tx) => {
    // Hidden body page: is_template=true keeps it out of the tree/search/
    // breadcrumbs; parent_id=null so it's never anyone's child.
    const bodyPage = await tx.page.create({
      data: {
        workspace_id: db.workspace_id,
        parent_id: null,
        title: name,
        icon: input.icon ?? null,
        is_template: true,
        created_by: userId,
        last_updated_by: userId,
      },
    });
    const template = await tx.template.create({
      data: {
        database_id: databaseId,
        name,
        icon: input.icon ?? null,
        page_id: bodyPage.id,
        default_values: {} as Prisma.InputJsonValue,
        is_default: isDefault,
        created_by: userId,
      },
    });
    return template;
  });

  return toTemplateDTO(created);
}

/** List a database's templates. */
export async function listTemplates(databaseId: string, userId: string) {
  await loadDbForEdit(databaseId, userId);
  const templates = await getPrisma().template.findMany({
    where: { database_id: databaseId },
    orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
  });
  return templates.map(toTemplateDTO);
}

/** Get one template (VIEWER access on the hosting page is enough to read). */
export async function getTemplate(templateId: string, userId: string) {
  const template = await getPrisma().template.findUnique({
    where: { id: templateId },
    include: { database: { select: { page_id: true } } },
  });
  if (!template) throw notFound("Template not found.");
  await getAccessiblePage(template.database.page_id, userId, {
    minAccess: "VIEWER",
  });
  return toTemplateDTO(template);
}

/**
 * Update a template's metadata and/or defaults. Setting `is_default: true`
 * un-marks the other templates on the same database (only one default).
 */
export async function updateTemplate(
  templateId: string,
  userId: string,
  input: {
    name?: string;
    icon?: string | null;
    is_default?: boolean;
    default_values?: Record<string, unknown>;
  },
) {
  const template = await loadTemplateForEdit(templateId, userId);

  // Validate default_values against the database's properties before writing.
  let normalizedDefaults: Record<string, unknown> | undefined;
  if (input.default_values !== undefined) {
    normalizedDefaults = await normalizeDefaultValues(
      template.database_id,
      input.default_values,
    );
  }

  const updated = await getPrisma().$transaction(async (tx) => {
    // Promote to default: un-mark siblings first (only one default per db).
    if (input.is_default === true) {
      await tx.template.updateMany({
        where: { database_id: template.database_id, is_default: true },
        data: { is_default: false },
      });
    }
    const result = await tx.template.update({
      where: { id: templateId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.is_default !== undefined ? { is_default: input.is_default } : {}),
        ...(normalizedDefaults !== undefined
          ? { default_values: normalizedDefaults as Prisma.InputJsonValue }
          : {}),
      },
    });
    // Keep the hidden body page's title/icon in sync with the template's name.
    if (input.name !== undefined || input.icon !== undefined) {
      await tx.page.update({
        where: { id: template.page_id },
        data: {
          ...(input.name !== undefined ? { title: input.name } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
          last_updated_by: userId,
        },
      });
    }
    return result;
  });

  return toTemplateDTO(updated);
}

/** Delete a template (OWNER only). Cascades its hidden body page + blocks. */
export async function deleteTemplate(templateId: string, userId: string): Promise<void> {
  const template = await getPrisma().template.findUnique({
    where: { id: templateId },
    include: { database: { select: { page_id: true } } },
  });
  if (!template) throw notFound("Template not found.");
  // OWNER — same access tier as deleteDatabase.
  await getAccessiblePage(template.database.page_id, userId, { minAccess: "OWNER" });

  await getPrisma().$transaction(async (tx) => {
    // Delete the template first, then its body page (cascade removes blocks).
    await tx.template.delete({ where: { id: templateId } });
    await tx.page.delete({ where: { id: template.page_id } }).catch(() => {
      /* page already gone — ignore */
    });
  });
}

/**
 * Validate a default_values map: drop keys whose property is missing or whose
 * type is non-defaultable (formula/rollup/system). Mirrors the read-only guards
 * in `updatePropertyValue`.
 */
async function normalizeDefaultValues(
  databaseId: string,
  defaults: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const properties = await getPrisma().property.findMany({
    where: { database_id: databaseId },
    select: { id: true, type: true },
  });
  const out: Record<string, unknown> = {};
  for (const [propId, value] of Object.entries(defaults)) {
    const prop = properties.find((p) => p.id === propId);
    if (!prop) {
      throw badRequest(
        `Property ${propId} does not belong to this database.`,
        { code: "UNKNOWN_PROPERTY" },
      );
    }
    if (NON_DEFAULTABLE_TYPES.has(prop.type)) {
      throw badRequest(
        `${prop.type} properties cannot have a default value.`,
        { code: "NON_DEFAULTABLE_TYPE" },
      );
    }
    out[propId] = value;
  }
  return out;
}

/**
 * Resolve which template (if any) applies when creating a new row on `databaseId`.
 * - explicit `templateId` → that template (must belong to the db).
 * - no explicit id + db has a default template → the default.
 * - otherwise → null (empty row).
 */
export async function resolveTemplateForNewRow(
  databaseId: string,
  templateId: string | null | undefined,
): Promise<{ id: string; page_id: string; default_values: unknown } | null> {
  if (templateId) {
    const t = await getPrisma().template.findUnique({
      where: { id: templateId },
      select: { id: true, database_id: true, page_id: true, default_values: true },
    });
    if (!t) throw badRequest("Template not found.", { code: "TEMPLATE_NOT_FOUND" });
    if (t.database_id !== databaseId) {
      throw badRequest("Template does not belong to this database.", {
        code: "TEMPLATE_WRONG_DATABASE",
      });
    }
    return { id: t.id, page_id: t.page_id, default_values: t.default_values };
  }
  // No explicit template → fall back to the db's default, if any.
  const def = await getPrisma().template.findFirst({
    where: { database_id: databaseId, is_default: true },
    select: { id: true, page_id: true, default_values: true },
  });
  return def ?? null;
}

/**
 * Get the hidden body page id for a template (used by the block endpoints to
 * resolve access through the template → database → hosting page chain).
 * Returns null if the template doesn't exist. Throws on access failure.
 */
export async function getTemplateBodyPageId(
  templateId: string,
  userId: string,
  minAccess: "VIEWER" | "EDITOR" = "EDITOR",
): Promise<string | null> {
  const template = await getPrisma().template.findUnique({
    where: { id: templateId },
    include: { database: { select: { page_id: true } } },
  });
  if (!template) return null;
  await getAccessiblePage(template.database.page_id, userId, { minAccess });
  return template.page_id;
}

/**
 * Deep-copy the block tree from `srcPageId` onto `dstPageId`, remapping
 * `parent_block_id` into the new tree. Same approach as `duplicatePage` but
 * factored out so template instantiation can reuse it within a transaction.
 */
export async function cloneBlocks(
  tx: Prisma.TransactionClient,
  srcPageId: string,
  dstPageId: string,
  userId: string,
): Promise<void> {
  const srcBlocks = await tx.block.findMany({
    where: { page_id: srcPageId },
    orderBy: [{ order: "asc" }, { created_at: "asc" }],
  });
  const idMap = new Map<string, string>();
  for (const b of srcBlocks) {
    const newId = idMap.get(b.id) ?? crypto.randomUUID();
    idMap.set(b.id, newId);
    const newParent = b.parent_block_id ? idMap.get(b.parent_block_id) ?? null : null;
    await tx.block.create({
      data: {
        id: newId,
        page_id: dstPageId,
        parent_block_id: newParent,
        type: b.type,
        content: b.content as Prisma.InputJsonValue,
        order: b.order,
        created_by: userId,
      },
    });
  }
}
