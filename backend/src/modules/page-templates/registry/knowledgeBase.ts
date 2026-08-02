import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const knowledgeBaseTemplate: PageTemplateDefinition = {
  id: "knowledge-base",
  name: "Knowledge Base",
  description: "A searchable internal wiki for team documentation, onboarding guides, and how-tos, organized by category and status.",
  icon: "📚",
  category: "Work",
  tags: ["wiki", "documentation", "team", "onboarding"],
  previewColor: "#14b8a6",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Knowledge Base",
      icon: "📚",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Knowledge Base") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt(
              "A central, searchable home for your team's documentation — onboarding guides, policies, runbooks, and reference material all in one place.",
            ),
          },
        },
        {
          content: {
            type: "callout",
            icon: "💡",
            color: "blue",
            rich_text: rt(
              "Use the Category and Status filters on the Articles database below to quickly find what's published, what's still in review, and which team owns a topic.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Getting Started") } },
        { content: { type: "bulleted_list_item", rich_text: rt("Search by title, or filter the Articles database by Category or Tags to narrow things down.") } },
        { content: { type: "bulleted_list_item", rich_text: rt("Switch to the Gallery view for a visual overview, or Board view to see articles grouped by Category.") } },
        { content: { type: "bulleted_list_item", rich_text: rt("Set Status to \"In Review\" while drafting, and move it to \"Published\" once an article is ready for the whole team.") } },
        { content: { type: "bulleted_list_item", rich_text: rt("Tag articles with things like \"how-to\" or \"policy\" so they're easy to find later.") } },
        { content: { type: "heading2", rich_text: rt("Articles") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Every article lives as a row below — open one to read its full content, or add a new row to start writing."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "articles",
      hostPageKey: "root",
      title: "Articles",
      icon: "📄",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "category",
          name: "Category",
          type: "select",
          options: {
            options: [
              { value: "Engineering", color: "blue" },
              { value: "Onboarding", color: "green" },
              { value: "HR", color: "pink" },
              { value: "Product", color: "purple" },
              { value: "Support", color: "orange" },
            ],
          },
        },
        {
          key: "status",
          name: "Status",
          type: "status",
          options: {
            options: [
              { value: "Draft", color: "gray" },
              { value: "In Review", color: "yellow" },
              { value: "Published", color: "green" },
            ],
          },
        },
        {
          key: "tags",
          name: "Tags",
          type: "multi_select",
          options: {
            options: [
              { value: "how-to", color: "blue" },
              { value: "policy", color: "pink" },
              { value: "reference", color: "gray" },
              { value: "faq", color: "purple" },
              { value: "troubleshooting", color: "orange" },
              { value: "onboarding", color: "green" },
            ],
          },
        },
        { key: "last_updated", name: "Last Updated", type: "date" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: { group_by: "Category" } },
        { name: "By Category", type: "board", config: { group_by: "Category" } },
      ],
      rows: [
        {
          key: "article-1",
          title: "Setting up your dev environment",
          values: {
            category: "Engineering",
            status: "Published",
            tags: ["how-to", "onboarding"],
            last_updated: "2026-07-28",
          },
          body: [
            { content: { type: "heading2", rich_text: rt("Setting up your dev environment") } },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "This guide walks through everything you need to get a local development environment running, from installing dependencies to your first successful build.",
                ),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "Start by cloning the main repository and running the setup script. It will install the correct Node version, configure your local database, and seed it with sample data.",
                ),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "If you hit permission errors during setup, check that you've been added to the engineering GitHub team — most issues trace back to missing repo access.",
                ),
              },
            },
          ],
        },
        {
          key: "article-2",
          title: "How to request PTO",
          values: {
            category: "HR",
            status: "Published",
            tags: ["how-to", "policy"],
            last_updated: "2026-07-15",
          },
          body: [
            { content: { type: "heading2", rich_text: rt("How to request PTO") } },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "All time-off requests go through the HR portal, not your manager directly. Submit requests at least two weeks in advance whenever possible.",
                ),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "Your manager will receive an approval notification and typically responds within two business days. You'll see the request reflected on the team calendar once approved.",
                ),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "For unplanned or emergency time off, message your manager directly first and file the formal request as soon as you're able.",
                ),
              },
            },
          ],
        },
        {
          key: "article-3",
          title: "Incident response runbook",
          values: {
            category: "Engineering",
            status: "Published",
            tags: ["reference", "troubleshooting"],
            last_updated: "2026-08-01",
          },
          body: [
            { content: { type: "heading2", rich_text: rt("Incident response runbook") } },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "When an incident is detected, the first responder declares severity in the #incidents channel and starts a timeline doc. Severity 1 incidents page the on-call lead immediately.",
                ),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "Mitigate first, root-cause later. Roll back recent deploys, fail over to a healthy region, or disable the offending feature flag before digging into why it broke.",
                ),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt(
                  "Once resolved, schedule a blameless postmortem within 48 hours and file the write-up in this knowledge base under the Troubleshooting tag.",
                ),
              },
            },
          ],
        },
        {
          key: "article-4",
          title: "Brand voice guidelines",
          values: {
            category: "Product",
            status: "In Review",
            tags: ["reference", "policy"],
            last_updated: "2026-07-22",
          },
        },
        {
          key: "article-5",
          title: "Customer escalation process",
          values: {
            category: "Support",
            status: "Published",
            tags: ["how-to", "troubleshooting"],
            last_updated: "2026-07-30",
          },
        },
        {
          key: "article-6",
          title: "New hire first week checklist",
          values: {
            category: "Onboarding",
            status: "Published",
            tags: ["onboarding", "how-to"],
            last_updated: "2026-06-30",
          },
        },
        {
          key: "article-7",
          title: "Remote work policy",
          values: {
            category: "HR",
            status: "Published",
            tags: ["policy", "faq"],
            last_updated: "2026-05-18",
          },
        },
        {
          key: "article-8",
          title: "API rate limiting FAQ",
          values: {
            category: "Engineering",
            status: "Draft",
            tags: ["faq", "reference"],
            last_updated: "2026-08-02",
          },
        },
        {
          key: "article-9",
          title: "Product roadmap review process",
          values: {
            category: "Product",
            status: "In Review",
            tags: ["reference"],
            last_updated: "2026-07-10",
          },
        },
        {
          key: "article-10",
          title: "Troubleshooting failed payments",
          values: {
            category: "Support",
            status: "Published",
            tags: ["troubleshooting", "faq"],
            last_updated: "2026-07-26",
          },
        },
      ],
    },
  ],
};
