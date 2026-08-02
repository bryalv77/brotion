-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('table', 'list', 'board', 'gallery');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PropertyType" ADD VALUE 'multi_select';
ALTER TYPE "PropertyType" ADD VALUE 'status';
ALTER TYPE "PropertyType" ADD VALUE 'relation';
ALTER TYPE "PropertyType" ADD VALUE 'rollup';
ALTER TYPE "PropertyType" ADD VALUE 'created_time';
ALTER TYPE "PropertyType" ADD VALUE 'created_by';
ALTER TYPE "PropertyType" ADD VALUE 'last_edited_time';
ALTER TYPE "PropertyType" ADD VALUE 'last_edited_by';

-- DropIndex
DROP INDEX "pages_database_id_idx";

-- AlterTable
ALTER TABLE "pages" ADD COLUMN "row_order" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "relation_database_id" TEXT,
ADD COLUMN "rollup_config" JSONB;

-- CreateTable
CREATE TABLE "database_views" (
    "id" TEXT NOT NULL,
    "database_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Table',
    "type" "ViewType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "database_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "database_views_database_id_idx" ON "database_views"("database_id");

-- CreateIndex
CREATE INDEX "properties_relation_database_id_idx" ON "properties"("relation_database_id");

-- AddForeignKey
ALTER TABLE "database_views" ADD CONSTRAINT "database_views_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_relation_database_id_fkey" FOREIGN KEY ("relation_database_id") REFERENCES "databases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing database gets a default Table view so the model
-- is never view-less. gen_random_uuid() gives unique ids (cuids are app-side).
INSERT INTO "database_views" (id, database_id, name, type, config, "order")
SELECT REPLACE(gen_random_uuid()::text, '-', ''), id, 'Table', 'table', '{}'::jsonb, 0
FROM "databases";
