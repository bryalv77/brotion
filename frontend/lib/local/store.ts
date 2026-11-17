import type {
  BlockDTO,
  DatabaseViewDTO,
  PageDTO,
  PropertyDTO,
  TemplateDTO,
  WorkspaceDTO,
} from "@notion-clone/shared";
import type { KV } from "./kvTypes";
import { getLocalKV } from "./kv";

/**
 * Typed persistence layer for guest (local) mode. Entities are the exact API
 * DTO shapes the UI already consumes, plus a few server-only columns that
 * matter locally (trash timestamps, row order, hidden template pages). All
 * reads/writes go through the tiny KV adapters; filtering happens in JS,
 * which is plenty at personal-notebook scale.
 */

/** A page as stored locally — PageDTO plus server-columns we mirror. */
export interface LocalPage extends PageDTO {
  /** Set when the page was trashed; drives trash ordering. */
  deleted_at?: string | null;
  /** Database row ordering (rows ARE pages). */
  row_order?: number;
  /** Hidden template body page — excluded from trees, search, breadcrumbs. */
  is_template?: boolean;
}

/** A database definition. Rows live as pages (database_id) + property values. */
export interface LocalDatabaseDef {
  id: string;
  page_id: string;
  workspace_id: string;
  title: string;
  icon: string | null;
  properties: PropertyDTO[];
  views: DatabaseViewDTO[];
  templates: TemplateDTO[];
  created_at: string;
}

/** A stored cell value, keyed by (page_id, property_id). */
export interface LocalPropertyValue {
  id: string;
  page_id: string;
  property_id: string;
  value: unknown;
}

/** Everything needed to adopt local data into a server account (see lib/merge.ts). */
export interface LocalSnapshot {
  workspaces: WorkspaceDTO[];
  pages: LocalPage[];
  blocks: BlockDTO[];
  databases: LocalDatabaseDef[];
  values: LocalPropertyValue[];
}

// Entity kinds in the KV store.
const K_WORKSPACE = "workspace";
const K_PAGE = "page";
const K_BLOCK = "block";
const K_DATABASE = "database";
const K_VALUE = "value";

let singleton: LocalStore | null = null;

/** The process-wide local store (lazily picks the platform adapter). */
export function getLocalStore(): LocalStore {
  if (!singleton) {
    singleton = new LocalStore(getLocalKV());
  }
  return singleton;
}

export class LocalStore {
  constructor(private kv: KV) {}

  // ── Workspaces ────────────────────────────────────────────────────────────

