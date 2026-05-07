import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CLAUDE.md §10.1
        brand: {
          50: "#FFF6E6",
          500: "#E8900A",
          900: "#7A4A05",
        },
        ink: {
          50: "#F1F5F9",
          100: "#CBD5E1",
          400: "#64748B",
          900: "#0F2742",
          950: "#0A1928",
        },
        alarm: {
          red: "#DC2626",
          amber: "#F59E0B",
          green: "#16A34A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-familjen)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        bn: ["var(--font-hind-siliguri)", "var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
