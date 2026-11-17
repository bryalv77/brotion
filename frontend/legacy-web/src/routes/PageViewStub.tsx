import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPage } from "../api/pages.js";

/**
 * Stub page view — shows the page title + a "coming soon" note where the editor
 * will live. Task 6 (block editor) and Task 7 (header/cover/icon) fill this in.
 */
export function PageViewStub() {
  const { pageId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["page", pageId],
    queryFn: () => getPage(pageId!),
    enabled: !!pageId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Page not found
      </div>
    );
  }

  const { page, blocks } = data;

  return (
    <div className="mx-auto max-w-3xl px-16 py-12">
      <h1 className="mb-8 text-4xl font-bold text-neutral-900">
        {page.icon && <span className="mr-2">{page.icon}</span>}
        {page.title || "Untitled"}
      </h1>
      {blocks.length > 0 ? (
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="text-neutral-700">
              {b.content &&
                typeof b.content === "object" &&
                "rich_text" in b.content &&
                Array.isArray(
                  (b.content as { rich_text: unknown[] }).rich_text,
                ) &&
                (b.content as { rich_text: { text?: string }[] }).rich_text
                  .map((r) => r.text || "")
                  .join("")}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400">Write something…</p>
      )}
    </div>
  );
}
