/**
 * Brand tokens from CLAUDE.md §10.1 (mission-control dark theme).
 * Kept in one place so screens stay visually consistent with the web dashboard.
 */
export const colors = {
  brand: "#E8900A", // primary orange
  brandDim: "#7A4A05",

  bg: "#0A1928", // app background (ink.950)
  surface: "#0F2742", // cards (ink.900)
  surfaceAlt: "#13324f",
  border: "#1e3a5c",

  text: "#F1F5F9", // ink.50
  textDim: "#CBD5E1", // ink.100
  textFaint: "#64748B", // ink.400

  ok: "#16A34A",
  warn: "#F59E0B",
  danger: "#DC2626",
  offline: "#64748B",
} as const;

export const radius = { sm: 8, md: 12, lg: 16 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
