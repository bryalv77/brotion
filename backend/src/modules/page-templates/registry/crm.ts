import type { PageTemplateDefinition } from "./types.js";

const rt = (text: string) => [{ kind: "text" as const, text }];

export const crmTemplate: PageTemplateDefinition = {
  id: "crm",
  name: "CRM",
  description: "Track your clients and the deals in progress with them, from first contact to closed-won.",
  icon: "🤝",
  category: "Work",
  tags: ["crm", "sales", "clients", "deals"],
  previewColor: "#f97316",
  pages: [
    {
      key: "root",
      parentKey: null,
      title: "CRM",
      icon: "🤝",
      blocks: [
        { content: { type: "heading1", rich_text: rt("CRM") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Keep track of your clients and every deal you're working with them, from first contact to closed-won."),
          },
        },
        {
          content: {
            type: "callout",
            icon: "💡",
            color: "blue",
            rich_text: rt(
              "Each client's \"Total Deal Value\" column automatically sums the Value of every deal linked to them, so you can see who your biggest accounts are at a glance.",
            ),
          },
        },
        { content: { type: "heading2", rich_text: rt("Clients") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Every company or contact you do business with, along with their industry and how much revenue they represent."),
          },
        },
        { content: { type: "heading2", rich_text: rt("Deals") } },
        {
          content: {
            type: "paragraph",
            rich_text: rt("Active and past deals, tracked by stage from Lead through Won or Lost. Use the Board view to move deals along the pipeline."),
          },
        },
      ],
    },
  ],
  databases: [
    {
      key: "clients",
      hostPageKey: "root",
      title: "Clients",
      icon: "🏢",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "industry",
          name: "Industry",
          type: "select",
          options: {
            options: [
              { value: "Technology", color: "blue" },
              { value: "Retail", color: "orange" },
              { value: "Healthcare", color: "green" },
              { value: "Finance", color: "purple" },
              { value: "Manufacturing", color: "gray" },
            ],
          },
        },
        { key: "contact_email", name: "Contact Email", type: "text" },
        { key: "deals", name: "Deals", type: "relation", relationDatabaseKey: "deals" },
        {
          key: "total_deal_value",
          name: "Total Deal Value",
          type: "rollup",
          rollup: { relationPropertyKey: "deals", targetPropertyKey: "value", aggregation: "sum" },
        },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Gallery", type: "gallery", config: {} },
      ],
      rows: [
        {
          key: "client-acme",
          title: "Acme Corp",
          values: {
            industry: "Technology",
            contact_email: "hello@acme.example.com",
            deals: { __relation: ["deal-acme-enterprise", "deal-acme-renewal"] },
          },
        },
        {
          key: "client-globex",
          title: "Globex Retail",
          values: {
            industry: "Retail",
            contact_email: "partnerships@globex.example.com",
            deals: { __relation: ["deal-globex-pilot"] },
          },
        },
        {
          key: "client-initech",
          title: "Initech",
          values: {
            industry: "Finance",
            contact_email: "procurement@initech.example.com",
            deals: { __relation: ["deal-initech-platform", "deal-initech-addon", "deal-initech-support"] },
          },
        },
        {
          key: "client-umbrella",
          title: "Umbrella Health",
          values: {
            industry: "Healthcare",
            contact_email: "vendors@umbrellahealth.example.com",
            deals: { __relation: ["deal-umbrella-rollout"] },
          },
        },
        {
          key: "client-soylent",
          title: "Soylent Manufacturing",
          values: {
            industry: "Manufacturing",
            contact_email: "buyers@soylentmfg.example.com",
            deals: { __relation: ["deal-soylent-upgrade", "deal-soylent-training"] },
          },
        },
        {
          key: "client-hooli",
          title: "Hooli",
          values: {
            industry: "Technology",
            contact_email: "biz@hooli.example.com",
            deals: { __relation: ["deal-hooli-trial"] },
          },
        },
        {
          key: "client-wonka",
          title: "Wonka Industries",
          values: {
            industry: "Retail",
            contact_email: "orders@wonka.example.com",
            deals: { __relation: [] },
          },
        },
      ],
    },
    {
      key: "deals",
      hostPageKey: "root",
      title: "Deals",
      icon: "💰",
      properties: [
        { key: "name", name: "Name", type: "text" },
        {
          key: "stage",
          name: "Stage",
          type: "status",
          options: {
            options: [
              { value: "Lead", color: "gray" },
              { value: "Qualified", color: "blue" },
              { value: "Proposal Sent", color: "yellow" },
              { value: "Won", color: "green" },
              { value: "Lost", color: "red" },
            ],
          },
        },
        { key: "value", name: "Value", type: "number" },
        { key: "close_date", name: "Close Date", type: "date" },
        { key: "client", name: "Client", type: "relation", relationDatabaseKey: "clients" },
      ],
      views: [
        { name: "Table", type: "table", config: {} },
        { name: "Board", type: "board", config: { group_by: "Stage" } },
      ],
      rows: [
        {
          key: "deal-acme-enterprise",
          title: "Acme Corp — Enterprise Plan",
          values: { stage: "Proposal Sent", value: 48000, close_date: "2026-08-20", client: { __relation: ["client-acme"] } },
        },
        {
          key: "deal-acme-renewal",
          title: "Acme Corp — Annual Renewal",
          values: { stage: "Won", value: 22000, close_date: "2026-07-15", client: { __relation: ["client-acme"] } },
        },
        {
          key: "deal-globex-pilot",
          title: "Globex Retail — Pilot Program",
          values: { stage: "Qualified", value: 9500, close_date: "2026-09-01", client: { __relation: ["client-globex"] } },
        },
        {
          key: "deal-initech-platform",
          title: "Initech — Platform Migration",
          values: { stage: "Won", value: 76000, close_date: "2026-06-30", client: { __relation: ["client-initech"] } },
        },
        {
          key: "deal-initech-addon",
          title: "Initech — Analytics Add-on",
          values: { stage: "Proposal Sent", value: 15000, close_date: "2026-08-25", client: { __relation: ["client-initech"] } },
        },
        {
          key: "deal-initech-support",
          title: "Initech — Premium Support",
          values: { stage: "Lead", value: 6000, close_date: "2026-09-10", client: { __relation: ["client-initech"] } },
        },
        {
          key: "deal-umbrella-rollout",
          title: "Umbrella Health — Org-wide Rollout",
          values: { stage: "Qualified", value: 54000, close_date: "2026-09-05", client: { __relation: ["client-umbrella"] } },
        },
        {
          key: "deal-soylent-upgrade",
          title: "Soylent Manufacturing — Upgrade Package",
          values: { stage: "Lost", value: 18000, close_date: "2026-07-01", client: { __relation: ["client-soylent"] } },
        },
        {
          key: "deal-soylent-training",
          title: "Soylent Manufacturing — Team Training",
          values: { stage: "Lead", value: 4000, close_date: "2026-09-18", client: { __relation: ["client-soylent"] } },
        },
        {
          key: "deal-hooli-trial",
          title: "Hooli — Trial Conversion",
          values: { stage: "Lead", value: 3000, close_date: "2026-08-30", client: { __relation: ["client-hooli"] } },
        },
      ],
    },
  ],
};
