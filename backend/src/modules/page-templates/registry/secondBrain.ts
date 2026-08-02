import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const secondBrainTemplate: PageTemplateDefinition = {
  id: "second-brain",
  name: "Second Brain",
  description: "A PARA-inspired personal hub for daily focus, journaling, weekly reviews, tasks, and notes.",
  icon: "🧠",
  category: "Personal",
  tags: ["personal", "productivity", "journal", "notes", "para"],
  previewColor: "#8b5cf6",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Second Brain",
      icon: "🧠",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Second Brain") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt(
              "Your personal hub for capturing tasks, notes, and reflections — organized so you always know what matters today and can look back on how the week went.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Today's Focus") } },
        { content: { type: "todo", rich_text: rt("Review calendar and plan top 3 priorities"), checked: true } },
        { content: { type: "todo", rich_text: rt("Drink water and take a short walk"), checked: true } },
        { content: { type: "todo", rich_text: rt("Write in Daily Journal before bed"), checked: false } },
        { content: { type: "todo", rich_text: rt("Clear inbox to zero"), checked: false } },
        { content: { type: "heading2", rich_text: rt("Quick Links") } },
        {
          content: { type: "bulleted_list_item", rich_text: rt("Daily Journal — capture reflections day by day") },
        },
        {
          content: { type: "bulleted_list_item", rich_text: rt("Weekly Review — step back and check in on the bigger picture") },
        },
        {
          content: { type: "page_ref", page_id: "daily-journal", title: "Daily Journal", icon: "📓" },
        },
        {
          content: { type: "page_ref", page_id: "weekly-review", title: "Weekly Review", icon: "🗓️" },
        },
      ],
    },
    {
      key: "daily-journal",
      parentKey: "root",
      title: "Daily Journal",
      icon: "📓",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Daily Journal") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("A short, honest entry each day — what happened, how it felt, and what you learned."),
          },
        },
        { content: { type: "heading3", rich_text: rt("Aug 1, 2026") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Focused morning, got the passport renewal started. Felt good to finally cross that off the list."),
          },
        },
        { content: { type: "heading3", rich_text: rt("Jul 31, 2026") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Slower day — energy was low after a bad night's sleep. Went for a walk anyway, which helped a bit."),
          },
        },
        { content: { type: "heading3", rich_text: rt("Jul 30, 2026") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Good conversation with an old friend. Reminded me to make more time for relationships, not just work."),
          },
        },
      ],
    },
    {
      key: "weekly-review",
      parentKey: "root",
      title: "Weekly Review",
      icon: "🗓️",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Weekly Review") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Every Sunday, take fifteen minutes to step back and honestly answer these prompts."),
          },
        },
        { content: { type: "bulleted_list_item", rich_text: rt("What went well this week?") } },
        { content: { type: "bulleted_list_item", rich_text: rt("What's blocking me right now?") } },
        { content: { type: "bulleted_list_item", rich_text: rt("What did I learn or notice about myself?") } },
        { content: { type: "bulleted_list_item", rich_text: rt("What's the one thing to focus on next week?") } },
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
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Board", type: "board", config: { group_by: "Status" } },
      ],
      rows: [
        { key: "task-1", title: "Renew passport", values: { status: "In Progress", priority: "High", due_date: "2026-08-10" } },
        { key: "task-2", title: "Book dentist appointment", values: { status: "Not Started", priority: "Medium", due_date: "2026-08-15" } },
        { key: "task-3", title: "Read 20 pages of current book", values: { status: "In Progress", priority: "Low", due_date: "2026-08-03" } },
        { key: "task-4", title: "Pay credit card bill", values: { status: "Not Started", priority: "High", due_date: "2026-08-05" } },
        { key: "task-5", title: "Plan weekend hike", values: { status: "Not Started", priority: "Low", due_date: "2026-08-08" } },
        { key: "task-6", title: "Call parents", values: { status: "Done", priority: "Medium", due_date: "2026-07-28" } },
        { key: "task-7", title: "Update budget spreadsheet", values: { status: "Done", priority: "Medium", due_date: "2026-07-25" } },
        { key: "task-8", title: "Sign up for evening yoga class", values: { status: "Not Started", priority: "Low", due_date: "2026-08-20" } },
      ],
    },
    {
      key: "notes",
      hostPageKey: "root",
      title: "Notes",
      icon: "🗒️",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "area",
          name: "Area",
          type: "select",
          options: {
            options: [
              { value: "Health", color: "green" },
              { value: "Career", color: "blue" },
              { value: "Learning", color: "purple" },
              { value: "Finance", color: "orange" },
              { value: "Relationships", color: "pink" },
            ],
          },
        },
        {
          key: "tags",
          name: "Tags",
          type: "multi_select",
          options: {
            options: [
              { value: "Idea", color: "yellow" },
              { value: "Reference", color: "gray" },
              { value: "Goal", color: "blue" },
              { value: "Habit", color: "green" },
              { value: "Reflection", color: "purple" },
            ],
          },
        },
        { key: "created", name: "Created", type: "date" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "note-1",
          title: "Morning routine ideas",
          values: { area: "Health", tags: ["Idea", "Habit"], created: "2026-07-20" },
        },
        {
          key: "note-2",
          title: "Notes from career mentor chat",
          values: { area: "Career", tags: ["Reference", "Goal"], created: "2026-07-22" },
        },
        {
          key: "note-3",
          title: "Books to read this year",
          values: { area: "Learning", tags: ["Goal", "Reference"], created: "2026-07-18" },
        },
        {
          key: "note-4",
          title: "Emergency fund plan",
          values: { area: "Finance", tags: ["Goal"], created: "2026-07-15" },
        },
        {
          key: "note-5",
          title: "Gift ideas for mom's birthday",
          values: { area: "Relationships", tags: ["Idea"], created: "2026-07-27" },
        },
        {
          key: "note-6",
          title: "Reflections on burnout",
          values: { area: "Health", tags: ["Reflection"], created: "2026-07-29" },
        },
        {
          key: "note-7",
          title: "Online course shortlist",
          values: { area: "Learning", tags: ["Idea", "Reference"], created: "2026-08-01" },
        },
        {
          key: "note-8",
          title: "Monthly budget review notes",
          values: { area: "Finance", tags: ["Reference", "Habit"], created: "2026-07-31" },
        },
      ],
    },
  ],
};
