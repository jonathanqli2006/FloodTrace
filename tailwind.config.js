/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "#2D7D6F", light: "#E8F4F1", mid: "rgba(45,125,111,0.2)" },
        navy: "#1B3A5C",
        flood: "#C62828",
        water: "#1565C0",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
