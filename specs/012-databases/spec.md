# Spec: 012 — Databases (Notion-style table databases)

## 1. Summary
Add typed-property databases: a `Database` is hosted on a page and contains rows
(each a `Page` with `database_id`). Columns are `Property` definitions (text,
number, select, date, checkbox, url). Cell values are `PropertyValue` rows.

## 2. User stories
- As a user, I want to create a database on a page.
- As a user, I want to add columns (properties) with types.
- As a user, I want to add rows and fill in cell values.
- As a user, I want to edit property values inline.
- As a user, I want to see the database as a table.

## 3. Scope
- Prisma: `Database`, `Property`, `PropertyValue` models + `database_id` on Page.
- Shared DTOs + contracts.
- Backend module: CRUD for databases, properties, rows, values.
- Frontend: `DatabaseView` component (table grid with inline editors).

## 4. Acceptance criteria
- [ ] Create a database on a page → appears as a table.
- [ ] Add a text property → shows as a column.
- [ ] Add a row → editable cells.
- [ ] Edit a cell → persists.
- [ ] Delete a database.

## 5. Dependencies: Tasks 0–8, Features 1–2.
