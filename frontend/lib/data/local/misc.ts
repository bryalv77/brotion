import type { AttachmentInfo } from "@/lib/api/attachments";
import type { PageTemplateSummaryDTO } from "@notion-clone/shared";
import { badRequest } from "./util";

/**
 * Guest stubs for account/server-only surfaces:
 * - Attachments: file uploads need the API; local pages have none.
 * - The page-template gallery's instantiate factory is server-side today.
 *   The list is static metadata, so returning it keeps any UI that renders
 *   the gallery working in guest mode; instantiation is rejected.
 */

const PAGE_TEMPLATES: PageTemplateSummaryDTO[] = [
  {
    id: "meeting-notes",
    name: "Meeting notes",
    description: "Agenda, discussion, and action items.",
    icon: "🗓️",
    category: "Work",
    tags: ["meetings", "notes"],
    previewColor: "#2383e2",
  },
  {
    id: "weekly-plan",
    name: "Weekly planner",
    description: "Plan the week, day by day.",
    icon: "📅",
    category: "Personal",
    tags: ["planning"],
    previewColor: "#0f7b6c",
  },
];

export async function listAttachments(_pageId: string): Promise<AttachmentInfo[]> {
  void _pageId;
  return [];
}

export async function listPageTemplates(): Promise<PageTemplateSummaryDTO[]> {
  return PAGE_TEMPLATES;
}

export async function instantiatePageTemplate(): Promise<never> {
  throw badRequest(
    "Page templates require an account (they build server-side content).",
    "TEMPLATE_SERVER_ONLY",
  );
}
