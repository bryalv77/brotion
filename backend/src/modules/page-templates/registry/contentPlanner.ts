import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const contentPlannerTemplate: PageTemplateDefinition = {
  id: "content-planner",
  name: "Content Planner",
  description: "Plan and track content pieces — blog posts, videos, and social — against the campaigns they support.",
  icon: "🗓️",
  category: "Work",
  tags: ["content", "marketing", "planning", "editorial"],
  previewColor: "#f97316",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Content Planner",
      icon: "🗓️",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Content Planner") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt(
              "Plan content pieces — blog posts, videos, newsletters, and social — and track how they roll up into the campaigns they support.",
            ),
          },
        },
        {
          content: {
            type: "callout",
            icon: "💡",
            color: "orange",
            rich_text: rt(
              "Switch the Content Ideas database to its Board view for a Kanban-style pipeline: drag ideas from Idea to Drafting to In Review to Published.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Campaigns") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("The initiatives your content supports. Each campaign shows how many content pieces are linked to it."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Content Ideas") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Every individual piece of content, its status, format, due date, and the campaign it belongs to."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "campaigns",
      hostPageKey: "root",
      title: "Campaigns",
      icon: "📣",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "channel",
          name: "Channel",
          type: "select",
          options: {
            options: [
              { value: "Blog", color: "green" },
              { value: "Social", color: "pink" },
              { value: "Email", color: "blue" },
              { value: "Video", color: "red" },
              { value: "Podcast", color: "purple" },
            ],
          },
        },
        { key: "start_date", name: "Start Date", type: "date" },
        { key: "content", name: "Content", type: "relation", relationDatabaseKey: "content-ideas" },
        {
          key: "piece_count",
          name: "Piece Count",
          type: "rollup",
          rollup: { relationPropertyKey: "content", targetPropertyKey: "name", aggregation: "count" },
        },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "camp-launch",
          title: "Q3 Product Launch",
          values: {
            channel: "Video",
            start_date: "2026-07-01",
            content: { __relation: ["idea-1", "idea-2", "idea-3"] },
          },
        },
        {
          key: "camp-newsletter",
          title: "Summer Newsletter Series",
          values: {
            channel: "Email",
            start_date: "2026-06-01",
            content: { __relation: ["idea-4", "idea-5"] },
          },
        },
        {
          key: "camp-seo",
          title: "Evergreen SEO Push",
          values: {
            channel: "Blog",
            start_date: "2026-05-15",
            content: { __relation: ["idea-6", "idea-7"] },
          },
        },
        {
          key: "camp-social",
          title: "Back to School Social Push",
          values: {
            channel: "Social",
            start_date: "2026-08-01",
            content: { __relation: ["idea-8", "idea-9"] },
          },
        },
        {
          key: "camp-webinar",
          title: "Customer Success Webinar",
          values: {
            channel: "Video",
            start_date: "2026-08-20",
            content: { __relation: ["idea-10"] },
          },
        },
        {
          key: "camp-podcast",
          title: "Founder Interview Series",
          values: {
            channel: "Podcast",
            start_date: "2026-09-01",
            content: { __relation: [] },
          },
        },
      ],
    },
    {
      key: "content-ideas",
      hostPageKey: "root",
      title: "Content Ideas",
      icon: "💡",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "status",
          name: "Status",
          type: "status",
          options: {
            options: [
              { value: "Idea", color: "gray" },
              { value: "Drafting", color: "yellow" },
              { value: "In Review", color: "blue" },
              { value: "Published", color: "green" },
            ],
          },
        },
        {
          key: "format",
          name: "Format",
          type: "select",
          options: {
            options: [
              { value: "Blog Post", color: "green" },
              { value: "Short Video", color: "red" },
              { value: "Carousel", color: "pink" },
              { value: "Newsletter", color: "blue" },
              { value: "Podcast Episode", color: "purple" },
            ],
          },
        },
        { key: "due_date", name: "Due Date", type: "date" },
        { key: "campaign", name: "Campaign", type: "relation", relationDatabaseKey: "campaigns" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Board", type: "board", config: { group_by: "Status" } },
      ],
      rows: [
        {
          key: "idea-1",
          title: "Product Launch Teaser Video",
          values: {
            status: "Drafting",
            format: "Short Video",
            due_date: "2026-08-10",
            campaign: { __relation: ["camp-launch"] },
          },
        },
        {
          key: "idea-2",
          title: "Launch Day Blog Announcement",
          values: {
            status: "Idea",
            format: "Blog Post",
            due_date: "2026-08-14",
            campaign: { __relation: ["camp-launch"] },
          },
        },
        {
          key: "idea-3",
          title: "Launch Countdown Carousel",
          values: {
            status: "In Review",
            format: "Carousel",
            due_date: "2026-08-11",
            campaign: { __relation: ["camp-launch"] },
          },
        },
        {
          key: "idea-4",
          title: "July Newsletter Roundup",
          values: {
            status: "Published",
            format: "Newsletter",
            due_date: "2026-07-31",
            campaign: { __relation: ["camp-newsletter"] },
          },
        },
        {
          key: "idea-5",
          title: "August Newsletter Roundup",
          values: {
            status: "Drafting",
            format: "Newsletter",
            due_date: "2026-08-28",
            campaign: { __relation: ["camp-newsletter"] },
          },
        },
        {
          key: "idea-6",
          title: "10 SEO Tips for Beginners",
          values: {
            status: "Idea",
            format: "Blog Post",
            due_date: "2026-08-18",
            campaign: { __relation: ["camp-seo"] },
          },
        },
        {
          key: "idea-7",
          title: "Keyword Research Guide",
          values: {
            status: "Drafting",
            format: "Blog Post",
            due_date: "2026-08-25",
            campaign: { __relation: ["camp-seo"] },
          },
        },
        {
          key: "idea-8",
          title: "Back to School Instagram Carousel",
          values: {
            status: "Idea",
            format: "Carousel",
            due_date: "2026-08-05",
            campaign: { __relation: ["camp-social"] },
          },
        },
        {
          key: "idea-9",
          title: "Student Discount Announcement Reel",
          values: {
            status: "In Review",
            format: "Short Video",
            due_date: "2026-08-07",
            campaign: { __relation: ["camp-social"] },
          },
        },
        {
          key: "idea-10",
          title: "Customer Success Webinar Recap Blog",
          values: {
            status: "Idea",
            format: "Blog Post",
            due_date: "2026-08-30",
            campaign: { __relation: ["camp-webinar"] },
          },
        },
      ],
    },
  ],
};
