# Plan: 008 — QA pass

## Changes
1. `index.css`: add focus-visible ring + smooth scrolling.
2. `ErrorBoundary.tsx`: class component wrapping `<App/>`.
3. `useDocumentTitle` hook: sets `document.title` from page title.
4. Sidebar responsive: hidden < 768px; hamburger button in AppShell.
5. ARIA labels: audit all `<button>` elements, add `aria-label` where icon-only.
6. Toast: minimal Zustand store + `<Toaster/>` component for API errors.

## No new deps. No deviations.
