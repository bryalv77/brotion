import type { Prisma } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import { badRequest } from "../../utils/errors.js";
import { refreshPageContentTextTx } from "../pages/pages.service.js";
import type { AdoptLocalInput } from "./adopt.schema.js";

/**
 * Guest → account merge: adopts a local (offline) notebook into the signed-in
 * user's account in a single transaction.
 *
 * Principles:
 * - **Ids are preserved.** Local entities carry client-generated cuid2s, so
 *   re-running an adopt never duplicates data — every create is
 *   skip-if-id-exists, which also makes retries safe.
 * - **Referential integrity.** Creation is ordered by FK dependencies
 *   (workspaces → host/template pages → databases → row pages → blocks →
 *   values); entities whose references can't be resolved are dropped rather
 *   than aborting the whole merge.
 * - **Ownership.** Only workspaces the user owns (newly created here, or
 *   already a member of) are written into.
 */

const BLOCK_TYPES = new Set([
  "paragraph", "heading1", "heading2", "heading3",
  "bulleted_list_item", "numbered_list_item", "todo", "quote", "callout",
  "divider", "code", "image", "table", "table_row", "page_ref",
]);
const PROPERTY_TYPES = new Set([
  "text", "number", "select", "multi_select", "status", "date", "checkbox",
  "url", "formula", "relation", "rollup", "created_time", "created_by",
  "last_edited_time", "last_edited_by",
]);
const VIEW_TYPES = new Set(["table", "list", "board", "gallery"]);

