// GPSBot/ADL Moto Viewer style vehicle markers
// Simple circular icons with vehicle silhouettes and direction indicators

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG", "MICROBUS"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#22c55e"; // Green for online/moving (like reference app)

// Status-based colors (matching reference app)
export const STATUS_COLORS = {
  moving: "#22c55e",    // Green - moving
  stopped: "#3b82f6",   // Blue - stopped/parked
  idle: "#f59e0b",      // Orange/amber - idle
  offline: "#6b7280",   // Gray - offline
};

/**
 * Get icon dimensions - circular icons are square
 */
export function getIconDimensions(size: number): { width: number; height: number } {
  return { width: size, height: size };
}

/**
 * Main function to build vehicle marker SVG.
 * Creates circular icons with vehicle silhouettes like GPSBot/ADL Moto Viewer.
 */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 32,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  const type = ((vehicleType ?? "CAR").toUpperCase()) as VehicleTypeId;

  // Get the vehicle silhouette path based on type
  const silhouette = getVehicleSilhouette(type);

  return buildCircularMarker(color, rotation, size, silhouette);
}

/**
 * Build circular marker with direction indicator and vehicle silhouette
 */
function buildCircularMarker(
  color: string,
  rotation: number,
  size: number,
  silhouettePath: string,
): string {
  const viewBox = 40; // Internal viewBox size
  const center = viewBox / 2;
  const radius = 15;

  // Direction indicator arrow at top
  const arrowSize = 6;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>

      <!-- Rotate entire marker based on heading -->
      <g transform="rotate(${rotation}, ${center}, ${center})">
        <!-- Direction arrow at top -->
        <polygon
          points="${center},${center - radius - arrowSize} ${center - 4},${center - radius + 1} ${center + 4},${center - radius + 1}"
          fill="${color}"
          filter="url(#shadow)"
        />

        <!-- Main circular body -->
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="${color}"
          stroke="#ffffff"
          stroke-width="2"
          filter="url(#shadow)"
        />

        <!-- Vehicle silhouette (white, centered, not rotating with marker) -->
        <g transform="rotate(${-rotation}, ${center}, ${center})">
          ${silhouettePath}
        </g>
      </g>
    </svg>`;
}

/**
 * Get vehicle silhouette SVG path for each vehicle type
 * These are simple white icons centered in the circle
 */
function getVehicleSilhouette(type: VehicleTypeId): string {
  const center = 20;

  switch (type) {
    case "MOTORBIKE":
      // Simple motorcycle icon
      return `
        <g fill="#ffffff" transform="translate(${center - 6}, ${center - 8})">
          <ellipse cx="6" cy="3" rx="2" ry="1.5"/>
          <rect x="5" y="4" width="2" height="8" rx="0.5"/>
          <ellipse cx="6" cy="13" rx="3" ry="2"/>
          <rect x="3" y="6" width="6" height="1.5" rx="0.5"/>
        </g>`;

    case "TRUCK":
      // Simple truck icon
      return `
        <g fill="#ffffff" transform="translate(${center - 7}, ${center - 7})">
          <rect x="2" y="1" width="10" height="6" rx="1"/>
          <rect x="0" y="7" width="14" height="8" rx="1"/>
          <circle cx="3" cy="14" r="1.5" fill="#ffffff"/>
          <circle cx="11" cy="14" r="1.5" fill="#ffffff"/>
        </g>`;

    case "BUS":
    case "MICROBUS":
      // Simple bus icon
      return `
        <g fill="#ffffff" transform="translate(${center - 6}, ${center - 8})">
          <rect x="0" y="0" width="12" height="14" rx="2"/>
          <rect x="1" y="1" width="10" height="4" rx="0.5" fill="#000000" opacity="0.2"/>
          <rect x="1" y="6" width="4" height="3" rx="0.3" fill="#000000" opacity="0.2"/>
          <rect x="7" y="6" width="4" height="3" rx="0.3" fill="#000000" opacity="0.2"/>
          <circle cx="2.5" cy="14" r="1.5"/>
          <circle cx="9.5" cy="14" r="1.5"/>
        </g>`;

    case "CNG":
      // Simple auto-rickshaw/CNG icon
      return `
        <g fill="#ffffff" transform="translate(${center - 6}, ${center - 7})">
          <circle cx="6" cy="2" r="2"/>
          <path d="M2 4 L10 4 L11 10 L1 10 Z"/>
          <rect x="1" y="10" width="10" height="3" rx="0.5"/>
          <circle cx="2" cy="13" r="1.5"/>
          <circle cx="10" cy="13" r="1.5"/>
        </g>`;

    case "CAR":
    default:
      // Simple car icon (default)
      return `
        <g fill="#ffffff" transform="translate(${center - 6}, ${center - 7})">
          <rect x="1" y="4" width="10" height="8" rx="2"/>
          <path d="M2 4 L4 1 L8 1 L10 4" fill="#ffffff"/>
          <rect x="2" y="1.5" width="8" height="3" rx="0.5" fill="#000000" opacity="0.15"/>
          <circle cx="3" cy="12" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/>
        </g>`;
  }
}

/**
 * Simple directional arrow for minimal markers
 */
export function buildSimpleArrow(
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 24,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  return buildCircularMarker(color, rotation, size, getVehicleSilhouette("CAR"));
}

/**
 * Simplified pin marker
 */
export function buildSimplePin(
  bodyColor: string | null | undefined,
  size = 32,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;

  return `
    <svg width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pin_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.12)"/>
      <path
        d="M16 1 C9 1 3 7 3 14 C3 22.5 16 37 16 37 C16 37 29 22.5 29 14 C29 7 23 1 16 1 Z"
        fill="${color}"
        stroke="#ffffff"
        stroke-width="1.5"
        filter="url(#pin_shadow)"
      />
      <circle cx="16" cy="13" r="6" fill="rgba(255,255,255,0.9)"/>
    </svg>`;
}

// Helper functions for color manipulation
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

export { lightenColor, darkenColor };
