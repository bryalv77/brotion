import { useQuery } from "@tanstack/react-query";
import { listAttachments, type AttachmentInfo } from "../api/attachments.js";

/** Shows the list of file attachments on a page, with download links. */
export function PageAttachments({ pageId }: { pageId: string }) {
  const { data: attachments } = useQuery({
    queryKey: ["attachments", pageId],
    queryFn: () => listAttachments(pageId),
  });

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mime_type.startsWith("image/"));
  const files = attachments.filter((a) => !a.mime_type.startsWith("image/"));

  return (
    <div className="mt-8 space-y-6">
      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Images
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <div className="aspect-square bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={att.url}
                    alt={att.file_name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="truncate px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {att.file_name}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Attachments
          </h3>
          <div className="space-y-2">
            {files.map((att) => (
              <FileRow key={att.id} att={att} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileRow({ att }: { att: AttachmentInfo }) {
  return (
    <a
      href={att.url}
      download={att.file_name}
      className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
    >
      <span className="text-xl">{fileIcon(att.mime_type)}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-neutral-700 dark:text-neutral-300">
          {att.file_name}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          {formatSize(att.size_bytes)}
        </p>
      </div>
      <span className="text-neutral-400 dark:text-neutral-500">↓</span>
    </a>
  );
}

function fileIcon(mime: string): string {
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("word") || mime.includes("document")) return "📄";
  if (mime.includes("markdown")) return "📝";
  return "📎";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
