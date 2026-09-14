// Professional GPS tracking vehicle markers
// Realistic top-down vehicle views with direction indicators

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG", "MICROBUS"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#22c55e"; // Green for online/moving

// Status-based colors (matching ADL Moto Viewer style)
export const STATUS_COLORS = {
  moving: "#22c55e",    // Green - moving
  stopped: "#3b82f6",   // Blue - stopped/parked
  idle: "#f59e0b",      // Orange/amber - idle
  offline: "#6b7280",   // Gray - offline
};

/**
 * Get icon dimensions based on vehicle type
 */
export function getIconDimensions(size: number): { width: number; height: number } {
  return { width: size, height: size };
}

/**
 * Main function to build vehicle marker SVG.
 * Creates realistic top-down vehicle views.
 */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 40,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  const type = ((vehicleType ?? "CAR").toUpperCase()) as VehicleTypeId;

  switch (type) {
    case "MOTORBIKE":
      return buildMotorbike(color, rotation, size);
    case "TRUCK":
      return buildTruck(color, rotation, size);
    case "BUS":
    case "MICROBUS":
      return buildBus(color, rotation, size);
    case "CNG":
      return buildCng(color, rotation, size);
    case "CAR":
    default:
      return buildCar(color, rotation, size);
  }
}

/**
 * Realistic car - top-down sedan view
 */
function buildCar(color: string, rotation: number, size: number): string {
  const darker = darkenColor(color, 15);
  const lighter = lightenColor(color, 20);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="carShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
        <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${darker}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${darker}"/>
        </linearGradient>
        <linearGradient id="windshield" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87CEEB"/>
          <stop offset="100%" style="stop-color:#4A90D9"/>
        </linearGradient>
      </defs>
      <g transform="rotate(${rotation}, 24, 24)" filter="url(#carShadow)">
        <!-- Car body -->
        <path d="M18 8 L30 8 L32 14 L32 38 L30 42 L18 42 L16 38 L16 14 Z"
              fill="url(#carBody)" stroke="${darker}" stroke-width="1"/>

        <!-- Roof/cabin -->
        <rect x="19" y="18" width="10" height="14" rx="2" fill="${lighter}"/>

        <!-- Front windshield -->
        <path d="M19 14 L29 14 L29 19 L19 19 Z" fill="url(#windshield)" rx="1"/>

        <!-- Rear windshield -->
        <path d="M19 31 L29 31 L29 36 L19 36 Z" fill="url(#windshield)" rx="1"/>

        <!-- Headlights -->
        <rect x="18" y="9" width="4" height="2" rx="0.5" fill="#FFFDE7"/>
        <rect x="26" y="9" width="4" height="2" rx="0.5" fill="#FFFDE7"/>

        <!-- Taillights -->
        <rect x="18" y="40" width="4" height="2" rx="0.5" fill="#EF4444"/>
        <rect x="26" y="40" width="4" height="2" rx="0.5" fill="#EF4444"/>

        <!-- Side mirrors -->
        <ellipse cx="15" cy="20" rx="2" ry="1.5" fill="${darker}"/>
        <ellipse cx="33" cy="20" rx="2" ry="1.5" fill="${darker}"/>

        <!-- Direction indicator arrow -->
        <polygon points="24,3 21,8 27,8" fill="#ffffff" stroke="${darker}" stroke-width="0.5"/>
      </g>
    </svg>`;
}

/**
 * Realistic motorbike - top-down view
 */
function buildMotorbike(color: string, rotation: number, size: number): string {
  const darker = darkenColor(color, 20);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bikeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 24, 24)" filter="url(#bikeShadow)">
        <!-- Front wheel -->
        <ellipse cx="24" cy="10" rx="6" ry="3" fill="#333" stroke="#222" stroke-width="1"/>
        <ellipse cx="24" cy="10" rx="4" ry="2" fill="#555"/>

        <!-- Rear wheel -->
        <ellipse cx="24" cy="38" rx="6" ry="3" fill="#333" stroke="#222" stroke-width="1"/>
        <ellipse cx="24" cy="38" rx="4" ry="2" fill="#555"/>

        <!-- Frame/body -->
        <path d="M22 12 L22 36 L26 36 L26 12 Z" fill="${color}" stroke="${darker}" stroke-width="1"/>

        <!-- Fuel tank -->
        <ellipse cx="24" cy="22" rx="5" ry="4" fill="${color}" stroke="${darker}" stroke-width="1"/>

        <!-- Seat -->
        <ellipse cx="24" cy="30" rx="4" ry="3" fill="#1a1a1a"/>

        <!-- Handlebars -->
        <rect x="16" y="13" width="16" height="2" rx="1" fill="#333"/>
        <circle cx="16" cy="14" r="2" fill="#222"/>
        <circle cx="32" cy="14" r="2" fill="#222"/>

        <!-- Headlight -->
        <circle cx="24" cy="8" r="2" fill="#FFFDE7" stroke="#ddd" stroke-width="0.5"/>

        <!-- Taillight -->
        <rect x="22" y="40" width="4" height="2" rx="1" fill="#EF4444"/>

        <!-- Direction indicator -->
        <polygon points="24,2 21,7 27,7" fill="#ffffff" stroke="${darker}" stroke-width="0.5"/>
      </g>
    </svg>`;
}

