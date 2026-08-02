import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const studentPlannerTemplate: PageTemplateDefinition = {
  id: "student-planner",
  name: "Student Planner",
  description: "Track your courses, assignments, and due dates for the semester in one place.",
  icon: "🎓",
  category: "Education",
  tags: ["education", "school", "planner", "assignments"],
  previewColor: "#8b5cf6",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Student Planner",
      icon: "🎓",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Student Planner") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt(
              "Keep your semester organized: log every course you're taking and every assignment you owe, and see how they connect.",
            ),
          },
        },
        {
          content: {
            type: "callout",
            icon: "🗓️",
            color: "blue",
            rich_text: rt(
              "This app doesn't have a calendar view yet, so due dates are tracked via the Assignments database's \"By Due Date\" list view instead — it's sorted so the soonest deadlines always float to the top.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Courses") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Every class you're enrolled in this semester, with credits and instructor info."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Assignments") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Everything due, linked back to its course. Switch to By Due Date to plan your week."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "courses",
      hostPageKey: "root",
      title: "Courses",
      icon: "📘",
      properties: [
        { key: "name", name: "Name", type: "text" },
        { key: "instructor", name: "Instructor", type: "text" },
        { key: "credits", name: "Credits", type: "number" },
        { key: "assignments", name: "Assignments", type: "relation", relationDatabaseKey: "assignments" },
        {
          key: "assignment_count",
          name: "Assignment Count",
          type: "rollup",
          rollup: {
            relationPropertyKey: "assignments",
            targetPropertyKey: "name",
            aggregation: "count",
          },
        },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "course-calc2",
          title: "Calculus II",
          values: {
            instructor: "Dr. Elena Ruiz",
            credits: 4,
            assignments: { __relation: ["asg-1", "asg-2", "asg-3"] },
          },
        },
        {
          key: "course-psych",
          title: "Intro to Psychology",
          values: {
            instructor: "Dr. Michael Chen",
            credits: 3,
            assignments: { __relation: ["asg-4", "asg-5", "asg-6"] },
          },
        },
        {
          key: "course-orgchem",
          title: "Organic Chemistry",
          values: {
            instructor: "Dr. Amara Okafor",
            credits: 4,
            assignments: { __relation: ["asg-7", "asg-8"] },
          },
        },
        {
          key: "course-worldhist",
          title: "World History",
          values: {
            instructor: "Prof. Diane Foster",
            credits: 3,
            assignments: { __relation: ["asg-9", "asg-10"] },
          },
        },
        {
          key: "course-cs201",
          title: "Computer Science 201",
          values: {
            instructor: "Dr. Raj Patel",
            credits: 4,
            assignments: { __relation: [] },
          },
        },
      ],
    },
    {
      key: "assignments",
      hostPageKey: "root",
      title: "Assignments",
      icon: "📝",
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
              { value: "Submitted", color: "yellow" },
              { value: "Graded", color: "green" },
            ],
          },
        },
        { key: "due_date", name: "Due Date", type: "date" },
        { key: "course", name: "Course", type: "relation", relationDatabaseKey: "courses" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        {
          name: "By Due Date",
          type: "list",
          config: { sorts: [{ property: "Due Date", direction: "asc" }] },
        },
      ],
      rows: [
        {
          key: "asg-1",
          title: "Problem Set 3",
          values: { status: "In Progress", due_date: "2026-08-10", course: { __relation: ["course-calc2"] } },
        },
        {
          key: "asg-2",
          title: "Problem Set 4",
          values: { status: "Not Started", due_date: "2026-08-17", course: { __relation: ["course-calc2"] } },
        },
        {
          key: "asg-3",
          title: "Midterm Exam",
          values: { status: "Not Started", due_date: "2026-08-25", course: { __relation: ["course-calc2"] } },
        },
        {
          key: "asg-4",
          title: "Midterm Essay",
          values: { status: "Submitted", due_date: "2026-08-05", course: { __relation: ["course-psych"] } },
        },
        {
          key: "asg-5",
          title: "Reading Response 2",
          values: { status: "Graded", due_date: "2026-07-28", course: { __relation: ["course-psych"] } },
        },
        {
          key: "asg-6",
          title: "Research Proposal",
          values: { status: "In Progress", due_date: "2026-08-15", course: { __relation: ["course-psych"] } },
        },
        {
          key: "asg-7",
          title: "Lab Report — Titration",
          values: { status: "Not Started", due_date: "2026-08-12", course: { __relation: ["course-orgchem"] } },
        },
        {
          key: "asg-8",
          title: "Lab Report — Synthesis",
          values: { status: "In Progress", due_date: "2026-08-19", course: { __relation: ["course-orgchem"] } },
        },
        {
          key: "asg-9",
          title: "Essay: Causes of WWI",
          values: { status: "Submitted", due_date: "2026-08-07", course: { __relation: ["course-worldhist"] } },
        },
        {
          key: "asg-10",
          title: "Primary Source Analysis",
          values: { status: "Not Started", due_date: "2026-08-22", course: { __relation: ["course-worldhist"] } },
        },
      ],
    },
  ],
};
