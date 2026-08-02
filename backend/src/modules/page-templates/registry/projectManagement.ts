import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const projectManagementTemplate: PageTemplateDefinition = {
  id: "project-management",
  name: "Project Management",
  description: "Track projects alongside the tasks that belong to them, with a rollup that shows task counts per project.",
  icon: "📊",
  category: "Work",
  tags: ["projects", "tasks", "planning", "team"],
  previewColor: "#8b5cf6",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Project Management",
      icon: "📊",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Project Management") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt(
              "Plan projects and track the tasks that make them up. The Projects and Tasks databases below are linked, so each project shows the tasks assigned to it and each task shows which project it belongs to.",
            ),
          },
        },
        {
          content: {
            type: "callout",
            icon: "💡",
            color: "purple",
            rich_text: rt(
              "The \"Task Count\" column on Projects is a rollup — it automatically counts the linked Tasks rows, so it updates on its own as you add or remove tasks.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Projects") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Every initiative your team is running, with an owner, a target date, and a live task count."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Tasks") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("The individual pieces of work, each linked back to the project it supports."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "projects",
      hostPageKey: "root",
      title: "Projects",
      icon: "📁",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "status",
          name: "Status",
          type: "select",
          options: {
            options: [
              { value: "Planning", color: "gray" },
              { value: "Active", color: "blue" },
              { value: "On Hold", color: "yellow" },
              { value: "Completed", color: "green" },
            ],
          },
        },
        { key: "owner", name: "Owner", type: "text" },
        { key: "target_date", name: "Target Date", type: "date" },
        { key: "tasks_rel", name: "Tasks", type: "relation", relationDatabaseKey: "tasks" },
        {
          key: "task_count",
          name: "Task Count",
          type: "rollup",
          rollup: { relationPropertyKey: "tasks_rel", targetPropertyKey: "name", aggregation: "count" },
        },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "proj-1",
          title: "Website Redesign",
          values: {
            status: "Active",
            owner: "Alex Rivera",
            target_date: "2026-09-15",
            tasks_rel: { __relation: ["task-1", "task-2", "task-3"] },
          },
        },
        {
          key: "proj-2",
          title: "Mobile App Launch",
          values: {
            status: "Active",
            owner: "Priya Shah",
            target_date: "2026-10-01",
            tasks_rel: { __relation: ["task-4", "task-5"] },
          },
        },
        {
          key: "proj-3",
          title: "Q3 Marketing Campaign",
          values: {
            status: "Planning",
            owner: "Jordan Kim",
            target_date: "2026-09-30",
            tasks_rel: { __relation: ["task-6", "task-7"] },
          },
        },
        {
          key: "proj-4",
          title: "Customer Portal Revamp",
          values: {
            status: "On Hold",
            owner: "Sam Lee",
            target_date: "2026-11-01",
            tasks_rel: { __relation: ["task-8"] },
          },
        },
        {
          key: "proj-5",
          title: "Internal Tools Migration",
          values: {
            status: "Completed",
            owner: "Alex Rivera",
            target_date: "2026-07-20",
            tasks_rel: { __relation: ["task-9"] },
          },
        },
        {
          key: "proj-6",
          title: "Data Pipeline Overhaul",
          values: {
            status: "Active",
            owner: "Priya Shah",
            target_date: "2026-09-10",
            tasks_rel: { __relation: ["task-10"] },
          },
        },
        {
          key: "proj-7",
          title: "Brand Guidelines Update",
          values: {
            status: "Planning",
            owner: "Jordan Kim",
            target_date: "2026-10-15",
          },
        },
      ],
    },
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
        { key: "points", name: "Points", type: "number" },
        { key: "project_rel", name: "Project", type: "relation", relationDatabaseKey: "projects" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Board", type: "board", config: { group_by: "Status" } },
      ],
      rows: [
        {
          key: "task-1",
          title: "Design new homepage",
          values: { status: "In Progress", points: 5, project_rel: { __relation: ["proj-1"] } },
        },
        {
          key: "task-2",
          title: "Set up component library",
          values: { status: "Not Started", points: 8, project_rel: { __relation: ["proj-1"] } },
        },
        {
          key: "task-3",
          title: "QA responsive layouts",
          values: { status: "Not Started", points: 3, project_rel: { __relation: ["proj-1"] } },
        },
        {
          key: "task-4",
          title: "Build onboarding flow",
          values: { status: "In Progress", points: 8, project_rel: { __relation: ["proj-2"] } },
        },
        {
          key: "task-5",
          title: "App store submission",
          values: { status: "Not Started", points: 2, project_rel: { __relation: ["proj-2"] } },
        },
        {
          key: "task-6",
          title: "Draft campaign messaging",
          values: { status: "Done", points: 3, project_rel: { __relation: ["proj-3"] } },
        },
        {
          key: "task-7",
          title: "Design campaign assets",
          values: { status: "In Progress", points: 5, project_rel: { __relation: ["proj-3"] } },
        },
        {
          key: "task-8",
          title: "Audit legacy support portal",
          values: { status: "Not Started", points: 5, project_rel: { __relation: ["proj-4"] } },
        },
        {
          key: "task-9",
          title: "Migrate CI pipeline",
          values: { status: "Done", points: 8, project_rel: { __relation: ["proj-5"] } },
        },
        {
          key: "task-10",
          title: "Set up ETL monitoring",
          values: { status: "In Progress", points: 5, project_rel: { __relation: ["proj-6"] } },
        },
      ],
    },
  ],
};