/**
 * Realistic truck - top-down view
 */
function buildTruck(color: string, rotation: number, size: number): string {
  const darker = darkenColor(color, 15);
  const cabColor = darkenColor(color, 5);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="truckShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
        <linearGradient id="truckWindshield" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87CEEB"/>
          <stop offset="100%" style="stop-color:#4A90D9"/>
        </linearGradient>
      </defs>
      <g transform="rotate(${rotation}, 24, 24)" filter="url(#truckShadow)">
        <!-- Cargo container -->
        <rect x="14" y="16" width="20" height="26" rx="1" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="1"/>
        <line x1="14" y1="22" x2="34" y2="22" stroke="#9CA3AF" stroke-width="0.5"/>
        <line x1="14" y1="28" x2="34" y2="28" stroke="#9CA3AF" stroke-width="0.5"/>
        <line x1="14" y1="34" x2="34" y2="34" stroke="#9CA3AF" stroke-width="0.5"/>

        <!-- Cab -->
        <rect x="16" y="6" width="16" height="12" rx="2" fill="${cabColor}" stroke="${darker}" stroke-width="1"/>

        <!-- Windshield -->
        <rect x="18" y="7" width="12" height="5" rx="1" fill="url(#truckWindshield)"/>

        <!-- Front wheels -->
        <rect x="12" y="10" width="4" height="6" rx="1" fill="#333"/>
        <rect x="32" y="10" width="4" height="6" rx="1" fill="#333"/>

        <!-- Rear wheels (dual) -->
        <rect x="12" y="34" width="4" height="6" rx="1" fill="#333"/>
        <rect x="32" y="34" width="4" height="6" rx="1" fill="#333"/>
        <rect x="12" y="38" width="4" height="6" rx="1" fill="#333"/>
        <rect x="32" y="38" width="4" height="6" rx="1" fill="#333"/>

        <!-- Headlights -->
        <rect x="17" y="6" width="3" height="1.5" rx="0.5" fill="#FFFDE7"/>
        <rect x="28" y="6" width="3" height="1.5" rx="0.5" fill="#FFFDE7"/>

        <!-- Direction indicator -->
        <polygon points="24,1 21,5 27,5" fill="#ffffff" stroke="${darker}" stroke-width="0.5"/>
      </g>
    </svg>`;
}

/**
 * Realistic bus - top-down view
 */
function buildBus(color: string, rotation: number, size: number): string {
  const darker = darkenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="busShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
        <linearGradient id="busWindshield" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87CEEB"/>
          <stop offset="100%" style="stop-color:#4A90D9"/>
        </linearGradient>
      </defs>
      <g transform="rotate(${rotation}, 24, 24)" filter="url(#busShadow)">
        <!-- Bus body -->
        <rect x="14" y="4" width="20" height="40" rx="3" fill="${color}" stroke="${darker}" stroke-width="1"/>

        <!-- Windows row -->
        <rect x="16" y="8" width="16" height="4" rx="1" fill="url(#busWindshield)"/>
        <rect x="16" y="14" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="22" y="14" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="28" y="14" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="16" y="20" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="22" y="20" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="28" y="20" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="16" y="26" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="22" y="26" width="4" height="4" rx="0.5" fill="#87CEEB"/>
        <rect x="28" y="26" width="4" height="4" rx="0.5" fill="#87CEEB"/>

        <!-- Rear window -->
        <rect x="16" y="36" width="16" height="4" rx="1" fill="url(#busWindshield)"/>

        <!-- Wheels -->
        <rect x="11" y="10" width="4" height="6" rx="1" fill="#333"/>
        <rect x="33" y="10" width="4" height="6" rx="1" fill="#333"/>
        <rect x="11" y="32" width="4" height="6" rx="1" fill="#333"/>
        <rect x="33" y="32" width="4" height="6" rx="1" fill="#333"/>

        <!-- Headlights -->
        <rect x="15" y="4" width="4" height="2" rx="0.5" fill="#FFFDE7"/>
        <rect x="29" y="4" width="4" height="2" rx="0.5" fill="#FFFDE7"/>

        <!-- Taillights -->
        <rect x="15" y="42" width="4" height="2" rx="0.5" fill="#EF4444"/>
        <rect x="29" y="42" width="4" height="2" rx="0.5" fill="#EF4444"/>

        <!-- Direction indicator -->
        <polygon points="24,0 21,4 27,4" fill="#ffffff" stroke="${darker}" stroke-width="0.5"/>
      </g>
    </svg>`;
}

