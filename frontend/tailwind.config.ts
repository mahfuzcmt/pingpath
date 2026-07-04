import type { Config } from "tailwindcss";

/**
 * Palette modeled on gps-server.net / gomax tracker UI:
 * flat, light, dense data SaaS. Primary = blue, surfaces = white/light gray,
 * status colors map to the platform's standard fleet states.
 */
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
        brand: {
          50: "#E8F1FB",
          100: "#C6DDF4",
          400: "#5AA3DF",
          500: "#2B82D4", // primary action / link
          600: "#1F6AB1",
          700: "#175389",
          900: "#0E3257",
        },
        surface: {
          0: "#FFFFFF", // page / panel
          50: "#FAFAFA", // hover row
          100: "#F5F5F5", // divider, alt row, input bg
          200: "#EEEEEE", // disabled, hovered divider
          300: "#E5E5E5", // panel header, tertiary bg
          400: "#D9D9D9",
        },
        ink: {
          50: "#FFFFFF",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#CCCCCC",
          400: "#999999", // placeholder
          500: "#808080", // secondary text
          600: "#676767",
          700: "#555555",
          900: "#444444", // primary text
          950: "#222222",
        },
        status: {
          all: "#E5E5E5",
          moving: "#4DA74D",
          idle: "#9440ED",
          stopped: "#CB4B4B",
          offline: "#AFD8F8",
          expired: "#6B7280",
          nodata: "#EDC240",
        },
        alarm: {
          red: "#CB4B4B",
          amber: "#EDC240",
          green: "#4DA74D",
        },
      },
      fontFamily: {
        sans: ["var(--font-open-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-open-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        bn: ["var(--font-hind-siliguri)", "var(--font-open-sans)", "sans-serif"],
      },
      fontSize: {
        // gomax/gps-server.net base = 11px; we use 12px for slightly better legibility on modern displays
        xxs: ["10px", "12px"],
        xs: ["11px", "14px"],
        sm: ["12px", "16px"],
        base: ["13px", "18px"],
        md: ["14px", "20px"],
      },
      boxShadow: {
        panel: "0 1px 3px 0 rgba(0,0,0,0.06)",
        menu: "0 0 5px 0 rgba(0,0,0,0.18)",
        topbar: "0 1px 0 0 #E5E5E5",
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "3px",
        lg: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
