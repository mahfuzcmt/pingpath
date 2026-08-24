// AutoNemo-style photorealistic top-down vehicle icons for fleet tracking.
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
// Makes icons taller and narrower for better road fitting
const ICON_ASPECT_RATIO = 1.4; // height = width * 1.4

/**
 * AutoNemo-style photorealistic top-down vehicle icons.
 * These rotate based on the vehicle's heading (0° = North, 90° = East, etc.)
 * Returns {svg, width, height} for proper icon sizing.
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

  // Calculate dimensions - taller and narrower
  const width = size;
  const height = Math.round(size * ICON_ASPECT_RATIO);

  switch (type) {
    case "CAR":
      return buildCarIcon(c, rotation, width, height, id);
    case "MICROBUS":
      return buildMicrobusIcon(c, rotation, width, height, id);
    case "BUS":
      return buildBusIcon(c, rotation, width, height, id);
    case "TRUCK":
      return buildTruckIcon(c, rotation, width, height, id);
    case "MOTORBIKE":
      return buildMotorbikeIcon(c, rotation, width, height, id);
    case "CNG":
      return buildCngIcon(c, rotation, width, height, id);
    default:
      return buildCarIcon(c, rotation, width, height, id);
  }
}

/** Get icon dimensions for a given base size */
export function getIconDimensions(size: number): { width: number; height: number } {
  return {
    width: size,
    height: Math.round(size * ICON_ASPECT_RATIO),
  };
}

/**
 * Sedan/Car - Photorealistic top-down view (taller aspect ratio)
 */
