// Modern teardrop pin markers for fleet tracking.
// Inspired by professional GPS tracking UIs with glassy, 3D effects.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

// Vehicle type icons (simplified silhouettes for inside the pin)
const VEHICLE_SILHOUETTES: Record<VehicleTypeId, string> = {
  CAR: `<path d="M7 11h10l1-3H6l1 3zm-1 1v2h1v1h2v-1h6v1h2v-1h1v-2H6zm2-5h8l1.5 2H6.5L8 7z" fill="currentColor"/>`,
  MOTORBIKE: `<path d="M6 13a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zm-6-4l2-3h4l2 3H8zm2 1h4v2H10v-2z" fill="currentColor"/>`,
  TRUCK: `<path d="M4 9h6V7h8v6h-3v-2h-2v2H7v-2H5v2H4V9zm1 5h2v1H5v-1zm8 0h2v1h-2v-1z" fill="currentColor"/>`,
  BUS: `<path d="M5 7h14v8H5V7zm1 1v6h12V8H6zm1 1h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm-8 3h10v1H7v-1z" fill="currentColor"/>`,
  CNG: `<path d="M8 7l-2 4v4h2v1h2v-1h4v1h2v-1h2v-4l-2-4H8zm0 5a1 1 0 102 0 1 1 0 00-2 0zm6 0a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor"/>`,
};

// Helper functions to lighten/darken colors
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/** Generate unique ID for SVG gradients to avoid conflicts */
let iconIdCounter = 0;
function generateIconId(): string {
  return `pin${++iconIdCounter}`;
}

/**
 * Modern teardrop pin marker with glassy effect.
 * The pin has a 3D look with gradients, shadows, and a subtle glass reflection.
 */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 48,
): string {
  const c = bodyColor || DEFAULT_ICON_COLOR;
  const id = generateIconId();
  const type = (vehicleType ?? "CAR") as VehicleTypeId;
  const silhouette = VEHICLE_SILHOUETTES[type] ?? VEHICLE_SILHOUETTES.CAR;

  // Teardrop pin path (scaled for 48x60 viewBox, anchor at bottom point)
  // Original path was for 48x48, adjusting for bottom anchor
  return `
    <svg width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Main body gradient (top to bottom for 3D depth) -->
        <linearGradient id="pin_body_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${lightenColor(c, 25)}"/>
          <stop offset="50%" style="stop-color:${c}"/>
          <stop offset="100%" style="stop-color:${darkenColor(c, 20)}"/>
        </linearGradient>

        <!-- Glass reflection gradient -->
        <linearGradient id="pin_glass_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.6)"/>
          <stop offset="50%" style="stop-color:rgba(255,255,255,0.1)"/>
          <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
        </linearGradient>

        <!-- Inner shadow for depth -->
        <radialGradient id="pin_inner_${id}" cx="50%" cy="30%" r="60%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.3)"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.1)"/>
        </radialGradient>

        <!-- Drop shadow filter -->
        <filter id="pin_shadow_${id}" x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.35)"/>
        </filter>

        <!-- Glow filter for selected state -->
        <filter id="pin_glow_${id}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Ground shadow (ellipse at bottom) -->
      <ellipse cx="24" cy="57" rx="10" ry="3" fill="rgba(0,0,0,0.15)"/>

      <!-- Main teardrop pin shape -->
      <g filter="url(#pin_shadow_${id})">
        <!-- Pin body -->
        <path
          d="M24 2 C13.5 2 5 10.5 5 21 C5 33.5 24 55 24 55 C24 55 43 33.5 43 21 C43 10.5 34.5 2 24 2 Z"
          fill="url(#pin_body_${id})"
        />

        <!-- Glass highlight (top-left reflection) -->
        <path
          d="M24 4 C15 4 8 11 8 20 C8 26 14 34 20 42 C14 32 10 24 10 19 C10 11.5 16 5.5 24 5.5 C28 5.5 31.5 7 34 9.5 C31 6 27.5 4 24 4 Z"
          fill="url(#pin_glass_${id})"
        />

        <!-- Inner circle (icon container) -->
        <circle cx="24" cy="20" r="13" fill="rgba(255,255,255,0.95)"/>
        <circle cx="24" cy="20" r="12" fill="url(#pin_inner_${id})"/>

        <!-- Vehicle silhouette icon -->
        <g transform="translate(12, 8)" style="color: ${darkenColor(c, 10)}">
          ${silhouette}
        </g>

        <!-- Subtle border/outline -->
        <path
          d="M24 2 C13.5 2 5 10.5 5 21 C5 33.5 24 55 24 55 C24 55 43 33.5 43 21 C43 10.5 34.5 2 24 2 Z"
          fill="none"
          stroke="${darkenColor(c, 15)}"
          stroke-width="0.5"
          opacity="0.5"
        />
      </g>
    </svg>`;
}

/**
 * Simplified pin for smaller sizes or performance-critical scenarios.
 */
export function buildSimplePin(
  bodyColor: string | null | undefined,
  size = 32,
): string {
  const c = bodyColor || DEFAULT_ICON_COLOR;
  const id = generateIconId();

  return `
    <svg width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spin_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${lightenColor(c, 20)}"/>
          <stop offset="100%" style="stop-color:${darkenColor(c, 15)}"/>
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.12)"/>
      <path
        d="M16 1 C9 1 3 7 3 14 C3 22.5 16 37 16 37 C16 37 29 22.5 29 14 C29 7 23 1 16 1 Z"
        fill="url(#spin_${id})"
        stroke="${darkenColor(c, 20)}"
        stroke-width="0.5"
      />
      <circle cx="16" cy="13" r="7" fill="rgba(255,255,255,0.9)"/>
      <circle cx="16" cy="13" r="3" fill="${c}"/>
    </svg>`;
}

/**
 * Direction arrow indicator (for showing heading/course).
 * Used alongside or within markers to show vehicle direction.
 */
export function buildDirectionArrow(
  rotation: number,
  color: string = "#fff",
  size = 16,
): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
         style="transform: rotate(${rotation}deg)">
      <path
        d="M12 2L8 10h3v10h2V10h3L12 2z"
        fill="${color}"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="0.5"
      />
    </svg>`;
}

// Export color utilities for external use
export { lightenColor, darkenColor };