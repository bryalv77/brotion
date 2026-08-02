import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const habitTrackerTemplate: PageTemplateDefinition = {
  id: "habit-tracker",
  name: "Habit Tracker",
  description: "Build lasting daily habits and track your streaks with a simple habits list and a daily completion log.",
  icon: "🔥",
  category: "Personal",
  tags: ["habits", "personal", "productivity", "wellness"],
  previewColor: "#f97316",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Habit Tracker",
      icon: "🔥",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Habit Tracker") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Build lasting daily habits and keep yourself honest with a simple log of every completion."),
          },
        },
        {
          content: {
            type: "callout",
            icon: "💡",
            color: "orange",
            rich_text: rt(
              "Use the Habits database to define what you're tracking, and log each day's completions in the Daily Log below. This app has no calendar view, so \"calendar\"-style tracking is approximated with the Daily Log's By Date list view, sorted newest first — scroll it like a running calendar feed.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Habits") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("The habits you're building, their category, and how often you're aiming to do them."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Daily Log") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("One entry per habit per day. Check it off, and watch each habit's completion count grow."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "habits",
      hostPageKey: "root",
      title: "Habits",
      icon: "🎯",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "category",
          name: "Category",
          type: "select",
          options: {
            options: [
              { value: "Health", color: "green" },
              { value: "Mindfulness", color: "purple" },
              { value: "Fitness", color: "red" },
              { value: "Learning", color: "blue" },
            ],
          },
        },
        { key: "target", name: "Target", type: "text" },
        { key: "log_entries", name: "Log Entries", type: "relation", relationDatabaseKey: "daily-log" },
        {
          key: "times_logged",
          name: "Times Logged",
          type: "rollup",
          rollup: { relationPropertyKey: "log_entries", targetPropertyKey: "log_name", aggregation: "count" },
        },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "habit-water",
          title: "Drink 8 glasses of water",
          values: { category: "Health", target: "Daily", log_entries: { __relation: ["log-1", "log-5", "log-9"] } },
        },
        {
          key: "habit-meditate",
          title: "Meditate 10 min",
          values: { category: "Mindfulness", target: "Daily", log_entries: { __relation: ["log-2", "log-6"] } },
        },
        {
          key: "habit-read",
          title: "Read",
          values: { category: "Learning", target: "Daily", log_entries: { __relation: ["log-3", "log-7", "log-10"] } },
        },
        {
          key: "habit-exercise",
          title: "Exercise",
          values: { category: "Fitness", target: "3x/week", log_entries: { __relation: ["log-4", "log-8"] } },
        },
        {
          key: "habit-no-screens",
          title: "No screens after 10pm",
          values: { category: "Health", target: "Daily", log_entries: { __relation: [] } },
        },
        {
          key: "habit-stretch",
          title: "Stretch",
          values: { category: "Fitness", target: "3x/week", log_entries: { __relation: [] } },
        },
        {
          key: "habit-journal",
          title: "Journal",
          values: { category: "Mindfulness", target: "Daily", log_entries: { __relation: [] } },
        },
      ],
    },
    {
      key: "daily-log",
      hostPageKey: "root",
      title: "Daily Log",
      icon: "📅",
      properties: [
        { key: "log_name", name: "Name", type: "text" },
        { key: "date", name: "Date", type: "date" },
        { key: "completed", name: "Completed", type: "checkbox" },
        { key: "habit", name: "Habit", type: "relation", relationDatabaseKey: "habits" },
      ],
      views: [
        { name: "By Date", type: "list", config: { sorts: [{ property: "Date", direction: "desc" }] } },
        { name: "Table", type: "table", config: {} },
      ],
      rows: [
        {
          key: "log-1",
          title: "Drink 8 glasses of water — Aug 1",
          values: { date: "2026-08-01", completed: true, habit: { __relation: ["habit-water"] } },
        },
        {
          key: "log-2",
          title: "Meditate — Aug 1",
          values: { date: "2026-08-01", completed: true, habit: { __relation: ["habit-meditate"] } },
        },
        {
          key: "log-3",
          title: "Read — Aug 1",
          values: { date: "2026-08-01", completed: true, habit: { __relation: ["habit-read"] } },
        },
        {
          key: "log-4",
          title: "Exercise — Aug 1",
          values: { date: "2026-08-01", completed: true, habit: { __relation: ["habit-exercise"] } },
        },
        {
          key: "log-5",
          title: "Drink 8 glasses of water — Jul 31",
          values: { date: "2026-07-31", completed: true, habit: { __relation: ["habit-water"] } },
        },
        {
          key: "log-6",
          title: "Meditate — Jul 31",
          values: { date: "2026-07-31", completed: false, habit: { __relation: ["habit-meditate"] } },
        },
        {
          key: "log-7",
          title: "Read — Jul 31",
          values: { date: "2026-07-31", completed: true, habit: { __relation: ["habit-read"] } },
        },
        {
          key: "log-8",
          title: "Exercise — Jul 30",
          values: { date: "2026-07-30", completed: true, habit: { __relation: ["habit-exercise"] } },
        },
        {
          key: "log-9",
          title: "Drink 8 glasses of water — Jul 30",
          values: { date: "2026-07-30", completed: true, habit: { __relation: ["habit-water"] } },
        },
        {
          key: "log-10",
          title: "Read — Jul 30",
          values: { date: "2026-07-30", completed: true, habit: { __relation: ["habit-read"] } },
        },
      ],
    },
  ],
};
