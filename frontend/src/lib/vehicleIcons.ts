// GPS Tracking style vehicle markers - simple directional arrows like GPSWox/Traccar
// These icons rotate with the vehicle's heading direction.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG", "MICROBUS"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

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
  return `v${++iconIdCounter}`;
}

// Aspect ratio for vehicle icons (height:width ratio)
const ICON_ASPECT_RATIO = 1.4;

/**
 * Get icon dimensions for a given base size
 */
export function getIconDimensions(size: number): { width: number; height: number } {
  return {
    width: size,
    height: Math.round(size * ICON_ASPECT_RATIO),
  };
}

/**
 * GPSWox/Traccar style directional arrow markers.
 * Simple, clean markers that work well on maps.
 * Returns SVG string for the marker.
 */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 40,
): string {
  const c = bodyColor || DEFAULT_ICON_COLOR;
  const id = generateIconId();
  const type = ((vehicleType ?? "CAR").toUpperCase()) as VehicleTypeId;

  // Calculate dimensions
  const width = size;
  const height = Math.round(size * ICON_ASPECT_RATIO);

  // Use simple arrow style for all vehicle types (like GPSWox/Traccar)
  // Different vehicle types get slightly different arrow shapes
  switch (type) {
    case "MOTORBIKE":
      return buildMotorbikeArrow(c, rotation, width, height, id);
    case "TRUCK":
      return buildTruckArrow(c, rotation, width, height, id);
    case "BUS":
    case "MICROBUS":
      return buildBusArrow(c, rotation, width, height, id);
    case "CNG":
      return buildCngArrow(c, rotation, width, height, id);
    case "CAR":
    default:
      return buildCarArrow(c, rotation, width, height, id);
  }
}

/**
 * Car - Arrow with rounded body shape (sedan silhouette)
 */
function buildCarArrow(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="car_grad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <filter id="car_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 12, 16)" filter="url(#car_shadow_${id})">
        <!-- Arrow body (car shape) -->
        <path d="M12 2 L18 10 L17 10 L17 26 Q17 28 15 28 L9 28 Q7 28 7 26 L7 10 L6 10 Z"
              fill="url(#car_grad_${id})" stroke="${dark}" stroke-width="0.8"/>
        <!-- Windshield -->
        <path d="M9 11 L15 11 L14.5 15 L9.5 15 Z" fill="#1e3a5f" opacity="0.8"/>
        <!-- Roof highlight -->
        <rect x="9.5" y="15" width="5" height="4" rx="0.5" fill="${light}" opacity="0.3"/>
        <!-- Rear window -->
        <path d="M9.5 20 L14.5 20 L15 24 L9 24 Z" fill="#1e3a5f" opacity="0.6"/>
        <!-- Headlights -->
        <circle cx="9" cy="4" r="1.2" fill="#fffef0"/>
        <circle cx="15" cy="4" r="1.2" fill="#fffef0"/>
        <!-- Tail lights -->
        <rect x="8" y="26" width="2" height="1.2" rx="0.3" fill="#ff3333"/>
        <rect x="14" y="26" width="2" height="1.2" rx="0.3" fill="#ff3333"/>
      </g>
    </svg>`;
}

/**
 * Motorbike - Narrow arrow shape
 */
function buildMotorbikeArrow(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 25);
  const light = lightenColor(color, 15);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bike_grad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <filter id="bike_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 12, 16)" filter="url(#bike_shadow_${id})">
        <!-- Arrow body (bike shape - narrow) -->
        <path d="M12 2 L16 9 L14.5 9 L14.5 27 Q14.5 28 13 28 L11 28 Q9.5 28 9.5 27 L9.5 9 L8 9 Z"
              fill="url(#bike_grad_${id})" stroke="${dark}" stroke-width="0.8"/>
        <!-- Handlebar -->
        <rect x="8" y="8" width="8" height="1.5" rx="0.5" fill="#444"/>
        <!-- Seat -->
        <ellipse cx="12" cy="18" rx="2" ry="5" fill="#222"/>
        <!-- Front wheel hint -->
        <ellipse cx="12" cy="4" rx="2.5" ry="1.2" fill="#333"/>
        <!-- Rear wheel hint -->
        <ellipse cx="12" cy="27" rx="2.5" ry="1.2" fill="#333"/>
        <!-- Headlight -->
        <circle cx="12" cy="3" r="1" fill="#fffef0"/>
        <!-- Tail light -->
        <rect x="10.5" y="27" width="3" height="1" rx="0.3" fill="#ff3333"/>
      </g>
    </svg>`;
}

/**
 * Truck - Box shape with cab
 */
