import type { Prisma, PropertyType, ViewType } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";
import {
  assertWorkspaceMember,
  getAccessiblePage,
} from "../auth/permissions.service.js";
import { toPageDTO } from "../pages/pages.dto.js";
import { refreshPageContentTextTx } from "../pages/pages.service.js";
import { badRequest, notFound } from "../../utils/errors.js";
import type { PageTemplateSummaryDTO } from "@notion-clone/shared";
import { ALL_PAGE_TEMPLATES, findPageTemplate } from "./registry/index.js";
import type {
  TplBlockContent,
  TplBlockNode,
  TplKey,
} from "./registry/types.js";

/** GET /page-templates — static metadata, no auth-scoped filtering needed. */
export function listPageTemplates(): PageTemplateSummaryDTO[] {
  return ALL_PAGE_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    category: t.category,
    tags: t.tags,
    previewColor: t.previewColor,
  }));
}

function isRelationValue(v: unknown): v is { __relation: TplKey[] } {
  return (
    typeof v === "object" &&
    v !== null &&
    "__relation" in v &&
    Array.isArray((v as { __relation: unknown }).__relation)
  );
}

/** Resolve a `page_ref` block's `page_id` (a TplKey) to a real page id. */
function resolveBlockContent(
  content: TplBlockContent,
  ids: Map<TplKey, string>,
): Record<string, unknown> {
  if (content.type === "page_ref") {
    const realId = ids.get(content.page_id);
    if (!realId) {
      throw badRequest(`Template references unknown page key "${content.page_id}".`);
    }
    return { ...content, page_id: realId };
  }
  return content as unknown as Record<string, unknown>;
}

/** Recursively create a block tree (and any `table` blocks' `table_row` children). */
async function createBlockTree(
  tx: Prisma.TransactionClient,
  pageId: string,
  parentBlockId: string | null,
  nodes: TplBlockNode[],
  userId: string,
  ids: Map<TplKey, string>,
): Promise<void> {
  for (let order = 0; order < nodes.length; order++) {
    const node = nodes[order];
    const content = resolveBlockContent(node.content, ids);
    const block = await tx.block.create({
      data: {
        page_id: pageId,
        parent_block_id: parentBlockId,
        type: node.content.type as never,
        content: content as Prisma.InputJsonValue,
        order,
        created_by: userId,
      },
    });
    if (node.key) ids.set(node.key, block.id);

    if (node.children && node.children.length > 0) {
      await createBlockTree(tx, pageId, block.id, node.children, userId, ids);
    }

    if (node.content.type === "table" && node.rows) {
      for (let rowOrder = 0; rowOrder < node.rows.length; rowOrder++) {
        await tx.block.create({
          data: {
            page_id: pageId,
            parent_block_id: block.id,
            type: "table_row",
            content: { type: "table_row", cells: node.rows[rowOrder].cells } as unknown as Prisma.InputJsonValue,
            order: rowOrder,
            created_by: userId,
          },
        });
      }
    }
  }
}

/**
 * Instantiate a built-in page template under `parentId` (null = workspace
 * root) in `workspaceId`. Everything — pages, databases, properties, views,
 * rows, property values, and blocks — is created in one transaction from
 * static registry data; see registry/types.ts for the data shape and the
 * pass ordering below for why it's ordered this way (each pass resolves
 * template-local `TplKey`s left by earlier passes into real ids).
 */
