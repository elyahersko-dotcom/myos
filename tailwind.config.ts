import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // DeerCo brand cyan — remaps existing `indigo-*` accents app-wide
        indigo: {
          300: "#5ff0e2",   // bright accent (light)
          400: "#00e5cc",   // BRAND bright — accent text, icons, active states, borders
          500: "#0a9e90",   // button hover (deep enough for white text)
          600: "#0b8578",   // button base (deep enough for white text)
          700: "#0a6f65",
          900: "#053b36",
        },
        brand: {
          DEFAULT: "#00e5cc",
          dark: "#0a0c12",
          card: "#0f1319",
        },
      },
    },
  },
  plugins: [],
};
export default config;