function date(v: string | undefined | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function json(v: unknown): Prisma.InputJsonValue {
  return (v === undefined ? null : v) as Prisma.InputJsonValue;
}

export interface AdoptResult {
  adopted: { workspaces: number; pages: number; blocks: number; databases: number };
}

export async function adoptLocalData(
  userId: string,
  input: AdoptLocalInput,
): Promise<AdoptResult> {
  for (const b of input.blocks) {
    if (!BLOCK_TYPES.has(b.type)) {
      throw badRequest(`Unknown block type: ${b.type}`);
    }
  }

  const result = await getPrisma().$transaction(async (tx) => {
    const counts = { workspaces: 0, pages: 0, blocks: 0, databases: 0 };

    // ── 0. Which referenced entities already exist server-side? ────────────
    const snapshotDbIds = new Set(input.databases.map((d) => d.id));

    const referencedPageIds = new Set<string>([
      ...input.pages.map((p) => p.id),
      ...input.pages.flatMap((p) => (p.parent_id ? [p.parent_id] : [])),
      ...input.blocks.map((b) => b.page_id),
      ...input.databases.map((d) => d.page_id),
      ...input.databases.flatMap((d) => d.templates.map((t) => t.page_id)),
      ...input.values.map((v) => v.page_id),
    ]);
    const referencedDbIds = new Set<string>([
      ...input.pages.flatMap((p) => (p.database_id ? [p.database_id] : [])),
      ...input.databases.flatMap((d) =>
        d.properties.flatMap((p) =>
          p.relation_database_id ? [p.relation_database_id] : [],
        ),
      ),
    ]);

    const [existingPages, existingDbs, existingBlocks] = await Promise.all([
      tx.page.findMany({
        where: { id: { in: [...referencedPageIds] } },
        select: { id: true },
      }),
      tx.database.findMany({
        where: { id: { in: [...referencedDbIds] } },
        select: { id: true },
      }),
      tx.block.findMany({
        where: { id: { in: input.blocks.map((b) => b.id) } },
        select: { id: true },
      }),
    ]);
    const existingPageIds = new Set(existingPages.map((p) => p.id));
    const existingDbIds = new Set(existingDbs.map((d) => d.id));
    const existingBlockIds = new Set(existingBlocks.map((b) => b.id));

    // ── 1. Workspaces (+ OWNER membership). Only member-able ones pass. ────
    const allowedWs = new Set<string>();
    for (const ws of input.workspaces) {
      const member = await tx.workspaceMember.findUnique({
        where: { workspace_id_user_id: { workspace_id: ws.id, user_id: userId } },
        select: { id: true },
      });
      if (member) {
        allowedWs.add(ws.id);
        continue;
      }
      const exists = await tx.workspace.findUnique({
        where: { id: ws.id },
        select: { id: true },
      });
      if (exists) continue; // exists but not ours — never claim it
      await tx.workspace.create({
        data: { id: ws.id, name: ws.name, icon: ws.icon ?? null, created_by: userId },
      });
      await tx.workspaceMember.create({
        data: { workspace_id: ws.id, user_id: userId, role: "OWNER" },
      });
      allowedWs.add(ws.id);
      counts.workspaces++;
    }

    // ── 2. Host + template pages (no database_id), parent-first. ───────────
    const createdPageIds = new Set<string>();
    let pending = input.pages.filter(
      (p) => !p.database_id && allowedWs.has(p.workspace_id) && !existingPageIds.has(p.id),
    );
    const maxPagePasses = pending.length + 1;
    for (let pass = 0; pending.length > 0 && pass <= maxPagePasses; pass++) {
      const remaining: typeof pending = [];
      let progress = false;
      for (const p of pending) {
        const parentOk =
          !p.parent_id || createdPageIds.has(p.parent_id) || existingPageIds.has(p.parent_id);
        if (!parentOk) {
          remaining.push(p);
          continue;
        }
        await tx.page.create({
          data: {
            id: p.id,
            workspace_id: p.workspace_id,
            parent_id: p.parent_id ?? null,
            title: p.title ?? "",
            icon: p.icon ?? null,
            cover_url: p.cover_url ?? null,
            is_deleted: p.is_deleted ?? false,
            deleted_at: date(p.deleted_at),
            deleted_by: p.is_deleted ? userId : null,
            is_template: p.is_template ?? false,
            row_order: p.row_order ?? null,
            created_by: userId,
            last_updated_by: userId,
            ...(p.created_at ? { created_at: date(p.created_at) ?? new Date() } : {}),
            ...(p.updated_at ? { updated_at: date(p.updated_at) ?? new Date() } : {}),
          },
        });
        createdPageIds.add(p.id);
        counts.pages++;
        progress = true;
      }
      if (!progress) break; // unresolvable chain — drop what's left
      pending = remaining;
    }
    /** Pages we may attach blocks/values to (created here or pre-existing).
     * Live view: row pages are created later in step 4. */
    const isUsablePage = (id: string) =>
      createdPageIds.has(id) || existingPageIds.has(id);

    // ── 3. Databases (definitions, properties, views, templates). ──────────
    const createdPropertyIds = new Set<string>();
    const createdDbIds = new Set<string>();
    for (const db of input.databases) {
      if (existingDbIds.has(db.id)) continue; // already adopted — idempotent
      if (!allowedWs.has(db.workspace_id)) continue;
      if (!isUsablePage(db.page_id)) continue; // host page dropped/missing

      for (const prop of db.properties) {
        if (!PROPERTY_TYPES.has(prop.type)) {
          throw badRequest(`Unknown property type: ${prop.type}`);
        }
      }

      await tx.database.create({
        data: {
          id: db.id,
          workspace_id: db.workspace_id,
          page_id: db.page_id,
          title: db.title ?? "",
          icon: db.icon ?? null,
          created_by: userId,
          properties: {
            create: db.properties.map((prop) => ({
              id: prop.id,
              name: prop.name,
              type: prop.type as never,
              options: json(prop.options),
              relation_database_id:
                prop.relation_database_id &&
                (snapshotDbIds.has(prop.relation_database_id) ||
                  existingDbIds.has(prop.relation_database_id))
                  ? prop.relation_database_id
                  : null,
              rollup_config: json(prop.rollup_config),
              order: prop.order ?? 0,
            })),
          },
          views: {
            create: db.views.map((view) => {
              if (view.type && !VIEW_TYPES.has(view.type)) {
                throw badRequest(`Unknown view type: ${view.type}`);
              }
              return {
                id: view.id,
                name: view.name ?? "Table",
                type: (view.type ?? "table") as never,
                config: json(view.config ?? { filters: [], sorts: [] }),
                order: view.order ?? 0,
              };
            }),
          },
        },
      });
      createdDbIds.add(db.id);
      counts.databases++;

      for (const prop of db.properties) createdPropertyIds.add(prop.id);

      // Templates: body pages were created in step 2 (is_template=true).
      for (const tpl of db.templates) {
        if (!isUsablePage(tpl.page_id)) continue;
        await tx.template.create({
          data: {
            id: tpl.id,
            database_id: db.id,
            name: tpl.name ?? "",
            icon: tpl.icon ?? null,
            page_id: tpl.page_id,
            default_values: json(tpl.default_values ?? {}),
            is_default: tpl.is_default ?? false,
            created_by: userId,
          },
        });
      }
    }
    const usableDbIds = new Set([...createdDbIds, ...existingDbIds]);

    // ── 4. Row pages (database_id set). ────────────────────────────────────
    for (const p of input.pages) {
      if (!p.database_id) continue;
      if (existingPageIds.has(p.id)) continue;
      if (!allowedWs.has(p.workspace_id)) continue;
      if (!usableDbIds.has(p.database_id)) continue;
      await tx.page.create({
        data: {
          id: p.id,
          workspace_id: p.workspace_id,
          parent_id: null,
          title: p.title ?? "",
          icon: p.icon ?? null,
          cover_url: p.cover_url ?? null,
          is_deleted: p.is_deleted ?? false,
          deleted_at: date(p.deleted_at),
          deleted_by: p.is_deleted ? userId : null,
          database_id: p.database_id,
          row_order: p.row_order ?? null,
          created_by: userId,
          last_updated_by: userId,
          ...(p.created_at ? { created_at: date(p.created_at) ?? new Date() } : {}),
          ...(p.updated_at ? { updated_at: date(p.updated_at) ?? new Date() } : {}),
        },
      });
      createdPageIds.add(p.id);
      counts.pages++;
    }

    // ── 5. Blocks, parent-first within each page. ──────────────────────────
    const createdBlockIds = new Set<string>();
    let pendingBlocks = input.blocks.filter(
      (b) => !existingBlockIds.has(b.id) && isUsablePage(b.page_id),
    );
    const maxBlockPasses = pendingBlocks.length + 1;
    for (let pass = 0; pendingBlocks.length > 0 && pass <= maxBlockPasses; pass++) {
      const remaining: typeof pendingBlocks = [];
      let progress = false;
      for (const b of pendingBlocks) {
        const parentOk =
          !b.parent_block_id ||
          createdBlockIds.has(b.parent_block_id) ||
          existingBlockIds.has(b.parent_block_id);
        if (!parentOk) {
          remaining.push(b);
          continue;
        }
        await tx.block.create({
          data: {
            id: b.id,
            page_id: b.page_id,
            parent_block_id: b.parent_block_id ?? null,
            type: b.type as never,
            content: json(b.content),
            order: b.order,
            created_by: userId,
            ...(b.created_at ? { created_at: date(b.created_at) ?? new Date() } : {}),
          },
        });
        createdBlockIds.add(b.id);
        counts.blocks++;
        progress = true;
      }
      if (!progress) break;
      pendingBlocks = remaining;
    }

    // ── 6. Property values (upsert — adopt is re-runnable). ────────────────
    const usablePropertyIds = new Set(createdPropertyIds);
    if (input.values.length > 0) {
      const existingProps = await tx.property.findMany({
        where: { id: { in: input.values.map((v) => v.property_id) } },
        select: { id: true },
      });
      for (const p of existingProps) usablePropertyIds.add(p.id);
    }
    for (const v of input.values) {
      if (!isUsablePage(v.page_id)) continue;
      if (!usablePropertyIds.has(v.property_id)) continue;
      await tx.propertyValue.upsert({
        where: {
          page_id_property_id: {
            page_id: v.page_id,
            property_id: v.property_id,
          },
        },
        update: { value: json(v.value) },
        create: {
          page_id: v.page_id,
          property_id: v.property_id,
          value: json(v.value),
        },
      });
    }

    // ── 7. Rebuild search text for the pages we actually created. ──────────
    for (const pageId of createdPageIds) {
      await refreshPageContentTextTx(tx, pageId);
    }

    return { adopted: counts };
  });

  return result;
}