export async function instantiatePageTemplate(
  templateId: string,
  workspaceId: string,
  userId: string,
  input: { parent_id: string | null },
) {
  const tpl = findPageTemplate(templateId);
  if (!tpl) throw notFound("Template not found.");

  await assertWorkspaceMember(workspaceId, userId);

  if (input.parent_id) {
    await getAccessiblePage(input.parent_id, userId, { minAccess: "EDITOR" });
    const parent = await getPrisma().page.findUnique({
      where: { id: input.parent_id },
      select: { workspace_id: true, is_deleted: true },
    });
    if (!parent || parent.workspace_id !== workspaceId || parent.is_deleted) {
      throw badRequest("Invalid parent page.");
    }
  }

  const rootPageId = await getPrisma().$transaction(
    async (tx) => {
      // Pages, databases, and rows share one flat key→id map (their TplKeys
      // are unique within a template — enforced by
      // registry/uniqueness.test.ts). Properties get their own map, scoped
      // per-database (`${dbKey}:${propKey}`): every database conventionally
      // wants a property keyed "name" for its title column, so property keys
      // are only unique WITHIN their own database, not template-wide.
      const ids = new Map<TplKey, string>();
      const propIds = new Map<string, string>();
      const propKey = (dbKey: TplKey, key: TplKey) => `${dbKey}:${key}`;

      // Pass 1: pages (root first — parents are always written before children).
      for (const p of tpl.pages) {
        const parentId = p.parentKey === null ? input.parent_id : ids.get(p.parentKey)!;
        const page = await tx.page.create({
          data: {
            workspace_id: workspaceId,
            parent_id: parentId,
            title: p.title,
            icon: p.icon ?? null,
            created_by: userId,
            last_updated_by: userId,
          },
        });
        ids.set(p.key, page.id);
      }

      // Pass 2: databases.
      for (const d of tpl.databases) {
        const db = await tx.database.create({
          data: {
            workspace_id: workspaceId,
            page_id: ids.get(d.hostPageKey)!,
            title: d.title,
            icon: d.icon ?? null,
            created_by: userId,
          },
        });
        ids.set(d.key, db.id);
      }

      // Pass 3: properties, non-rollup first (a rollup's target property may
      // live on a different database, so every database's non-rollup
      // properties must exist before any rollup is created).
      for (const d of tpl.databases) {
        for (let order = 0; order < d.properties.length; order++) {
          const prop = d.properties[order];
          if (prop.type === "rollup") continue;
          const relationDatabaseId =
            prop.type === "relation" ? ids.get(prop.relationDatabaseKey!) : undefined;
          if (prop.type === "relation" && !relationDatabaseId) {
            throw badRequest(`Relation property "${prop.name}" has an unresolved relationDatabaseKey.`);
          }
          const property = await tx.property.create({
            data: {
              database_id: ids.get(d.key)!,
              name: prop.name,
              type: prop.type as PropertyType,
              options: (prop.options ?? undefined) as Prisma.InputJsonValue,
              relation_database_id: relationDatabaseId ?? null,
              order,
            },
          });
          propIds.set(propKey(d.key, prop.key), property.id);
        }
      }

      // Pass 4: rollup properties (global second sub-pass over all databases).
      for (const d of tpl.databases) {
        for (let order = 0; order < d.properties.length; order++) {
          const prop = d.properties[order];
          if (prop.type !== "rollup") continue;
          const rollup = prop.rollup;
          if (!rollup) throw badRequest(`Rollup property "${prop.name}" is missing rollup config.`);
          // The rollup's relation property lives on THIS database; its
          // relationDatabaseKey tells us which database the target property
          // key belongs to (mirrors how getDatabase()'s rollup resolution
          // follows the relation property's relation_database_id).
          const relationPropDef = d.properties.find((p) => p.key === rollup.relationPropertyKey);
          if (!relationPropDef || relationPropDef.type !== "relation" || !relationPropDef.relationDatabaseKey) {
            throw badRequest(`Rollup property "${prop.name}"'s relationPropertyKey does not resolve to a relation property on the same database.`);
          }
          const relationPropertyId = propIds.get(propKey(d.key, rollup.relationPropertyKey));
          const targetPropertyId = propIds.get(propKey(relationPropDef.relationDatabaseKey, rollup.targetPropertyKey));
          if (!relationPropertyId || !targetPropertyId) {
            throw badRequest(`Rollup property "${prop.name}" has an unresolved relation/target key.`);
          }
          const property = await tx.property.create({
            data: {
              database_id: ids.get(d.key)!,
              name: prop.name,
              type: "rollup",
              rollup_config: {
                relation_property_id: relationPropertyId,
                target_property_id: targetPropertyId,
                aggregation: rollup.aggregation,
              } as Prisma.InputJsonValue,
              order,
            },
          });
          propIds.set(propKey(d.key, prop.key), property.id);
        }
      }

      // Pass 5: views.
      for (const d of tpl.databases) {
        for (let order = 0; order < d.views.length; order++) {
          const view = d.views[order];
          await tx.databaseView.create({
            data: {
              database_id: ids.get(d.key)!,
              name: view.name,
              type: view.type as ViewType,
              config: view.config as Prisma.InputJsonValue,
              order,
            },
          });
        }
      }

      // Pass 6: row pages. Rows are not in the page tree (addRow() creates
      // them with no parent_id — matched here).
      for (const d of tpl.databases) {
        for (let rowOrder = 0; rowOrder < d.rows.length; rowOrder++) {
          const row = d.rows[rowOrder];
          const rowPage = await tx.page.create({
            data: {
              workspace_id: workspaceId,
              database_id: ids.get(d.key)!,
              title: row.title,
              icon: row.icon ?? null,
              row_order: rowOrder + 1,
              created_by: userId,
              last_updated_by: userId,
            },
          });
          ids.set(row.key, rowPage.id);
        }
      }

      // Pass 7: property values (relation cells resolve through the pass-6 map).
      // A row's `values` keys are property keys on its OWN database.
      for (const d of tpl.databases) {
        for (const row of d.rows) {
          for (const [rowPropKey, rawValue] of Object.entries(row.values)) {
            const propertyId = propIds.get(propKey(d.key, rowPropKey));
            if (!propertyId) {
              throw badRequest(`Row "${row.title}" references unknown property key "${rowPropKey}".`);
            }
            const value = isRelationValue(rawValue)
              ? rawValue.__relation.map((k) => {
                  const target = ids.get(k);
                  if (!target) throw badRequest(`Row "${row.title}" relation references unknown row key "${k}".`);
                  return target;
                })
              : rawValue;
            await tx.propertyValue.create({
              data: {
                page_id: ids.get(row.key)!,
                property_id: propertyId,
                value: value as Prisma.InputJsonValue,
              },
            });
          }
        }
      }

      // Pass 8: blocks — every page's body, plus every row's optional body,
      // sharing the same pages∪rows key map so page_ref can target either.
      for (const p of tpl.pages) {
        await createBlockTree(tx, ids.get(p.key)!, null, p.blocks, userId, ids);
      }
      for (const d of tpl.databases) {
        for (const row of d.rows) {
          if (row.body && row.body.length > 0) {
            await createBlockTree(tx, ids.get(row.key)!, null, row.body, userId, ids);
          }
        }
      }

      // Pass 9: search text for every created page (pages + rows).
      const allPageIds = [
        ...tpl.pages.map((p) => ids.get(p.key)!),
        ...tpl.databases.flatMap((d) => d.rows.map((r) => ids.get(r.key)!)),
      ];
      for (const pageId of allPageIds) {
        await refreshPageContentTextTx(tx, pageId);
      }

      return ids.get(tpl.pages[0].key)!;
    },
    { timeout: 30_000 },
  );

  const rootPage = await getPrisma().page.findUniqueOrThrow({ where: { id: rootPageId } });
  return toPageDTO(rootPage);
}
