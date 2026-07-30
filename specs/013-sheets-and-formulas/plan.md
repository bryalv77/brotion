# Plan: 013 — Sheets & Formulas

## 1. Architecture overview

The existing `Database` / `Property` / `PropertyValue` models from spec 012
are reused unchanged. A new `formula` value is added to the `PropertyType`
enum (Prisma migration). A new `formula-engine` module on the backend owns
parsing and evaluation; the existing `databases.service` is extended to call
it. The existing `DatabaseView` React component is wired into `PageView` and
gains a `FormulaCell` subcomponent.

```
┌─ Editor (TipTap) ──────┐
│  /, /database → POST /pages/:pageId/databases
└──────────────┬─────────┘
               │ react-query invalidates ["page-databases", pageId]
               ▼
┌─ PageView ─────────────────────────────────────────────┐
│  <DatabaseView pageId=…>   ← now mounted              │
│  ├─ SheetHeader (title, add column, delete)           │
│  ├─ <table> rows:  cell editors per property.type     │
│  │     └─ FormulaCell  → popover with live preview   │
│  └─ + New row                                         │
└───────────────────────────────────────────────────────┘

   POST /databases/:id/properties (type=formula) → addProperty()
   PATCH /rows/:rowPageId/properties/:propertyId → updatePropertyValue()
        │ on write
        ▼
   formula-engine.evaluateRow(rowId, db)
        │ per formula cell
        ▼
   parsed AST → eval(ctx{row values, column types}) → result
        │
        ▼
   LRU<{property_id, page_id}, {value|error}>   (process-local; lost on restart → re-eval on read)
        │
        ▼
   GET /databases/:id → toDatabaseDTO() includes `computed_cells` per row
```

## 2. Data model

### Prisma changes

```prisma
enum PropertyType {
  text
  number
  select
  date
  checkbox
  url
  formula   // NEW
}
```

A new migration `20260730010000_formulas` adds the enum value via
`ALTER TYPE "PropertyType" ADD VALUE 'formula'`. No new tables; no new
columns on `PropertyValue` — the value for a formula property is stored as
`{ formula: "expr" }` and the computed result is returned in a new response
field.

### Shared types (`shared/api-types.ts`)

```ts
export type PropertyType =
  | "text" | "number" | "select" | "date" | "checkbox" | "url" | "formula";

// Value shape for a formula property.
export interface FormulaValue {
  formula: string;
}

export type ComputedCellStatus = "ok" | "error";

export interface ComputedCell {
  status: ComputedCellStatus;
  value?: string | number | boolean | null;   // present iff status === "ok"
  error?: { code: "parse" | "type" | "circular" | "unknown_property" | "division_by_zero"; message: string };
}

// DatabaseRowDTO gains an optional `computed: Record<property_id, ComputedCell>`
// (only present for formula properties).
export interface DatabaseRowDTO {
  page_id: string;
  title: string;
  values: PropertyValueDTO[];
  computed?: Record<string, ComputedCell>;
}
```

A formula property's `PropertyValue.value` is `FormulaValue`; the server
returns `null` in the `values` array for that property and instead puts the
result in `computed[property_id]`. (This keeps the DTO clean: `values` is
"raw input", `computed` is "engine output for formula cells".)

## 3. API contracts

All routes are existing. No new endpoints; the existing endpoints gain new
behavior:

```
POST   /api/v1/pages/:pageId/databases
  body: { title?, icon? }
  → 201 { data: { database: DatabaseDTO } }   // one default row added

POST   /api/v1/databases/:databaseId/properties
  body: { name, type: "formula", options?: { formula: "expr" } }
  → 201 { data: { property: PropertyDTO } }   // when type=formula, all rows now have computed cells

PATCH  /api/v1/rows/:rowPageId/properties/:propertyId
  body: { value: unknown }
  → 200 { data: { value: PropertyValueDTO, computed: Record<property_id, ComputedCell> } }
  // The response now includes the row's recomputed formula cells.

GET    /api/v1/databases/:databaseId
  → 200 { data: { database: DatabaseDTO } }   // each row's `computed` map included
```

