import type { Config } from "tailwindcss";

/**
 * MotoLink Design System
 * Professional GPS tracking platform with modern, sophisticated UI
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
          50: "#E6F4FF",
          100: "#BAE0FF",
          200: "#7CC4FA",
          300: "#4FAFEF",
          400: "#29A3EE", // Light cyan (logo top)
          500: "#0284C7", // Primary blue
          600: "#0369A1", // Primary hover
          700: "#075985",
          800: "#1B3A5F", // Navy blue (logo text)
          900: "#0C2340", // Darkest navy
        },
        // Accent colors for modern gradients
        accent: {
          cyan: "#22D3EE",   // Bright cyan
          sky: "#38BDF8",    // Sky blue
          blue: "#3B82F6",   // Blue
          navy: "#1B3A5F",   // Navy (logo)
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
          900: "#1F2937", // primary text (darker for contrast)
          950: "#111827",
        },
        status: {
          all: "#E5E5E5",
          moving: "#10B981",
          idle: "#8B5CF6",
          stopped: "#EF4444",
          offline: "#94A3B8",
          expired: "#6B7280",
          nodata: "#F59E0B",
        },
        alarm: {
          red: "#EF4444",
          amber: "#F59E0B",
          green: "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-open-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "var(--font-open-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        bn: ["var(--font-hind-siliguri)", "var(--font-open-sans)", "sans-serif"],
      },
      fontSize: {
        xxs: ["10px", "12px"],
        xs: ["11px", "14px"],
        sm: ["12px", "16px"],
        base: ["14px", "20px"],
        md: ["15px", "22px"],
        lg: ["18px", "28px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "32px"],
        "3xl": ["30px", "36px"],
        "4xl": ["36px", "40px"],
        "5xl": ["48px", "52px"],
        "6xl": ["60px", "64px"],
        "7xl": ["72px", "76px"],
      },
      boxShadow: {
        panel: "0 1px 3px 0 rgba(0,0,0,0.06)",
        menu: "0 0 5px 0 rgba(0,0,0,0.18)",
        topbar: "0 1px 0 0 #E5E5E5",
        // Modern marketing shadows
        "mkt-sm": "0 2px 8px -2px rgba(0,0,0,0.1)",
        "mkt-md": "0 4px 16px -4px rgba(0,0,0,0.1), 0 2px 8px -2px rgba(0,0,0,0.06)",
        "mkt-lg": "0 8px 32px -8px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.08)",
        "mkt-xl": "0 16px 48px -12px rgba(0,0,0,0.15), 0 8px 24px -8px rgba(0,0,0,0.1)",
        "mkt-glow": "0 0 40px -8px rgba(43,130,212,0.35)",
        "mkt-glow-lg": "0 0 80px -16px rgba(43,130,212,0.4)",
        // Glass UI shadows
        "glass": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)",
        "glass-inset": "inset 0 1px 0 0 rgba(255,255,255,0.1), inset 0 -1px 0 0 rgba(0,0,0,0.05)",
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "3px",
        lg: "4px",
        // Marketing border radius
        "mkt": "12px",
        "mkt-lg": "16px",
        "mkt-xl": "20px",
        "mkt-2xl": "24px",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "gradient": "gradient 8s ease infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #0A1928 0%, #0E3257 50%, #0A1928 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
