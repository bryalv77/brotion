/*
  Warnings:

  - You are about to drop the column `search_vector` on the `pages` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "comments_user_id_idx";

-- DropIndex
DROP INDEX "page_permissions_user_id_idx";

-- DropIndex
DROP INDEX "pages_search_vector_idx";

-- DropIndex
DROP INDEX "workspace_members_user_id_idx";

-- DropIndex
DROP INDEX "workspace_members_workspace_id_idx";

-- AlterTable
ALTER TABLE "pages" DROP COLUMN "search_vector";
