import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPage } from "../api/pages.js";
import { PageHeader } from "../components/PageHeader.js";
import { Editor } from "../features/editor/Editor.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

/**
 * Full page view: header (cover/icon/title) + block editor.
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
      <PageHeader page={page} />
      <Editor pageId={page.id} blocks={blocks} />
    </div>
  );
}
