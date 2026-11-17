import { usePageDatabases } from "../hooks/usePageDatabases.js";
import { DatabaseView } from "./DatabaseView.js";

interface PageDatabasesProps {
  pageId: string;
}

/**
 * Lists every sheet (database) hosted on the page and renders them stacked
 * below the block editor. Sheets are created via the slash command
 * (`/sheet` or `/database`) in the editor — there is intentionally no
 * button here so the workflow matches Notion's.
 */
export function PageDatabases({ pageId }: PageDatabasesProps) {
  const { data: databases, isLoading } = usePageDatabases(pageId);

  if (isLoading) return null;
  if (!databases || databases.length === 0) return null;

  return (
    <div className="mt-12 space-y-8">
      {databases.map((db) => (
        <DatabaseView key={db.id} databaseId={db.id} />
      ))}
    </div>
  );
}