function buildCarIcon(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 20);
  const highlight = lightenColor(color, 40);

  // ViewBox is taller (36x56) for elongated car shape - center point is (18, 28)
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="car_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="20%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="80%" stop-color="${dark}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <linearGradient id="car_roof_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="30%" stop-color="${light}"/>
          <stop offset="70%" stop-color="${light}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <linearGradient id="glass_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a6fa5"/>
          <stop offset="50%" stop-color="#1e3a5f"/>
          <stop offset="100%" stop-color="#0f1f33"/>
        </linearGradient>
        <filter id="shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 18, 28)" filter="url(#shadow_${id})">
        <!-- Car body outline (narrower and taller) -->
        <path d="M10 3 Q8 3 7 5 L6 9 L6 47 Q6 51 10 51 L26 51 Q30 51 30 47 L30 9 L29 5 Q28 3 26 3 Z"
              fill="url(#car_body_${id})" stroke="${darker}" stroke-width="0.6"/>

        <!-- Hood section -->
        <path d="M9 5 L27 5 Q28 5 28 7 L28 12 Q28 13 27 13 L9 13 Q8 13 8 12 L8 7 Q8 5 9 5 Z"
              fill="${light}" opacity="0.4"/>

        <!-- Front bumper -->
        <rect x="9" y="3.5" width="18" height="1.8" rx="0.6" fill="${darker}"/>

        <!-- Windshield frame -->
        <path d="M9 13 L27 13 L26 14 L10 14 Z" fill="${darker}"/>

        <!-- Windshield glass -->
        <path d="M10 14 L26 14 L25 22 L11 22 Z" fill="url(#glass_${id})"/>
        <path d="M11 15 L16 15 L15.5 20 L11.5 20 Z" fill="rgba(255,255,255,0.15)"/>

        <!-- Roof -->
        <rect x="10" y="22" width="16" height="12" rx="1" fill="url(#car_roof_${id})"/>
        <rect x="12" y="23" width="12" height="10" rx="0.5" fill="${highlight}" opacity="0.2"/>

        <!-- Rear window frame -->
        <path d="M10 34 L26 34 L27 35 L9 35 Z" fill="${darker}"/>

        <!-- Rear window glass -->
        <path d="M11 35 L25 35 L26 44 L10 44 Z" fill="url(#glass_${id})"/>

        <!-- Trunk -->
        <path d="M9 44 L27 44 Q28 44 28 45 L28 49 Q28 50 27 50 L9 50 Q8 50 8 49 L8 45 Q8 44 9 44 Z"
              fill="${dark}" opacity="0.6"/>

        <!-- Rear bumper -->
        <rect x="9" y="50" width="18" height="1.8" rx="0.6" fill="${darker}"/>

        <!-- Headlights -->
        <ellipse cx="11" cy="4.5" rx="1.8" ry="1" fill="#fffef0"/>
        <ellipse cx="11" cy="4.5" rx="1.1" ry="0.6" fill="#ffffff"/>
        <ellipse cx="25" cy="4.5" rx="1.8" ry="1" fill="#fffef0"/>
        <ellipse cx="25" cy="4.5" rx="1.1" ry="0.6" fill="#ffffff"/>

        <!-- Tail lights -->
        <rect x="9" y="48" width="3.5" height="1.3" rx="0.4" fill="#ff3333"/>
        <rect x="9.4" y="48.2" width="1.2" height="0.8" rx="0.2" fill="#ff6666"/>
        <rect x="23.5" y="48" width="3.5" height="1.3" rx="0.4" fill="#ff3333"/>
        <rect x="25" y="48.2" width="1.2" height="0.8" rx="0.2" fill="#ff6666"/>

        <!-- Side mirrors -->
        <ellipse cx="5" cy="17" rx="1.8" ry="1.1" fill="${dark}"/>
        <ellipse cx="5" cy="17" rx="1" ry="0.6" fill="#333"/>
        <ellipse cx="31" cy="17" rx="1.8" ry="1.1" fill="${dark}"/>
        <ellipse cx="31" cy="17" rx="1" ry="0.6" fill="#333"/>

        <!-- Wheels (visible from top) -->
        <rect x="5" y="8" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>
        <rect x="28.5" y="8" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>
        <rect x="5" y="40" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>
        <rect x="28.5" y="40" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>

        <!-- Wheel rims -->
        <rect x="5.4" y="9" width="1.7" height="4" rx="0.4" fill="#444"/>
        <rect x="28.9" y="9" width="1.7" height="4" rx="0.4" fill="#444"/>
        <rect x="5.4" y="41" width="1.7" height="4" rx="0.4" fill="#444"/>
        <rect x="28.9" y="41" width="1.7" height="4" rx="0.4" fill="#444"/>
      </g>
    </svg>`;
}

/**
 * Microbus/Van - Realistic top-down view
 */
function buildMicrobusIcon(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 20);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="van_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="25%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="75%" stop-color="${dark}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <linearGradient id="van_glass_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a6fa5"/>
          <stop offset="100%" stop-color="#1e3a5f"/>
        </linearGradient>
        <filter id="van_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 18, 28)" filter="url(#van_shadow_${id})">
        <!-- Van body -->
        <path d="M8 2 L28 2 Q31 2 31 5 L31 51 Q31 54 28 54 L8 54 Q5 54 5 51 L5 5 Q5 2 8 2 Z"
              fill="url(#van_body_${id})" stroke="${darker}" stroke-width="0.6"/>

        <!-- Front bumper -->
        <rect x="7" y="2" width="22" height="2" rx="0.8" fill="${darker}"/>

        <!-- Large windshield -->
        <rect x="7" y="5" width="22" height="10" rx="1.2" fill="url(#van_glass_${id})"/>
        <rect x="8" y="6" width="9" height="8" rx="0.8" fill="rgba(255,255,255,0.12)"/>

        <!-- Roof with AC unit -->
        <rect x="7" y="15" width="22" height="28" rx="1" fill="${light}" opacity="0.3"/>
        <rect x="12" y="22" width="12" height="14" rx="1.5" fill="${dark}" opacity="0.4"/>
        <rect x="14" y="24" width="8" height="10" rx="1" fill="${darker}" opacity="0.3"/>

        <!-- Side windows -->
        <rect x="5.5" y="17" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="28" y="17" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="5.5" y="24" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="28" y="24" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="5.5" y="31" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="28" y="31" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="5.5" y="38" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>
        <rect x="28" y="38" width="2.5" height="5" rx="0.4" fill="url(#van_glass_${id})"/>

        <!-- Rear window -->
        <rect x="9" y="46" width="18" height="4" rx="0.8" fill="url(#van_glass_${id})"/>

        <!-- Rear bumper -->
        <rect x="7" y="52" width="22" height="2" rx="0.8" fill="${darker}"/>

        <!-- Headlights -->
        <rect x="7" y="3" width="4" height="1.8" rx="0.6" fill="#fffef0"/>
        <rect x="25" y="3" width="4" height="1.8" rx="0.6" fill="#fffef0"/>

        <!-- Tail lights -->
        <rect x="7" y="50" width="4" height="1.8" rx="0.4" fill="#ff3333"/>
        <rect x="25" y="50" width="4" height="1.8" rx="0.4" fill="#ff3333"/>

        <!-- Wheels -->
        <rect x="4" y="7" width="2.5" height="7" rx="0.8" fill="#1a1a1a"/>
        <rect x="29.5" y="7" width="2.5" height="7" rx="0.8" fill="#1a1a1a"/>
        <rect x="4" y="42" width="2.5" height="7" rx="0.8" fill="#1a1a1a"/>
        <rect x="29.5" y="42" width="2.5" height="7" rx="0.8" fill="#1a1a1a"/>
      </g>
    </svg>`;
}

