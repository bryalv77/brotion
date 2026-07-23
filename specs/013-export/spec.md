# Spec: 013 — Page export (Markdown + PDF)

## 1. Summary
Export a page and its blocks as Markdown or PDF. Markdown is generated in pure
TS; PDF uses backend Puppeteer (headless Chromium renders styled HTML).

## 2. User stories
- As a user, I want to export a page as Markdown (.md).
- As a user, I want to export a page as PDF.

## 3. Scope
- Backend `modules/export/`: `toMarkdown(page, blocks)` + `toPdf(page, blocks)`.
- `GET /pages/:pageId/export?format=md|pdf` — returns file bytes (Content-Disposition).
- Frontend: export buttons in PageHeader (⋯ menu or direct buttons).
- Markdown: headings, lists, todo, quote, code, divider, table (GFM).
- PDF: styled HTML with inline CSS, no external deps.

## 4. Acceptance criteria
- [ ] Export as MD returns `text/markdown` with `# Title`, list items, code blocks.
- [ ] Export as PDF returns `application/pdf` with non-empty body.
- [ ] Export respects page access permissions.

## 5. Dependencies: Tasks 0–8, Features 1–3.
