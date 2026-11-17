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
        accent: "#1a6fc4",
      },
    },
  },
  plugins: [],
};