function buildTruckArrow(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 20);
  const containerColor = "#e0e0e0";
  const containerDark = "#bbb";

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="truck_cab_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <linearGradient id="truck_box_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${containerDark}"/>
          <stop offset="50%" stop-color="${containerColor}"/>
          <stop offset="100%" stop-color="${containerDark}"/>
        </linearGradient>
        <filter id="truck_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 12, 16)" filter="url(#truck_shadow_${id})">
        <!-- Cargo box -->
        <rect x="6" y="12" width="12" height="16" rx="1" fill="url(#truck_box_${id})" stroke="#999" stroke-width="0.5"/>
        <!-- Box ridges -->
        <line x1="6" y1="17" x2="18" y2="17" stroke="#ccc" stroke-width="0.5"/>
        <line x1="6" y1="22" x2="18" y2="22" stroke="#ccc" stroke-width="0.5"/>
        <!-- Cab with arrow point -->
        <path d="M12 2 L17 8 L17 12 L7 12 L7 8 Z"
              fill="url(#truck_cab_${id})" stroke="${dark}" stroke-width="0.8"/>
        <!-- Windshield -->
        <rect x="8" y="4" width="8" height="5" rx="0.5" fill="#1e3a5f" opacity="0.8"/>
        <!-- Headlights -->
        <rect x="8" y="3" width="2" height="1" rx="0.3" fill="#fffef0"/>
        <rect x="14" y="3" width="2" height="1" rx="0.3" fill="#fffef0"/>
        <!-- Tail lights -->
        <rect x="7" y="26" width="2.5" height="1.2" rx="0.3" fill="#ff3333"/>
        <rect x="14.5" y="26" width="2.5" height="1.2" rx="0.3" fill="#ff3333"/>
      </g>
    </svg>`;
}

/**
 * Bus - Long rectangular shape
 */
function buildBusArrow(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 10);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bus_grad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <filter id="bus_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 12, 16)" filter="url(#bus_shadow_${id})">
        <!-- Bus body with arrow front -->
        <path d="M12 2 L18 8 L18 28 Q18 29 17 29 L7 29 Q6 29 6 28 L6 8 Z"
              fill="url(#bus_grad_${id})" stroke="${dark}" stroke-width="0.8"/>
        <!-- Front windshield -->
        <rect x="7.5" y="4" width="9" height="5" rx="0.8" fill="#1e3a5f" opacity="0.8"/>
        <!-- Roof stripe -->
        <rect x="7" y="9" width="10" height="16" rx="0.5" fill="${light}" opacity="0.2"/>
        <!-- Side windows -->
        <rect x="6.5" y="11" width="1.5" height="3" rx="0.3" fill="#1e3a5f" opacity="0.7"/>
        <rect x="16" y="11" width="1.5" height="3" rx="0.3" fill="#1e3a5f" opacity="0.7"/>
        <rect x="6.5" y="16" width="1.5" height="3" rx="0.3" fill="#1e3a5f" opacity="0.7"/>
        <rect x="16" y="16" width="1.5" height="3" rx="0.3" fill="#1e3a5f" opacity="0.7"/>
        <rect x="6.5" y="21" width="1.5" height="3" rx="0.3" fill="#1e3a5f" opacity="0.7"/>
        <rect x="16" y="21" width="1.5" height="3" rx="0.3" fill="#1e3a5f" opacity="0.7"/>
        <!-- Rear window -->
        <rect x="8" y="25" width="8" height="2.5" rx="0.5" fill="#1e3a5f" opacity="0.6"/>
        <!-- Headlights -->
        <rect x="8" y="3" width="2" height="1" rx="0.3" fill="#fffef0"/>
        <rect x="14" y="3" width="2" height="1" rx="0.3" fill="#fffef0"/>
        <!-- Tail lights -->
        <rect x="7" y="27.5" width="2.5" height="1" rx="0.3" fill="#ff3333"/>
        <rect x="14.5" y="27.5" width="2.5" height="1" rx="0.3" fill="#ff3333"/>
      </g>
    </svg>`;
}

/**
 * CNG/Auto-rickshaw - Three-wheeler shape
 */
function buildCngArrow(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cng_grad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <filter id="cng_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 12, 16)" filter="url(#cng_shadow_${id})">
        <!-- Front wheel (single) -->
        <ellipse cx="12" cy="4" rx="2" ry="1" fill="#333"/>
        <!-- Body with canopy -->
        <path d="M12 5 L17 10 L17 26 Q17 28 15 28 L9 28 Q7 28 7 26 L7 10 Z"
              fill="url(#cng_grad_${id})" stroke="${dark}" stroke-width="0.8"/>
        <!-- Canopy/roof -->
        <rect x="8" y="10" width="8" height="12" rx="1" fill="${light}" opacity="0.3"/>
        <!-- Front opening -->
        <rect x="8.5" y="8" width="7" height="4" rx="0.5" fill="#1e3a5f" opacity="0.7"/>
        <!-- Passenger area -->
        <rect x="8.5" y="14" width="7" height="8" rx="0.5" fill="#1a2634" opacity="0.5"/>
        <!-- Seat -->
        <rect x="9" y="15" width="6" height="6" rx="0.8" fill="#333"/>
        <!-- Rear wheels (two) -->
        <ellipse cx="8" cy="27" rx="2" ry="1" fill="#333"/>
        <ellipse cx="16" cy="27" rx="2" ry="1" fill="#333"/>
        <!-- Headlight -->
        <circle cx="12" cy="3.5" r="1" fill="#fffef0"/>
        <!-- Tail lights -->
        <rect x="7.5" y="27" width="1.5" height="0.8" rx="0.2" fill="#ff3333"/>
        <rect x="15" y="27" width="1.5" height="0.8" rx="0.2" fill="#ff3333"/>
      </g>
    </svg>`;
}

/**
 * Simple directional arrow (classic GPS tracker style).
 * Use this for a minimal, clean look.
 */
export function buildSimpleArrow(
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 24,
): string {
  const c = bodyColor || DEFAULT_ICON_COLOR;
  const dark = darkenColor(c, 20);
  const id = generateIconId();

  const height = Math.round(size * 1.3);

  return `
    <svg width="${size}" height="${height}" viewBox="0 0 20 26" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="arrow_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${c}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <filter id="arr_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <g transform="rotate(${rotation}, 10, 13)" filter="url(#arr_shadow_${id})">
        <path d="M10 2 L17 12 L14 12 L14 24 L6 24 L6 12 L3 12 Z"
              fill="url(#arrow_${id})" stroke="${dark}" stroke-width="0.8"/>
        <path d="M10 4 L14 11 L12.5 11 L12.5 22 L7.5 22 L7.5 11 L6 11 Z"
              fill="${lightenColor(c, 15)}" opacity="0.3"/>
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

// Export color utilities for external use
export { lightenColor, darkenColor };
