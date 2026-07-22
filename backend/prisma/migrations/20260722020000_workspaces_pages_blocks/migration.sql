-- Task 3: workspaces, membership, pages (tree), blocks, attachments,
-- plus the full-text-search generated column + GIN index.

-- Create enums
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "BlockType" AS ENUM (
  'paragraph', 'heading1', 'heading2', 'heading3',
  'bulleted_list_item', 'numbered_list_item', 'todo',
  'quote', 'callout', 'divider', 'code',
  'image', 'table', 'table_row'
);

-- Workspace
CREATE TABLE "workspaces" (
    "id"         TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "icon"       TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- WorkspaceMember (join + role)
CREATE TABLE "workspace_members" (
    "id"           TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id"      TEXT NOT NULL,
    "role"         "WorkspaceRole" NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "workspace_members_workspace_id_user_id_key"
  ON "workspace_members"("workspace_id", "user_id");
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members"("workspace_id");
CREATE INDEX "workspace_members_user_id_idx"      ON "workspace_members"("user_id");

-- Page (hierarchical tree via self-reference)
CREATE TABLE "pages" (
    "id"              TEXT NOT NULL,
    "workspace_id"    TEXT NOT NULL,
    "parent_id"       TEXT,
    "title"           TEXT NOT NULL DEFAULT '',
    "icon"            TEXT,
    "cover_url"       TEXT,
    "content_text"    TEXT NOT NULL DEFAULT '',
    "is_deleted"      BOOLEAN NOT NULL DEFAULT false,
    "deleted_at"      TIMESTAMP(3),
    "deleted_by"      TEXT,
    "created_by"      TEXT NOT NULL,
    "last_updated_by" TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pages_workspace_id_idx" ON "pages"("workspace_id");
CREATE INDEX "pages_parent_id_idx"    ON "pages"("parent_id");
CREATE INDEX "pages_is_deleted_idx"   ON "pages"("is_deleted");

-- Block (typed, nestable, fractional-index order)
CREATE TABLE "blocks" (
    "id"              TEXT NOT NULL,
    "page_id"         TEXT NOT NULL,
    "parent_block_id" TEXT,
    "type"            "BlockType" NOT NULL,
    "content"         JSONB NOT NULL,
    "order"           DOUBLE PRECISION NOT NULL,
    "created_by"      TEXT NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "blocks_page_id_idx"          ON "blocks"("page_id");
CREATE INDEX "blocks_parent_block_id_idx"  ON "blocks"("parent_block_id");
CREATE INDEX "blocks_page_id_order_idx"    ON "blocks"("page_id", "order");

-- Attachment (uploaded files)
CREATE TABLE "attachments" (
    "id"          TEXT NOT NULL,
    "user_id"     TEXT NOT NULL,
    "page_id"     TEXT,
    "block_id"    TEXT,
    "file_name"   TEXT NOT NULL,
    "mime_type"   TEXT NOT NULL,
    "size_bytes"  INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "attachments_page_id_idx" ON "attachments"("page_id");

-- Foreign keys
ALTER TABLE "workspaces"
  ADD CONSTRAINT "workspaces_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workspace_members"
  ADD CONSTRAINT "workspace_members_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_members"
  ADD CONSTRAINT "workspace_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pages"
  ADD CONSTRAINT "pages_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "pages"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_last_updated_by_fkey"
  FOREIGN KEY ("last_updated_by") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "blocks"
  ADD CONSTRAINT "blocks_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "pages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocks"
  ADD CONSTRAINT "blocks_parent_block_id_fkey"
  FOREIGN KEY ("parent_block_id") REFERENCES "blocks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attachments"
  ADD CONSTRAINT "attachments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Full-text search: generated tsvector over title + content_text + GIN index.
-- Prisma can't declare generated columns, so this is a raw SQL step.
ALTER TABLE "pages"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("content_text", ''))
  ) STORED;
CREATE INDEX "pages_search_vector_idx" ON "pages" USING GIN ("search_vector");