/**
 * Bus - Long rectangular realistic top-down view
 */
function buildBusIcon(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 15);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bus_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="25%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="75%" stop-color="${dark}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <linearGradient id="bus_glass_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a6fa5"/>
          <stop offset="100%" stop-color="#1e3a5f"/>
        </linearGradient>
        <filter id="bus_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 18, 28)" filter="url(#bus_shadow_${id})">
        <!-- Bus body -->
        <rect x="7" y="1" width="22" height="54" rx="2.5" fill="url(#bus_body_${id})" stroke="${darker}" stroke-width="0.6"/>

        <!-- Front section -->
        <rect x="8" y="2" width="20" height="3" rx="0.8" fill="${light}" opacity="0.3"/>

        <!-- Large windshield -->
        <rect x="9" y="5" width="18" height="7" rx="1.2" fill="url(#bus_glass_${id})"/>
        <rect x="10" y="6" width="7" height="5" rx="0.4" fill="rgba(255,255,255,0.1)"/>

        <!-- Roof stripe -->
        <rect x="9" y="12" width="18" height="34" rx="0.8" fill="${light}" opacity="0.15"/>

        <!-- Side windows (many) -->
        ${[14, 19, 24, 29, 34, 39, 44].map(y => `
          <rect x="7.5" y="${y}" width="2.2" height="4" rx="0.3" fill="url(#bus_glass_${id})"/>
          <rect x="26.3" y="${y}" width="2.2" height="4" rx="0.3" fill="url(#bus_glass_${id})"/>
        `).join('')}

        <!-- Rear window -->
        <rect x="10" y="49" width="16" height="3" rx="0.8" fill="url(#bus_glass_${id})"/>

        <!-- Headlights -->
        <rect x="8" y="2" width="3" height="1.8" rx="0.4" fill="#fffef0"/>
        <rect x="25" y="2" width="3" height="1.8" rx="0.4" fill="#fffef0"/>

        <!-- Tail lights -->
        <rect x="8" y="52" width="4" height="1.8" rx="0.4" fill="#ff3333"/>
        <rect x="24" y="52" width="4" height="1.8" rx="0.4" fill="#ff3333"/>

        <!-- Wheels (dual rear) -->
        <rect x="5.5" y="7" width="2.2" height="6" rx="0.6" fill="#1a1a1a"/>
        <rect x="28.3" y="7" width="2.2" height="6" rx="0.6" fill="#1a1a1a"/>
        <rect x="4.5" y="43" width="3" height="7" rx="0.8" fill="#1a1a1a"/>
        <rect x="28.5" y="43" width="3" height="7" rx="0.8" fill="#1a1a1a"/>
      </g>
    </svg>`;
}

/**
 * Truck - With cargo container realistic view
 */
function buildTruckIcon(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 15);
  const containerColor = "#e8e8e8";
  const containerDark = "#cccccc";

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="truck_cab_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <linearGradient id="truck_container_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${containerDark}"/>
          <stop offset="50%" stop-color="${containerColor}"/>
          <stop offset="100%" stop-color="${containerDark}"/>
        </linearGradient>
        <linearGradient id="truck_glass_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a6fa5"/>
          <stop offset="100%" stop-color="#1e3a5f"/>
        </linearGradient>
        <filter id="truck_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 18, 28)" filter="url(#truck_shadow_${id})">
        <!-- Cargo container -->
        <rect x="6" y="16" width="24" height="36" rx="0.8" fill="url(#truck_container_${id})" stroke="#999" stroke-width="0.4"/>

        <!-- Container ridges -->
        <line x1="6" y1="24" x2="30" y2="24" stroke="#bbb" stroke-width="0.4"/>
        <line x1="6" y1="32" x2="30" y2="32" stroke="#bbb" stroke-width="0.4"/>
        <line x1="6" y1="40" x2="30" y2="40" stroke="#bbb" stroke-width="0.4"/>
        <line x1="6" y1="48" x2="30" y2="48" stroke="#bbb" stroke-width="0.4"/>

        <!-- Truck cab -->
        <path d="M8 2 L28 2 Q30 2 30 4 L30 15 L6 15 L6 4 Q6 2 8 2 Z"
              fill="url(#truck_cab_${id})" stroke="${darker}" stroke-width="0.6"/>

        <!-- Cab windshield -->
        <rect x="8" y="4" width="20" height="8" rx="0.8" fill="url(#truck_glass_${id})"/>
        <rect x="9" y="5" width="7" height="6" rx="0.4" fill="rgba(255,255,255,0.1)"/>

        <!-- Headlights -->
        <rect x="7" y="2.5" width="4" height="1.8" rx="0.4" fill="#fffef0"/>
        <rect x="25" y="2.5" width="4" height="1.8" rx="0.4" fill="#fffef0"/>

        <!-- Tail lights -->
        <rect x="7" y="50" width="4" height="1.8" rx="0.4" fill="#ff3333"/>
        <rect x="25" y="50" width="4" height="1.8" rx="0.4" fill="#ff3333"/>

        <!-- Side mirrors -->
        <rect x="3" y="7" width="2.5" height="4" rx="0.6" fill="${dark}"/>
        <rect x="30.5" y="7" width="2.5" height="4" rx="0.6" fill="${dark}"/>

        <!-- Front wheels -->
        <rect x="4.5" y="5" width="2.2" height="6" rx="0.6" fill="#1a1a1a"/>
        <rect x="29.3" y="5" width="2.2" height="6" rx="0.6" fill="#1a1a1a"/>

        <!-- Rear wheels (dual) -->
        <rect x="4" y="44" width="3" height="7" rx="0.8" fill="#1a1a1a"/>
        <rect x="29" y="44" width="3" height="7" rx="0.8" fill="#1a1a1a"/>
      </g>
    </svg>`;
}

