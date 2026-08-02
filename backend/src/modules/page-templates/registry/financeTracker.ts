import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const financeTrackerTemplate: PageTemplateDefinition = {
  id: "finance-tracker",
  name: "Finance Tracker",
  description: "Track your personal spending against monthly budget categories and see where every dollar goes.",
  icon: "💵",
  category: "Personal",
  tags: ["finance", "budget", "money", "personal"],
  previewColor: "#22c55e",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "Finance Tracker",
      icon: "💵",
      blocks: [
        { content: { type: "heading1", rich_text: rt("Finance Tracker") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Keep an eye on your monthly spending against the budgets you set for each category."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Monthly Overview") } },
        {
          content: {
            type: "callout",
            icon: "📊",
            color: "gray",
            rich_text: rt(
              "[Chart placeholder] Spending by category — charts aren't rendered in this app yet; use the Budget Categories rollup below for totals.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Budget Categories") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Set a monthly budget per category. Total Spent rolls up automatically from your transactions."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Transactions") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Log every purchase here and tag it with a category to keep the rollups accurate."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "budget-categories",
      hostPageKey: "root",
      title: "Budget Categories",
      icon: "🗂️",
      properties: [
        { key: "name", name: "Name", type: "text" },
        { key: "monthly_budget", name: "Monthly Budget", type: "number" },
        { key: "transactions", name: "Transactions", type: "relation", relationDatabaseKey: "transactions" },
        {
          key: "total_spent",
          name: "Total Spent",
          type: "rollup",
          rollup: { relationPropertyKey: "transactions", targetPropertyKey: "amount", aggregation: "sum" },
        },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "cat-groceries",
          title: "Groceries",
          values: { monthly_budget: 500, transactions: { __relation: ["tx-1", "tx-2", "tx-3"] } },
        },
        {
          key: "cat-rent",
          title: "Rent",
          values: { monthly_budget: 1500, transactions: { __relation: ["tx-8"] } },
        },
        {
          key: "cat-transportation",
          title: "Transportation",
          values: { monthly_budget: 200, transactions: { __relation: ["tx-6", "tx-7"] } },
        },
        {
          key: "cat-entertainment",
          title: "Entertainment",
          values: { monthly_budget: 100, transactions: { __relation: [] } },
        },
        {
          key: "cat-dining-out",
          title: "Dining Out",
          values: { monthly_budget: 150, transactions: { __relation: ["tx-9", "tx-10"] } },
        },
        {
          key: "cat-utilities",
          title: "Utilities",
          values: { monthly_budget: 200, transactions: { __relation: ["tx-4", "tx-5"] } },
        },
      ],
    },
    {
      key: "transactions",
      hostPageKey: "root",
      title: "Transactions",
      icon: "🧾",
      properties: [
        { key: "name", name: "Name", type: "text" },
        { key: "amount", name: "Amount", type: "number" },
        { key: "date", name: "Date", type: "date" },
        { key: "category", name: "Category", type: "relation", relationDatabaseKey: "budget-categories" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "By Date", type: "list", config: { sorts: [{ property: "Date", direction: "desc" }] } },
      ],
      rows: [
        {
          key: "tx-1",
          title: "Whole Foods",
          values: { amount: 120, date: "2026-07-05", category: { __relation: ["cat-groceries"] } },
        },
        {
          key: "tx-2",
          title: "Trader Joe's",
          values: { amount: 85, date: "2026-07-12", category: { __relation: ["cat-groceries"] } },
        },
        {
          key: "tx-3",
          title: "Safeway",
          values: { amount: 95, date: "2026-07-20", category: { __relation: ["cat-groceries"] } },
        },
        {
          key: "tx-4",
          title: "Electric Bill",
          values: { amount: 110, date: "2026-07-03", category: { __relation: ["cat-utilities"] } },
        },
        {
          key: "tx-5",
          title: "Water Bill",
          values: { amount: 45, date: "2026-07-10", category: { __relation: ["cat-utilities"] } },
        },
        {
          key: "tx-6",
          title: "Uber Ride",
          values: { amount: 40, date: "2026-07-08", category: { __relation: ["cat-transportation"] } },
        },
        {
          key: "tx-7",
          title: "Gas Station",
          values: { amount: 60, date: "2026-07-15", category: { __relation: ["cat-transportation"] } },
        },
        {
          key: "tx-8",
          title: "Monthly Rent Payment",
          values: { amount: 1500, date: "2026-07-01", category: { __relation: ["cat-rent"] } },
        },
        {
          key: "tx-9",
          title: "The Bistro",
          values: { amount: 90, date: "2026-07-06", category: { __relation: ["cat-dining-out"] } },
        },
        {
          key: "tx-10",
          title: "Sushi Place",
          values: { amount: 85, date: "2026-07-18", category: { __relation: ["cat-dining-out"] } },
        },
      ],
    },
  ],
};
