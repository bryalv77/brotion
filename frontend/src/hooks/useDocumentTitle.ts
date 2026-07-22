import { useEffect } from "react";

/** Sets document.title from the current page title. Falls back to app name. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} — Notion Clone` : "Notion Clone";
  }, [title]);
}