/**
 * Realistic CNG/Auto-rickshaw - top-down view
 */
function buildCng(color: string, rotation: number, size: number): string {
  const darker = darkenColor(color, 15);
  // CNG in Bangladesh is typically green and yellow
  const canopyColor = "#22c55e"; // Green canopy

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cngShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 24, 24)" filter="url(#cngShadow)">
        <!-- Rear body/passenger area -->
        <path d="M14 18 L34 18 L36 40 L12 40 Z" fill="${color}" stroke="${darker}" stroke-width="1"/>

        <!-- Canopy/roof -->
        <rect x="15" y="19" width="18" height="18" rx="2" fill="${canopyColor}" opacity="0.8"/>

        <!-- Front section -->
        <ellipse cx="24" cy="12" rx="8" ry="6" fill="${color}" stroke="${darker}" stroke-width="1"/>

        <!-- Windshield -->
        <ellipse cx="24" cy="10" rx="5" ry="3" fill="#87CEEB"/>

        <!-- Front wheel (single) -->
        <ellipse cx="24" cy="8" rx="3" ry="2" fill="#333"/>

        <!-- Rear wheels -->
        <ellipse cx="14" cy="38" rx="4" ry="2.5" fill="#333"/>
        <ellipse cx="34" cy="38" rx="4" ry="2.5" fill="#333"/>

        <!-- Handlebars -->
        <rect x="18" y="6" width="12" height="2" rx="1" fill="#333"/>

        <!-- Headlight -->
        <circle cx="24" cy="6" r="2" fill="#FFFDE7"/>

        <!-- Direction indicator -->
        <polygon points="24,1 21,5 27,5" fill="#ffffff" stroke="${darker}" stroke-width="0.5"/>
      </g>
    </svg>`;
}

/**
 * Simple directional arrow for minimal markers
 */
export function buildSimpleArrow(
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 32,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  const darker = darkenColor(color, 20);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="arrowShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 16, 16)" filter="url(#arrowShadow)">
        <!-- Arrow body pointing up -->
        <path d="M16 4 L24 16 L20 16 L20 26 L12 26 L12 16 L8 16 Z"
              fill="${color}" stroke="${darker}" stroke-width="1"/>
        <!-- Inner highlight -->
        <path d="M16 6 L22 15 L19 15 L19 24 L13 24 L13 15 L10 15 Z"
              fill="${lightenColor(color, 10)}" opacity="0.5"/>
      </g>
    </svg>`;
}

/**
 * Simplified pin marker
 */
export function buildSimplePin(
  bodyColor: string | null | undefined,
  size = 32,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  const darker = darkenColor(color, 15);

  return `
    <svg width="${size}" height="${Math.round(size * 1.25)}" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pin_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
        <radialGradient id="pinGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:${lightenColor(color, 20)}"/>
          <stop offset="100%" style="stop-color:${color}"/>
        </radialGradient>
      </defs>
      <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.15)"/>
      <path
        d="M16 1 C9 1 3 7 3 14 C3 22.5 16 37 16 37 C16 37 29 22.5 29 14 C29 7 23 1 16 1 Z"
        fill="url(#pinGradient)"
        stroke="${darker}"
        stroke-width="1"
        filter="url(#pin_shadow)"
      />
      <circle cx="16" cy="13" r="5" fill="rgba(255,255,255,0.9)"/>
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
