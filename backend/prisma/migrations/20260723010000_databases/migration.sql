-- Task 012: Databases — Database, Property, PropertyValue models.

CREATE TYPE "PropertyType" AS ENUM ('text', 'number', 'select', 'date', 'checkbox', 'url');

CREATE TABLE "databases" (
    "id"          TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "page_id"     TEXT NOT NULL,
    "title"       TEXT NOT NULL DEFAULT '',
    "icon"        TEXT,
    "created_by"  TEXT NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "databases_page_id_idx" ON "databases"("page_id");

CREATE TABLE "properties" (
    "id"          TEXT NOT NULL,
    "database_id" TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "type"        "PropertyType" NOT NULL,
    "options"     JSONB,
    "order"       INTEGER NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "properties_database_id_idx" ON "properties"("database_id");

CREATE TABLE "property_values" (
    "id"          TEXT NOT NULL,
    "page_id"     TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "value"       JSONB NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "property_values_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "property_values_page_id_property_id_key"
  ON "property_values"("page_id", "property_id");
CREATE INDEX "property_values_page_id_idx" ON "property_values"("page_id");

ALTER TABLE "databases"
  ADD CONSTRAINT "databases_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "databases"
  ADD CONSTRAINT "databases_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "pages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_database_id_fkey"
  FOREIGN KEY ("database_id") REFERENCES "databases"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_values"
  ADD CONSTRAINT "property_values_page_id_fkey"
  FOREIGN KEY ("page_id") REFERENCES "pages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_values"
  ADD CONSTRAINT "property_values_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "properties"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add database_id to pages (nullable — a page can belong to a database as a row).
ALTER TABLE "pages" ADD COLUMN "database_id" TEXT;
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_database_id_fkey"
  FOREIGN KEY ("database_id") REFERENCES "databases"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "pages_database_id_idx" ON "pages"("database_id");
