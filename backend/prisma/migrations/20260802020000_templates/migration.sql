-- Templates for databases: a Template is a factory that produces new rows by
-- deep-copy. Its block body lives on a hidden Page (is_template=true); a new
-- `templates` table links the template to its database + hidden page + default
-- property values.

-- AlterTable: flag the hidden Pages that back templates so the tree/search/
-- breadcrumbs read paths can exclude them with `is_template = false`.
ALTER TABLE "pages" ADD COLUMN "is_template" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "database_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "page_id" TEXT NOT NULL,
    "default_values" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_database_id_idx" ON "templates"("database_id");

-- CreateIndex: the hidden page backs exactly one template (1:1).
CREATE UNIQUE INDEX "templates_page_id_key" ON "templates"("page_id");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
