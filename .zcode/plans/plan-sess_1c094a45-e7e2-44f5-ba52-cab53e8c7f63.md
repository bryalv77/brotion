# Plan: Import from Notion / files (MD, TXT, DOCX, PDF, XLSX)

## Overview
New backend module `modules/import/` + frontend import UI. Accepts file uploads in 6 formats, parses each into our block model, creates a new page with the converted blocks. Reuses the existing multer multipart pipeline and page/block creation services.

## Endpoint
```
POST /api/v1/workspaces/:workspaceId/import
  multipart/form-data:
    file: <uploaded file>
    parent_id?: string (optional parent page)
  → 201 { data: { page: PageDTO } }
```

## New backend dependencies
| Format | Library | Purpose |
|--------|--------|---------|
| `.md` | `markdown-it` | Parse MD → tokens → blocks |
| `.txt` | (none — line-by-line) | Each line → paragraph |
| `.docx` | `mammoth` | DOCX → HTML → blocks |
| `.pdf` | `unpdf` | Server-side PDF text extraction |
| `.xlsx` | `xlsx` (SheetJS) | Spreadsheet → table blocks |
| HTML intermediate | `cheerio` | Walk mammoth's HTML output into blocks |

## Backend module structure
```
backend/src/modules/import/
├── import.service.ts    # Orchestrator: detect format → parse → create page + blocks
├── import.controller.ts # Multipart handler
├── import.routes.ts     # POST route with multer
└── parsers/
    ├── markdown.ts      # markdown-it tokens → BlockContent[]
    ├── text.ts          # plain text → paragraph blocks
    ├── docx.ts          # mammoth → HTML → cheerio → blocks
    ├── pdf.ts           # unpdf → text → paragraph blocks
    └── spreadsheet.ts   # xlsx → table + table_row blocks
```

### Parser → Block mapping
| Source element | Block type |
|----------------|-----------|
| `# H1` / `<h1>` | `heading1` |
| `## H2` / `<h2>` | `heading2` |
| `### H3` / `<h3>` | `heading3` |
| `- item` / `<ul><li>` | `bulleted_list_item` |
| `1. item` / `<ol><li>` | `numbered_list_item` |
| `- [x] done` | `todo` (checked: true) |
| `> quote` / `<blockquote>` | `quote` |
| ` ```code``` ` / `<pre>` | `code` |
| `---` / `<hr>` | `divider` |
| GFM table / `<table>` | `table` + `table_row` children |
| Plain paragraph | `paragraph` |
| Inline `**bold**` / `<strong>` | RichText mark: bold |
| Inline `*italic*` / `<em>` | RichText mark: italic |
| Inline `` `code` `` / `<code>` | RichText mark: code |

### Batch block creation
Instead of calling `createBlock` N times (slow + N `refreshPageContentText` calls), create the page + all blocks in a single `$transaction` with incrementing `order` values (1.0, 2.0, 3.0...). Template: the existing `duplicatePage` function.

## Frontend
- **API client** (`api/import.ts`): `importFile(workspaceId, file, parentId?)` — multipart FormData POST.
- **Import button**: In the Sidebar next to the "+ New page" button, add an "Import" option. Also in the PageTree context menu ("Import into this page").
- **File picker**: hidden `<input type="file" accept=".md,.txt,.docx,.doc,.pdf,.xlsx,.xls">`.
- **On success**: navigate to the newly created page.
- **On error**: toast notification (file too large, unsupported type, parse failure).

## Execution order
1. Install deps (`markdown-it`, `@types/markdown-it`, `mammoth`, `unpdf`, `xlsx`, `cheerio`).
2. Parsers: `markdown.ts`, `text.ts`, `docx.ts`, `pdf.ts`, `spreadsheet.ts`.
3. `import.service.ts` (orchestrator + transactional batch insert).
4. `import.controller.ts` + `import.routes.ts` + mount in `app.ts`.
5. Frontend `api/import.ts` + Sidebar import button + file picker.
6. e2e: import a .md file → verify page created with correct blocks.
7. Gate: lint, typecheck, test:e2e.