  async listWorkspaces(): Promise<WorkspaceDTO[]> {
    const all = await this.list<WorkspaceDTO>(K_WORKSPACE);
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getWorkspace(id: string): Promise<WorkspaceDTO | null> {
    return this.get<WorkspaceDTO>(K_WORKSPACE, id);
  }

  async putWorkspace(ws: WorkspaceDTO): Promise<void> {
    await this.kv.put(K_WORKSPACE, ws.id, JSON.stringify(ws));
  }

  /** Delete a workspace and every page/block/database/value inside it. */
  async deleteWorkspaceCascade(id: string): Promise<void> {
    const pages = (await this.list<LocalPage>(K_PAGE)).filter(
      (p) => p.workspace_id === id,
    );
    for (const p of pages) {
      await this.deletePageHard(p.id);
    }
    for (const db of await this.list<LocalDatabaseDef>(K_DATABASE)) {
      if (db.workspace_id === id) await this.kv.delete(K_DATABASE, db.id);
    }
    await this.kv.delete(K_WORKSPACE, id);
  }

  // ── Pages ─────────────────────────────────────────────────────────────────

  async getPage(id: string): Promise<LocalPage | null> {
    return this.get<LocalPage>(K_PAGE, id);
  }

  /** All pages matching a predicate (full-scan filter). */
  async findPages(
    pred: (p: LocalPage) => boolean,
  ): Promise<LocalPage[]> {
    return (await this.list<LocalPage>(K_PAGE)).filter(pred);
  }

  async putPage(page: LocalPage): Promise<void> {
    await this.kv.put(K_PAGE, page.id, JSON.stringify(page));
  }

  async putPages(pages: LocalPage[]): Promise<void> {
    for (const p of pages) await this.putPage(p);
  }

  /** Hard-delete one page row, its blocks, its values, and databases on it. */
  async deletePageHard(id: string): Promise<void> {
    for (const b of await this.list<BlockDTO>(K_BLOCK)) {
      if (b.page_id === id) await this.kv.delete(K_BLOCK, b.id);
    }
    for (const v of await this.list<LocalPropertyValue>(K_VALUE)) {
      if (v.page_id === id) await this.kv.delete(K_VALUE, v.id);
    }
    for (const db of await this.list<LocalDatabaseDef>(K_DATABASE)) {
      if (db.page_id === id) await this.kv.delete(K_DATABASE, db.id);
    }
    await this.kv.delete(K_PAGE, id);
  }

  // ── Blocks ────────────────────────────────────────────────────────────────

  async getBlock(id: string): Promise<BlockDTO | null> {
    return this.get<BlockDTO>(K_BLOCK, id);
  }

  async listBlocks(pageId: string): Promise<BlockDTO[]> {
    const blocks = (
      await this.list<BlockDTO>(K_BLOCK)
    ).filter((b) => b.page_id === pageId);
    return blocks.sort(
      (a, b) => a.order - b.order || a.created_at.localeCompare(b.created_at),
    );
  }

  async putBlock(block: BlockDTO): Promise<void> {
    await this.kv.put(K_BLOCK, block.id, JSON.stringify(block));
  }

  async putBlocks(blocks: BlockDTO[]): Promise<void> {
    for (const b of blocks) await this.putBlock(b);
  }

  /** Delete a block and its whole subtree (children come along, like the FK cascade). */
  async deleteBlockCascade(id: string): Promise<void> {
    const all = await this.list<BlockDTO>(K_BLOCK);
    const byParent = new Map<string, BlockDTO[]>();
    for (const b of all) {
      const key = b.parent_block_id ?? "";
      const arr = byParent.get(key) ?? [];
      arr.push(b);
      byParent.set(key, arr);
    }
    const queue = [id];
    while (queue.length) {
      const cur = queue.pop()!;
      await this.kv.delete(K_BLOCK, cur);
      for (const child of byParent.get(cur) ?? []) queue.push(child.id);
    }
  }

  // ── Databases ─────────────────────────────────────────────────────────────

  async getDatabaseDef(id: string): Promise<LocalDatabaseDef | null> {
    return this.get<LocalDatabaseDef>(K_DATABASE, id);
  }

  async listDatabaseDefs(pageId?: string): Promise<LocalDatabaseDef[]> {
    const all = await this.list<LocalDatabaseDef>(K_DATABASE);
    const filtered = pageId ? all.filter((d) => d.page_id === pageId) : all;
    return filtered.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async putDatabaseDef(db: LocalDatabaseDef): Promise<void> {
    await this.kv.put(K_DATABASE, db.id, JSON.stringify(db));
  }

  async deleteDatabaseDef(id: string): Promise<void> {
    await this.kv.delete(K_DATABASE, id);
  }

  // ── Property values ───────────────────────────────────────────────────────

  async listValues(pageId: string): Promise<LocalPropertyValue[]> {
    return (
      await this.list<LocalPropertyValue>(K_VALUE)
    ).filter((v) => v.page_id === pageId);
  }

  async listAllValues(): Promise<LocalPropertyValue[]> {
    return this.list<LocalPropertyValue>(K_VALUE);
  }

  async getValue(
    pageId: string,
    propertyId: string,
  ): Promise<LocalPropertyValue | null> {
    const rows = await this.list<LocalPropertyValue>(K_VALUE);
    return rows.find((v) => v.page_id === pageId && v.property_id === propertyId) ?? null;
  }

  async putValue(v: LocalPropertyValue): Promise<void> {
    await this.kv.put(K_VALUE, v.id, JSON.stringify(v));
  }

  async deleteValuesByProperty(propertyId: string): Promise<void> {
    for (const v of await this.list<LocalPropertyValue>(K_VALUE)) {
      if (v.property_id === propertyId) await this.kv.delete(K_VALUE, v.id);
    }
  }

  // ── Meta / bulk ───────────────────────────────────────────────────────────

  async getMeta<T>(key: string): Promise<T | null> {
    const raw = await this.kv.getMeta(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    await this.kv.setMeta(key, JSON.stringify(value));
  }

  async clear(): Promise<void> {
    await this.kv.clear();
  }

  /** Remove all entities but keep meta flags (e.g. `seeded`) — after guest
   * data was adopted, a returning guest gets a clean notebook, not the
   * first-run welcome content again. */
  async clearData(): Promise<void> {
    await this.kv.clearData();
  }

  /** True when the store holds any user content (drives merge-on-login). */
  async hasContent(): Promise<boolean> {
    return (await this.list<LocalPage>(K_PAGE)).length > 0;
  }

  /** Full snapshot for the adopt-on-login flow. */
  async dump(): Promise<LocalSnapshot> {
    const [workspaces, pages, blocks, databases, values] = await Promise.all([
      this.list<WorkspaceDTO>(K_WORKSPACE),
      this.list<LocalPage>(K_PAGE),
      this.list<BlockDTO>(K_BLOCK),
      this.list<LocalDatabaseDef>(K_DATABASE),
      this.list<LocalPropertyValue>(K_VALUE),
    ]);
    return { workspaces, pages, blocks, databases, values };
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private async get<T>(kind: string, id: string): Promise<T | null> {
    const raw = await this.kv.get(kind, id);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  private async list<T>(kind: string): Promise<T[]> {
    const rows = await this.kv.list(kind);
    return rows.map((r) => JSON.parse(r.json) as T);
  }
}
