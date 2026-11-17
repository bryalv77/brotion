import { QueryClient } from "@tanstack/react-query";
import { isUnauthorized } from "@/lib/api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (failureCount, error) => {
        if (isUnauthorized(error)) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: 0 },
  },
});

export const qk = {
  workspaces: ["workspaces"] as const,
  workspace: (id: string) => ["workspace", id] as const,
  pages: (workspaceId: string, parentId: string | null) =>
    ["pages", workspaceId, parentId] as const,
  page: (id: string) => ["page", id] as const,
  breadcrumbs: (id: string) => ["breadcrumbs", id] as const,
  blocks: (pageId: string) => ["blocks", pageId] as const,
  trash: (workspaceId: string) => ["trash", workspaceId] as const,
  search: (workspaceId: string, q: string) => ["search", workspaceId, q] as const,
  database: (id: string, viewId?: string) => ["database", id, viewId] as const,
  /** Prefix: matches every view of a database. */
  databaseAnyView: (id: string) => ["database", id] as const,
  databaseTemplates: (id: string) => ["database-templates", id] as const,
  pageDatabases: (pageId: string) => ["page-databases", pageId] as const,
  /** Prefix: matches every page's databases. */
  allPageDatabases: ["page-databases"] as const,
  /** Prefix: matches every cached child-page list. */
  childPages: ["pages", "children"] as const,
  attachments: (pageId: string) => ["attachments", pageId] as const,
  templates: (workspaceId: string) => ["templates", workspaceId] as const,
};
