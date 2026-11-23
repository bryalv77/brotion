/** Central palette. `colors` is mutated in place by applyPalette so inline styles follow the theme. */
const light = {
  ink: "#37352f",
  inkLight: "#5f5e5b",
  inkFaint: "#75736f",
  placeholder: "#b4b2ae",
  bg: "#ffffff",
  sidebar: "#f7f7f5",
  hover: "#efefed",
  active: "#e7e6e3",
  border: "#e9e9e7",
  accent: "#1a6fc4",
  danger: "#d44c47",
  success: "#0f9d58",
  warning: "#d9a23b",
};
const dark: typeof light = {
  ...light,
  ink: "#ebebea",
  inkLight: "#aaa9a6",
  inkFaint: "#8a8987",
  placeholder: "#5a5958",
  bg: "#191919",
  sidebar: "#202020",
  hover: "#2c2c2c",
  active: "#373737",
  border: "#2f2f2f",
  accent: "#4c9bf0",
};

export const colors = { ...light };

const hexToRgb = (h: string) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");

/** Switch `colors` and return the CSS variables Tailwind classes read (see tailwind.config.js). */
export function applyPalette(isDark: boolean) {
  const p = isDark ? dark : light;
  Object.assign(colors, p);
  return {
    "--ink": hexToRgb(p.ink),
    "--ink-light": hexToRgb(p.inkLight),
    "--ink-faint": hexToRgb(p.inkFaint),
    "--bg": hexToRgb(p.bg),
    "--sidebar": hexToRgb(p.sidebar),
    "--hover": hexToRgb(p.hover),
    "--active": hexToRgb(p.active),
    "--border": hexToRgb(p.border),
    "--accent": hexToRgb(p.accent),
  };
}
