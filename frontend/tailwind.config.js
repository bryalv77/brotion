/** @type {import('tailwindcss').Config} */
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
          DEFAULT: "#37352f",
          light: "#5f5e5b",
          faint: "#75736f",
        },
        surface: {
          DEFAULT: "#ffffff",
          sidebar: "#f7f7f5",
          hover: "#efefed",
          active: "#e7e6e3",
        },
        // Flat aliases: the code uses text-inkLight, text-inkFaint, border-border, bg-danger.
        inkLight: "#5f5e5b",
        inkFaint: "#75736f",
        border: "#e9e9e7",
        danger: "#d44c47",
        accent: "#1a6fc4",
      },
    },
  },
  plugins: [],
};
