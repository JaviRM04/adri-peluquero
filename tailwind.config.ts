import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf6ee",
          100: "#f9e8cf",
          200: "#f3ce9b",
          300: "#ecac5e",
          400: "#e6903a",
          500: "#df7219",
          600: "#c55a14",
          700: "#a44214",
          800: "#843417",
          900: "#6c2d16",
          950: "#3c1408",
        },
      },
    },
  },
  plugins: [],
};

export default config;
