/** @type {import('tailwindcss').Config} */
// Values come from CSS variables set at the app root (lib/theme.ts applyPalette).
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: v("ink"),
          light: v("ink-light"),
          faint: v("ink-faint"),
        },
        surface: {
          DEFAULT: v("bg"),
          sidebar: v("sidebar"),
          hover: v("hover"),
          active: v("active"),
        },
        // Flat aliases: the code uses text-inkLight, text-inkFaint, border-border, bg-danger.
        inkLight: v("ink-light"),
        inkFaint: v("ink-faint"),
        border: v("border"),
        danger: "#d44c47",
        accent: v("accent"),
      },
    },
  },
  plugins: [],
};