/**
 * Motorbike - Realistic top-down view
 */
function buildMotorbikeIcon(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 30);
  const darker = darkenColor(color, 45);
  const light = lightenColor(color, 20);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bike_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <filter id="bike_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 18, 28)" filter="url(#bike_shadow_${id})">
        <!-- Front wheel -->
        <ellipse cx="18" cy="6" rx="5" ry="3" fill="#1a1a1a" stroke="#333" stroke-width="0.4"/>
        <ellipse cx="18" cy="6" rx="3.2" ry="1.8" fill="#333"/>
        <ellipse cx="18" cy="6" rx="1.6" ry="0.9" fill="#555"/>

        <!-- Front fender -->
        <ellipse cx="18" cy="8" rx="3.2" ry="1.2" fill="${color}"/>

        <!-- Handlebars -->
        <rect x="10" y="9" width="16" height="2" rx="1" fill="#444"/>
        <circle cx="10" cy="10" r="1.6" fill="#333"/>
        <circle cx="26" cy="10" r="1.6" fill="#333"/>
        <circle cx="10" cy="10" r="1" fill="#555"/>
        <circle cx="26" cy="10" r="1" fill="#555"/>

        <!-- Headlight -->
        <ellipse cx="18" cy="5" rx="2" ry="1" fill="#fffef0"/>
        <ellipse cx="18" cy="5" rx="1.2" ry="0.6" fill="#ffffff"/>

        <!-- Fuel tank -->
        <ellipse cx="18" cy="16" rx="4" ry="3.5" fill="url(#bike_body_${id})" stroke="${darker}" stroke-width="0.4"/>
        <ellipse cx="18" cy="15.5" rx="2.5" ry="2" fill="${light}" opacity="0.3"/>

        <!-- Seat -->
        <ellipse cx="18" cy="28" rx="4" ry="9" fill="#1a1a1a"/>
        <ellipse cx="18" cy="27" rx="3" ry="7" fill="#2a2a2a"/>
        <ellipse cx="18" cy="26" rx="2" ry="5" fill="#333"/>

        <!-- Engine block -->
        <rect x="14" y="19" width="8" height="5" rx="0.8" fill="#444"/>
        <rect x="15" y="20" width="6" height="3" rx="0.4" fill="#555"/>

        <!-- Rear body -->
        <path d="M14 38 L22 38 L24 44 L12 44 Z" fill="url(#bike_body_${id})"/>

        <!-- Tail light -->
        <rect x="15" y="43" width="6" height="1.3" rx="0.4" fill="#ff3333"/>

        <!-- Rear wheel -->
        <ellipse cx="18" cy="50" rx="5" ry="3" fill="#1a1a1a" stroke="#333" stroke-width="0.4"/>
        <ellipse cx="18" cy="50" rx="3.2" ry="1.8" fill="#333"/>
        <ellipse cx="18" cy="50" rx="1.6" ry="0.9" fill="#555"/>

        <!-- Rear fender -->
        <ellipse cx="18" cy="47" rx="3.2" ry="1.2" fill="${color}"/>

        <!-- Exhaust pipes -->
        <rect x="23" y="35" width="4" height="1.3" rx="0.4" fill="#666"/>
        <rect x="9" y="35" width="4" height="1.3" rx="0.4" fill="#666"/>
      </g>
    </svg>`;
}

/**
 * CNG/Auto-rickshaw - Three-wheeler realistic top-down view (taller aspect ratio)
 */
function buildCngIcon(color: string, rotation: number, width: number, height: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 20);

  // ViewBox is taller (36x56) for elongated shape - center point is (18, 28)
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 36 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cng_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <linearGradient id="cng_roof_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${dark}"/>
          <stop offset="50%" stop-color="${light}"/>
          <stop offset="100%" stop-color="${dark}"/>
        </linearGradient>
        <filter id="cng_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 18, 28)" filter="url(#cng_shadow_${id})">
        <!-- Front wheel (single) -->
        <ellipse cx="18" cy="5" rx="3.5" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="18" cy="5" rx="2" ry="1.2" fill="#333"/>

        <!-- Front fender -->
        <ellipse cx="18" cy="7" rx="2.5" ry="1" fill="${color}"/>

        <!-- Handlebar -->
        <rect x="13" y="8" width="10" height="1.8" rx="0.8" fill="#444"/>

        <!-- Headlight -->
        <ellipse cx="18" cy="4" rx="1.8" ry="0.9" fill="#fffef0"/>

        <!-- Body frame (elongated) -->
        <path d="M10 10 L26 10 Q29 10 29 13 L29 48 Q29 52 26 52 L10 52 Q7 52 7 48 L7 13 Q7 10 10 10 Z"
              fill="url(#cng_body_${id})" stroke="${darker}" stroke-width="0.6"/>

        <!-- Canopy/Roof -->
        <rect x="9" y="12" width="18" height="30" rx="1.5" fill="url(#cng_roof_${id})" opacity="0.4"/>

        <!-- Front opening (windshield area) -->
        <rect x="10" y="11" width="16" height="6" rx="1.2" fill="#1e3a5f" opacity="0.7"/>
        <rect x="11" y="12" width="6" height="4" rx="0.4" fill="rgba(255,255,255,0.1)"/>

        <!-- Passenger area -->
        <rect x="10" y="19" width="16" height="18" rx="0.8" fill="#1a2634" opacity="0.5"/>

        <!-- Seat -->
        <rect x="11" y="21" width="14" height="14" rx="1.5" fill="#333"/>
        <rect x="12" y="22" width="12" height="11" rx="1" fill="#444"/>

        <!-- Rear section -->
        <rect x="10" y="44" width="16" height="4" rx="0.8" fill="${dark}"/>

        <!-- Rear wheels (two) -->
        <ellipse cx="9" cy="50" rx="3.5" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="9" cy="50" rx="2" ry="1.2" fill="#333"/>
        <ellipse cx="27" cy="50" rx="3.5" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="27" cy="50" rx="2" ry="1.2" fill="#333"/>

        <!-- Rear fenders -->
        <ellipse cx="9" cy="48" rx="2.5" ry="0.8" fill="${color}"/>
        <ellipse cx="27" cy="48" rx="2.5" ry="0.8" fill="${color}"/>

        <!-- Tail lights -->
        <rect x="8" y="51" width="2.2" height="1" rx="0.3" fill="#ff3333"/>
        <rect x="25.8" y="51" width="2.2" height="1" rx="0.3" fill="#ff3333"/>
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
