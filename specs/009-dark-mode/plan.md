# Plan: 009 — Dark mode + full-height sidebar

## 1. Approach: Tailwind class strategy
- `tailwind.config.ts`: `darkMode: "class"`.
- `stores/theme.ts`: Zustand store with `persist`. `effectiveTheme` resolves
  `"system"` via `matchMedia("(prefers-color-scheme: dark)")`.
- `index.html`: inline `<script>` runs before React — reads localStorage and
  sets `document.documentElement.classList`.

## 2. File-by-file dark variant mapping
| Light class | Dark variant |
|-------------|-------------|
| `bg-white` | `dark:bg-neutral-900` |
| `bg-neutral-50` | `dark:bg-neutral-800` |
| `bg-neutral-100` | `dark:bg-neutral-700` |
| `bg-neutral-200` | `dark:bg-neutral-700` |
| `text-neutral-900` | `dark:text-neutral-100` |
| `text-neutral-700` | `dark:text-neutral-300` |
| `text-neutral-600` | `dark:text-neutral-400` |
| `text-neutral-500` | `dark:text-neutral-400` |
| `text-neutral-400` | `dark:text-neutral-500` |
| `border-neutral-200` | `dark:border-neutral-700` |
| `border-neutral-300` | `dark:border-neutral-600` |
| `hover:bg-neutral-100` | `dark:hover:bg-neutral-700` |
| `hover:bg-neutral-200` | `dark:hover:bg-neutral-600` |
| `bg-black/20` | `dark:bg-black/40` |

Blue accents stay the same (they work on both themes).

## 3. Editor CSS → CSS variables
Define in `:root` and override in `.dark`:
`--nc-surface, --nc-surface-muted, --nc-border, --nc-text, --nc-text-muted,
--nc-code-bg, --nc-code-text, --nc-placeholder, --nc-menu-bg, --nc-menu-border`

## 4. Full-height sidebar
- `Sidebar.tsx`: `<aside className="flex h-full w-60 ...">`
- `AppShell.tsx`: desktop wrapper `hidden h-full md:block`.

## 5. No new deps. No deviations.
