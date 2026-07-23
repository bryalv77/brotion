# Plan: 013 — Page export (MD + PDF)

## 1. Backend module (`modules/export/`)
- `export.service.ts`:
  - `toMarkdown(page, blocks)`: iterate blocks, map each type to MD syntax.
    Tables → GFM pipe syntax.
  - `toHtml(page, blocks)`: render a styled HTML doc (inline CSS) for PDF.
  - `toPdf(html)`: `puppeteer.launch()` → `setContent` → `pdf()` → Buffer.
- `export.controller.ts`: `GET /pages/:pageId/export?format=md|pdf`.
  Uses `getAccessiblePage` for permission, `getPageWithBlocks` for data.
  Sets `Content-Disposition: attachment; filename="..."` and streams bytes.
- `export.routes.ts`: mounted at `/pages/:pageId/export` (mergeParams).

## 2. Install `puppeteer` in backend.

## 3. Frontend
- Two buttons in PageHeader: "Export MD" / "Export PDF".
- Trigger via `window.location.href = '/api/v1/pages/:id/export?format=md'`
  (browser handles the download automatically).

## No deviations.
