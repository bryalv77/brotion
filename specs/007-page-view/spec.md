# Spec: 007 — Frontend: page view header, cover & icon

## 1. Summary
Enhance the page view with a Notion-style header: optional cover image, emoji
icon, and an inline-editable title that saves on blur. A "Add cover" / "Add
icon" affordance appears on hover when absent.

## 2. User stories
- As a user, I want to set a cover image for my page.
- As a user, I want to set an emoji icon for my page.
- As a user, I want to edit the title inline and have it autosave.
- As a user, I want to remove the cover/icon.

## 3. Scope
- `PageHeader` component (cover, icon, title).
- Emoji picker (a simple grid of common emojis, no library).
- Cover URL input (paste a URL — no upload-to-cover yet).
- Inline title editing with debounce PATCH.
- Breadcrumbs (workspace > parent pages > current).
- Trash view stub (`/app/:wsId/trash`) listing soft-deleted pages with restore.

## 4. Acceptance criteria
- [ ] Title is editable inline and saves on blur.
- [ ] "Add icon" shows an emoji picker; selecting sets the icon.
- [ ] "Add cover" accepts a URL and displays the image.
- [ ] Icon/cover persist across page reloads.
- [ ] Breadcrumbs show the page hierarchy.

## 5. Open questions
- Emoji picker: library vs custom? → custom simple grid (keep deps lean).

## 6. Dependencies: Tasks 1–6.
