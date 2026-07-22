# Spec: 008 — QA: accessibility, responsive & polish

## 1. Summary
Final quality pass: keyboard navigation, ARIA labels, focus-visible styles,
responsive sidebar (hamburger on mobile), loading states, and error toasts.
This is the gate that makes the app feel production-quality.

## 2. Scope
- ARIA labels on all interactive elements (sidebar buttons, editor, modals).
- Focus-visible ring styles globally.
- Keyboard: Tab through sidebar, Enter to open page, Escape closes modals.
- Responsive: sidebar collapses to a hamburger on screens < 768px.
- Error boundary: catches React render errors, shows a fallback.
- Toast: simple error toast on API failures.
- Page title (`document.title`) reflects the current page.

## 3. Acceptance criteria
- [ ] All buttons have accessible names (aria-label or text).
- [ ] Tab key moves focus through the sidebar visibly.
- [ ] Sidebar is hidden on narrow viewports with a toggle.
- [ ] document.title updates to the page title.
- [ ] A React error boundary wraps the app.

## 4. Dependencies: Tasks 1–7.
