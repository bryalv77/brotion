# Spec: 009 — Dark mode + full-height sidebar

## 1. Summary
Add a Tailwind class-based dark mode with a system-default + user-toggle, plus
an explicit full-height sidebar fix. All 17 component/route files get `dark:`
variants; editor CSS moves to CSS variables.

## 2. User stories
- As a user, I want the app to follow my OS dark/light setting automatically.
- As a user, I want to toggle the theme manually (light → dark → system).
- As a user, I want my theme preference to persist across sessions.
- As a user, I want the sidebar to always reach full viewport height.

## 3. Scope
- Tailwind `darkMode: "class"`.
- Zustand theme store (`light | dark | system`) with `persist`.
- Inline anti-FOUC script in `index.html`.
- Theme toggle button in Sidebar footer.
- `dark:` variants on all component/route files (76 occurrences).
- Editor CSS → CSS variables in `:root` / `.dark`.
- Sidebar `h-full` on `<aside>` + desktop wrapper.

## 4. Acceptance criteria
- [ ] `<html>` has `dark` class when dark mode is active.
- [ ] Toggle cycles light → dark → system.
- [ ] Preference persists in localStorage.
- [ ] No FOUC (flash of unstyled/light content) on reload.
- [ ] Sidebar `<aside>` height === viewport height.

## 5. Dependencies: Tasks 1–8 (existing app).
