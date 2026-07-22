-- Task 4: page-level permissions (per-user + public link) and per-block comments.

CREATE TYPE "ShareType" AS ENUM ('USER', 'PUBLIC_LINK');
CREATE TYPE "PageAccess" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

CREATE TABLE "page_permissions" (
    "id"         TEXT NOT NULL,
    "page_id"    TEXT NOT NULL,
    "user_id"    TEXT,
    "share_type" "ShareType" NOT NULL,
    "access"     "PageAccess" NOT NULL,
    "inherit"    BOOLEAN NOT NULL DEFAULT true,
    "token"      TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "page_permissions_token_key" ON "page_permissions"("token");
CREATE INDEX "page_permissions_page_id_idx" ON "page_permissions"("page_id");
CREATE INDEX "page_permissions_user_id_idx" ON "page_permissions"("user_id");

CREATE TABLE "comments" (
    "id"         TEXT NOT NULL,
    "block_id"   TEXT NOT NULL,
    "page_id"    TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "body"       JSONB NOT NULL,
    "resolved"   BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "comments_block_id_idx" ON "comments"("block_id");
CREATE INDEX "comments_page_id_idx"  ON "comments"("page_id");
CREATE INDEX "comments_user_id_idx"  ON "comments"("user_id");

ALTER TABLE "page_permissions"
  ADD CONSTRAINT "page_permissions_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "pages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "page_permissions"
  ADD CONSTRAINT "page_permissions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "pages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
