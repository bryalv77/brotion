import { QueryClient } from "@tanstack/react-query";
import { isUnauthorized } from "@/lib/api/client";

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
  pageDatabases: (pageId: string) => ["page-databases", pageId] as const,
  attachments: (pageId: string) => ["attachments", pageId] as const,
  templates: (workspaceId: string) => ["templates", workspaceId] as const,
};
