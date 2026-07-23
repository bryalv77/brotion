# Plan: 012 — Databases

## 1. Prisma models (migration `012_databases`)
```prisma
model Database {
  id          String   @id @default(cuid())
  workspace_id String
  page_id     String   // the page hosting this database
  title       String   @default("")
  icon        String?
  created_by  String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  page        Page      @relation(fields: [page_id], references: [id], onDelete: Cascade)
  properties  Property[]
  @@map("databases")
}

model Property {
  id          String   @id @default(cuid())
  database_id String
  name        String
  type        PropertyType
  options     Json?    // for select: [{ value, color }]
  order       Int      @default(0)
  created_at  DateTime @default(now())
  database    Database @relation(fields: [database_id], references: [id], onDelete: Cascade)
  values      PropertyValue[]
  @@map("properties")
}

model PropertyValue {
  id          String   @id @default(cuid())
  page_id     String   // the row (a Page with database_id)
  property_id String
  value       Json     // type-specific: string | number | ISO date | boolean | select-value
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  page        Page     @relation(fields: [page_id], references: [id], onDelete: Cascade)
  property    Property @relation(fields: [property_id], references: [id], onDelete: Cascade)
  @@unique([page_id, property_id])
  @@map("property_values")
}

enum PropertyType { text number select date checkbox url }
```
Page gets `database_id String?` + `database Database? @relation` + `property_values PropertyValue[]`.

## 2. Shared contracts
- `DatabaseDTO`, `PropertyDTO`, `PropertyValueDTO`.
- `POST /pages/:pageId/databases`, `GET /databases/:id`, `PATCH /databases/:id`,
  `DELETE /databases/:id`, `POST /databases/:id/properties`,
  `POST /databases/:id/rows`, `PATCH /rows/:pageId/properties/:propId`.

## 3. Backend module (`modules/databases/`)
Standard pattern: dto, schema, service, controller, routes. Reuses
`getAccessiblePage` for permission checks.

## 4. Frontend
- `DatabaseView` component rendered below the editor when a page has a database.
- Inline cell editors per property type.
- API client + React Query hooks.

## No deviations.
