import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPage } from "../api/pages.js";
import { Breadcrumbs } from "../components/Breadcrumbs.js";
import { PageHeader } from "../components/PageHeader.js";
import { RowProperties } from "../components/RowProperties.js";
import { Editor } from "../features/editor/Editor.js";
import { PageAttachments } from "../components/PageAttachments.js";
import { PageDatabases } from "../components/PageDatabases.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

/**
 * Full page view: header (cover/icon/title) + block editor + sheets + attachments.
 */
export function PageView() {
  const { pageId } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["page", pageId],
    queryFn: () => getPage(pageId!),
    enabled: !!pageId,
  });

  useDocumentTitle(data?.page.title || "Untitled");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Page not found
      </div>
    );
  }

  const { page, blocks } = data;

  return (
    <div className="mx-auto max-w-3xl px-16 py-12">
      <Breadcrumbs page={page} />
      <PageHeader page={page} />
      {page.database_id && (
        <RowProperties databaseId={page.database_id} rowPageId={page.id} />
      )}
      <Editor pageId={page.id} blocks={blocks} />
      <PageDatabases pageId={page.id} />
      <PageAttachments pageId={page.id} />
    </div>
  );
}