When a formula is invalid the response is still 200; the per-cell error
sits inside the `computed` map. This matches how Notion behaves (a bad
formula doesn't break the sheet).

### `GET /databases/:id` — internal changes

`getDatabase(databaseId, userId)` is extended to:
1. Load rows + values (as today).
2. Identify the set of formula properties on this database.
3. For each row × formula-property, run the engine and populate
   `row.computed[property_id]`.
4. Use a process-local LRU (size 5000) keyed by
   `(databaseId, pageId, propertyId, [row values hash])` to skip re-eval
   when nothing changed.

### Property rename handling

There's no existing `PATCH /databases/:id/properties/:propertyId` endpoint
(only `POST /properties`). Adding one is out of scope; per criterion G the
formula is *not* auto-rewritten — it just returns `unknown_property`.

## 4. Formula engine

New module: `backend/src/modules/formulas/`.

```
formulas/
  tokens.ts        // Token kinds
  lexer.ts         // text → Token[]
  parser.ts        // Token[] → AST
  ast.ts           // AST node types
  functions.ts     // built-in function library
  evaluator.ts     // AST + ctx → value | error
  engine.ts        // parseProperty(expr), evaluateRow(rowValues, properties)
  engine.test.ts   // unit tests (vitest? see §5)
```

### Grammar (operator precedence, low → high)

```
expr        := or
or          := and ( "or" and )*
and         := equality ( "and" equality )*
equality    := comparison ( ( "==" | "!=" ) comparison )*
comparison  := additive ( ( "<" | "<=" | ">" | ">=" ) additive )*
additive    := multiplicative ( ( "+" | "-" ) multiplicative )*
multiplicative := unary ( ( "*" | "/" | "%" ) unary )*
unary       := "-" unary | primary
primary     := number | string | true | false | propCall | call | "(" expr ")"
propCall    := "prop" "(" string ")"
call        := ident "(" args? ")"
args        := expr ( "," expr )*
```

### Functions (case-insensitive names; lowercase shown)

| Name        | Args                       | Result type | Notes |
|-------------|----------------------------|-------------|-------|
| `if`        | `cond, then, else`         | any         | truthy = non-0 / non-empty / non-null |
| `concat`    | `a, b, …`                  | string      | coerces args to string |
| `contains`  | `s, needle`                | bool        | case-sensitive substring |
| `length`    | `s`                        | number      | string length; array length if array |
| `upper`     | `s`                        | string      | |
| `lower`     | `s`                        | string      | |
| `trim`     | `s`                        | string      | |
| `round`     | `n, [digits=0]`            | number      | |
| `abs`       | `n`                        | number      | |
| `min`       | `a, b, …`                  | number      | ignores nulls |
| `max`       | `a, b, …`                  | number      | ignores nulls |
| `sum`       | `a, b, …`                  | number      | ignores nulls; coerces numeric strings |
| `avg`       | `a, b, …`                  | number      | mean of non-nulls; 0 if all null |
| `count`     | `a, b, …`                  | number      | count of non-null args |
| `now`       | ()                         | string      | ISO 8601 (treat as string) |

### Coercion rules

- numeric context (`+ - * / %`, comparisons to number): empty / null → 0;
  numeric string → number; otherwise → type error.
- string context (`concat`, `contains`, `length`, `upper`, `lower`, `trim`):
  null / number / bool / date → `.toString()`.
- bool context (`if` cond, `and`, `or`, `not`): null / 0 / "" → false;
  everything else → true.

### Error codes (per ComputedCell.error.code)

- `parse` — lexer or parser error. `message` is the human message.
- `type` — type mismatch (e.g. adding a checkbox to a number).
- `unknown_property` — `prop("Foo")` where `Foo` doesn't exist.
  `message` is the name.
- `circular` — cycle detected at parse time (we collect property
  references from the AST and detect cycles across the database's
  formula properties).
- `division_by_zero` — `/` or `%` by 0.

### Cycle detection

At `addProperty({type:"formula", options:{formula:…}})` we parse the new
expression, collect the set of property names it reads, and check the
existing formula properties for a transitive dependency on the new one. If
found → 400 `FORMULA_CYCLE` (this is the only time we surface a 4xx; at
eval time cells just return `circular`).

We do **not** run dependency detection on every read; cycle detection at
read time is "if we're already evaluating this property for this row,
return `circular`." The defensive at-write check catches the common case
with a clearer error.

## 5. Libraries / tools chosen

- **No new dependencies.** The expression language is small enough to
  hand-roll (≈250 LoC of lexer + recursive-descent parser + evaluator). It
  gives us total control over error messages and avoids the
  prototype-pollution / sandbox concerns of `eval`.
- **No Vitest config exists in this repo today** (only Playwright e2e).
  Engine unit tests are added as a small `*.test.ts` that runs under
  `tsx --test` (Node ≥20's built-in test runner) to keep the verification
  gate tight. If a future spec adopts Vitest we'll move them.

## 6. Frontend components

```
PageView
  ├─ PageHeader
  ├─ Editor                  // existing
  ├─ PageAttachments         // existing
  └─ PageDatabases           // NEW: lists all databases on this page
       └─ <DatabaseView db.id />   // existing component, now mounted
            ├─ SheetHeader
            ├─ <table>
            │    └─ row → <CellEditor type=prop.type>
            │         ├─ TextCell
            │         ├─ NumberCell
            │         ├─ DateCell
            │         ├─ CheckboxCell
            │         ├─ UrlCell
            │         └─ FormulaCell   // NEW: shows computed value; click → popover
            │              ├─ FormulaBar (source input + live preview)
            │              └─ ErrorTooltip (when computed.status==="error")
            └─ + Add row / + Add column
```

State stays in React Query: the `["database", id]` query's data now carries
`row.computed` so the cell render is `O(1)`. The FormulaBar uses **local**
state for the in-progress source + debounced (150 ms) client-side
re-evaluation that calls a new `previewFormula(expr, row)` helper in
`frontend/src/features/formulas/`. Client preview uses the same grammar but
runs on the client for instant feedback; results are not persisted.

The `slashMenu` gains one new item: `{ label: "Database", action: "database",
keywords: ["sheet", "table", "spreadsheet", "database"] }`. The `Editor`'s
`handleSlashCommand` adds a `database` branch that calls
`useCreateDatabase(pageId).mutate({ icon: "📊" })` and on success invalidates
`["page-databases", pageId]` (already in the hook) so the new `DatabaseView`
mounts.

## 7. Edge cases & error handling

- Empty formula string → `computed.error.code = "parse"`.
- Self-reference (formula `Price` reads `prop("Total")` and `Total`'s
  formula reads `prop("Price")`) → `FORMULA_CYCLE` 400 at
  `addProperty`; if somehow both end up created, eval-time defensive
  check returns `circular`.
- `prop("Name")` where `Name` is a `select` (no value set) → null.
- Property deleted while a formula references it (no delete endpoint
  today, but defensively) → `unknown_property`.
- `addRow` doesn't re-run formulas (no formulas for a brand-new empty row
  return `error` until the user fills in the dependencies).
- `updatePropertyValue` on a *formula* property is **rejected** with 400
  `FORMULA_NOT_EDITABLE` — formulas are derived. The cell shows a
  tooltip explaining.
- Permission: `updatePropertyValue` already requires `EDITOR`; we keep
  that. Viewers see the computed value.

## 8. Non-functional considerations

- **Performance:** the LRU means a 1k-row sheet with 5 formula columns
  re-evaluates at most 5 cells per keystroke (only the cells whose inputs
  actually changed). A full cold read of a 1k-row sheet is ~5 ms on a
  modern laptop (the parser is single-pass per cell).
- **Security:** no `eval`. All values flow through typed accessors. The
  parser is a hand-rolled recursive-descent that only knows our grammar;
  there is no way to inject arbitrary JS.
- **Accessibility:** formula cells render their computed value as
  `aria-label="Formula result: 42"`; the source lives in the popover
  text input which is keyboard-navigable.
- **Observability:** engine errors log at `debug` with the expression
  trimmed to 200 chars and a row/property id. No PII.

## 9. Deviations from `constitution.md`

None. New code lives in existing folders; no new infra; the fixed stack
(React + Express + Prisma) is preserved.
