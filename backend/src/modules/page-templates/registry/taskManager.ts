import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const taskManagerTemplate: PageTemplateDefinition = {
  id: "task-manager",
  name: "Task Manager",
  description: "Track your team's work from backlog to done, with priorities, due dates, and a board view.",
  icon: "✅",
  category: "Work",
  tags: ["tasks", "productivity", "team"],
  previewColor: "#3b82f6",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Task Manager",
      icon: "✅",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Task Manager") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Track your team's work from backlog to done."),
          },
        },
        {
          content: {
            type: "callout",
            icon: "💡",
            color: "blue",
            rich_text: rt(
              "Use the Tasks database below to add, filter, and assign work. Switch to the Board view to drag tasks across statuses.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Tasks") } },
      ],
    },
  ],
  databases: [
    {
      key: "tasks",
      hostPageKey: "root",
      title: "Tasks",
      icon: "✅",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "status",
          name: "Status",
          type: "status",
          options: {
            options: [
              { value: "Not Started", color: "gray" },
              { value: "In Progress", color: "blue" },
              { value: "Done", color: "green" },
            ],
          },
        },
        {
          key: "priority",
          name: "Priority",
          type: "select",
          options: {
            options: [
              { value: "Low", color: "gray" },
              { value: "Medium", color: "yellow" },
              { value: "High", color: "red" },
            ],
          },
        },
        { key: "due_date", name: "Due Date", type: "date" },
        { key: "assignee", name: "Assignee", type: "text" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        {
          name: "Board",
          type: "board",
          config: { group_by: "Status" },
        },
        {
          name: "By Due Date",
          type: "list",
          config: { sorts: [{ property: "Due Date", direction: "asc" }] },
        },
      ],
      rows: [
        {
          key: "row-1",
          title: "Design new landing page",
          values: { status: "In Progress", priority: "High", due_date: "2026-08-08", assignee: "Alex Rivera" },
        },
        {
          key: "row-2",
          title: "Write Q3 roadmap doc",
          values: { status: "Not Started", priority: "High", due_date: "2026-08-12", assignee: "Priya Shah" },
        },
        {
          key: "row-3",
          title: "Fix checkout flow bug",
          values: { status: "In Progress", priority: "High", due_date: "2026-08-05", assignee: "Sam Lee" },
        },
        {
          key: "row-4",
          title: "Update onboarding emails",
          values: { status: "Not Started", priority: "Medium", due_date: "2026-08-15", assignee: "Alex Rivera" },
        },
        {
          key: "row-5",
          title: "Review pull requests",
          values: { status: "Done", priority: "Medium", due_date: "2026-07-30", assignee: "Sam Lee" },
        },
        {
          key: "row-6",
          title: "Prep customer demo",
          values: { status: "In Progress", priority: "Medium", due_date: "2026-08-06", assignee: "Priya Shah" },
        },
        {
          key: "row-7",
          title: "Archive old support tickets",
          values: { status: "Done", priority: "Low", due_date: "2026-07-28", assignee: "Jordan Kim" },
        },
        {
          key: "row-8",
          title: "Plan team offsite",
          values: { status: "Not Started", priority: "Low", due_date: "2026-08-20", assignee: "Jordan Kim" },
        },
      ],
    },
  ],
};
