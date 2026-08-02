import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const readingListTemplate: PageTemplateDefinition = {
  id: "reading-list",
  name: "Reading List",
  description: "Track the books you want to read, are currently reading, and have finished, with ratings and notes.",
  icon: "📖",
  category: "Personal",
  tags: ["books", "reading", "personal", "notes"],
  previewColor: "#f59e0b",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Reading List",
      icon: "📖",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Reading List") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Keep track of every book you want to read, what you're reading now, and what you've finished."),
          },
        },
        {
          content: {
            type: "callout",
            icon: "🎯",
            color: "yellow",
            rich_text: rt("Aim for 2 books a month. Small, steady progress adds up over a year."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Books") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Use the database below to log books, track status, rate what you've finished, and jot down notes."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "books",
      hostPageKey: "root",
      title: "Books",
      icon: "📚",
      properties: [
        { key: "name", name: "Name", type: "text" },
        { key: "author", name: "Author", type: "text" },
        {
          key: "status",
          name: "Status",
          type: "status",
          options: {
            options: [
              { value: "To Read", color: "gray" },
              { value: "Reading", color: "blue" },
              { value: "Finished", color: "green" },
            ],
          },
        },
        {
          key: "rating",
          name: "Rating",
          type: "select",
          options: {
            options: [
              { value: "★☆☆☆☆", color: "gray" },
              { value: "★★☆☆☆", color: "gray" },
              { value: "★★★☆☆", color: "yellow" },
              { value: "★★★★☆", color: "yellow" },
              { value: "★★★★★", color: "orange" },
            ],
          },
        },
        {
          key: "genre",
          name: "Genre",
          type: "multi_select",
          options: {
            options: [
              { value: "Fiction", color: "blue" },
              { value: "Non-Fiction", color: "green" },
              { value: "Sci-Fi", color: "purple" },
              { value: "Biography", color: "yellow" },
              { value: "Business", color: "orange" },
              { value: "Self-Help", color: "pink" },
            ],
          },
        },
        { key: "pages", name: "Pages", type: "number" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Board", type: "board", config: { group_by: "Status" } },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "row-1",
          title: "Atomic Habits",
          values: {
            author: "James Clear",
            status: "Finished",
            rating: "★★★★★",
            genre: ["Self-Help", "Non-Fiction"],
            pages: 320,
          },
          body: [
            { content: { type: "heading2", rich_text: rt("My Notes") } },
            {
              content: {
                type: "paragraph",
                rich_text: rt("The 1% better every day framing stuck with me. Habit stacking is the one technique I actually kept using."),
              },
            },
          ],
        },
        {
          key: "row-2",
          title: "Project Hail Mary",
          values: {
            author: "Andy Weir",
            status: "Finished",
            rating: "★★★★★",
            genre: ["Sci-Fi", "Fiction"],
            pages: 496,
          },
          body: [
            { content: { type: "heading2", rich_text: rt("My Notes") } },
            {
              content: {
                type: "paragraph",
                rich_text: rt("\"Astrophage\" is a wild idea and the buddy dynamic between Grace and Rocky carries the whole book."),
              },
            },
            {
              content: {
                type: "paragraph",
                rich_text: rt("Best sci-fi problem-solving book I've read since The Martian."),
              },
            },
          ],
        },
        {
          key: "row-3",
          title: "Educated",
          values: {
            author: "Tara Westover",
            status: "Finished",
            rating: "★★★★☆",
            genre: ["Biography", "Non-Fiction"],
            pages: 352,
          },
          body: [
            { content: { type: "heading2", rich_text: rt("My Notes") } },
            {
              content: {
                type: "paragraph",
                rich_text: rt("A gripping account of self-education against enormous odds. Left me thinking about family and identity for days."),
              },
            },
          ],
        },
        {
          key: "row-4",
          title: "The Lean Startup",
          values: {
            author: "Eric Ries",
            status: "Reading",
            genre: ["Business"],
            pages: 336,
          },
        },
        {
          key: "row-5",
          title: "Dune",
          values: {
            author: "Frank Herbert",
            status: "Reading",
            genre: ["Sci-Fi", "Fiction"],
            pages: 412,
          },
        },
        {
          key: "row-6",
          title: "Sapiens",
          values: {
            author: "Yuval Noah Harari",
            status: "To Read",
            genre: ["Non-Fiction"],
            pages: 443,
          },
        },
        {
          key: "row-7",
          title: "The Pragmatic Programmer",
          values: {
            author: "David Thomas & Andrew Hunt",
            status: "To Read",
            genre: ["Non-Fiction", "Business"],
            pages: 352,
          },
        },
        {
          key: "row-8",
          title: "Circe",
          values: {
            author: "Madeline Miller",
            status: "To Read",
            genre: ["Fiction"],
            pages: 400,
          },
        },
        {
          key: "row-9",
          title: "Thinking, Fast and Slow",
          values: {
            author: "Daniel Kahneman",
            status: "Finished",
            rating: "★★★☆☆",
            genre: ["Non-Fiction", "Business"],
            pages: 499,
          },
        },
        {
          key: "row-10",
          title: "The Hobbit",
          values: {
            author: "J.R.R. Tolkien",
            status: "To Read",
            genre: ["Fiction", "Sci-Fi"],
            pages: 310,
          },
        },
      ],
    },
  ],
};
