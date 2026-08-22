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

/**
 * AutoNemo-style photorealistic top-down vehicle icons.
 * These rotate based on the vehicle's heading (0° = North, 90° = East, etc.)
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

  switch (type) {
    case "CAR":
      return buildCarIcon(c, rotation, size, id);
    case "MICROBUS":
      return buildMicrobusIcon(c, rotation, size, id);
    case "BUS":
      return buildBusIcon(c, rotation, size, id);
    case "TRUCK":
      return buildTruckIcon(c, rotation, size, id);
    case "MOTORBIKE":
      return buildMotorbikeIcon(c, rotation, size, id);
    case "CNG":
      return buildCngIcon(c, rotation, size, id);
    default:
      return buildCarIcon(c, rotation, size, id);
  }
}

/**
 * Sedan/Car - Photorealistic top-down view
 */
function buildCarIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 20);
  const highlight = lightenColor(color, 40);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 24, 24)" filter="url(#shadow_${id})">
        <!-- Car body outline -->
        <path d="M16 4 Q14 4 13 6 L12 10 L12 38 Q12 42 16 42 L32 42 Q36 42 36 38 L36 10 L35 6 Q34 4 32 4 Z"
              fill="url(#car_body_${id})" stroke="${darker}" stroke-width="0.8"/>

        <!-- Hood section -->
        <path d="M14 6 L34 6 Q35 6 35 8 L35 13 Q35 14 34 14 L14 14 Q13 14 13 13 L13 8 Q13 6 14 6 Z"
              fill="${light}" opacity="0.4"/>

        <!-- Front bumper -->
        <rect x="14" y="4.5" width="20" height="2" rx="0.8" fill="${darker}"/>

        <!-- Windshield frame -->
        <path d="M14 14 L34 14 L33 15 L15 15 Z" fill="${darker}"/>

        <!-- Windshield glass -->
        <path d="M15 15 L33 15 L32 22 L16 22 Z" fill="url(#glass_${id})"/>
        <path d="M16 16 L22 16 L21.5 20 L16.5 20 Z" fill="rgba(255,255,255,0.15)"/>

        <!-- Roof -->
        <rect x="15" y="22" width="18" height="10" rx="1" fill="url(#car_roof_${id})"/>
        <rect x="17" y="23" width="14" height="8" rx="0.5" fill="${highlight}" opacity="0.2"/>

        <!-- Rear window frame -->
        <path d="M15 32 L33 32 L34 33 L14 33 Z" fill="${darker}"/>

        <!-- Rear window glass -->
        <path d="M16 33 L32 33 L33 38 L15 38 Z" fill="url(#glass_${id})"/>

        <!-- Trunk -->
        <path d="M14 38 L34 38 Q35 38 35 39 L35 41 Q35 42 34 42 L14 42 Q13 42 13 41 L13 39 Q13 38 14 38 Z"
              fill="${dark}" opacity="0.6"/>

        <!-- Rear bumper -->
        <rect x="14" y="41.5" width="20" height="2" rx="0.8" fill="${darker}"/>

        <!-- Headlights -->
        <ellipse cx="16" cy="5.5" rx="2" ry="1.2" fill="#fffef0"/>
        <ellipse cx="16" cy="5.5" rx="1.3" ry="0.8" fill="#ffffff"/>
        <ellipse cx="32" cy="5.5" rx="2" ry="1.2" fill="#fffef0"/>
        <ellipse cx="32" cy="5.5" rx="1.3" ry="0.8" fill="#ffffff"/>

        <!-- Tail lights -->
        <rect x="14" y="40" width="4" height="1.5" rx="0.5" fill="#ff3333"/>
        <rect x="14.5" y="40.2" width="1.5" height="1" rx="0.3" fill="#ff6666"/>
        <rect x="30" y="40" width="4" height="1.5" rx="0.5" fill="#ff3333"/>
        <rect x="32" y="40.2" width="1.5" height="1" rx="0.3" fill="#ff6666"/>

        <!-- Side mirrors -->
        <ellipse cx="11" cy="17" rx="2" ry="1.3" fill="${dark}"/>
        <ellipse cx="11" cy="17" rx="1.2" ry="0.8" fill="#333"/>
        <ellipse cx="37" cy="17" rx="2" ry="1.3" fill="${dark}"/>
        <ellipse cx="37" cy="17" rx="1.2" ry="0.8" fill="#333"/>

        <!-- Wheels (visible from top) -->
        <rect x="11" y="9" width="3" height="6" rx="1" fill="#1a1a1a"/>
        <rect x="34" y="9" width="3" height="6" rx="1" fill="#1a1a1a"/>
        <rect x="11" y="33" width="3" height="6" rx="1" fill="#1a1a1a"/>
        <rect x="34" y="33" width="3" height="6" rx="1" fill="#1a1a1a"/>

        <!-- Wheel rims -->
        <rect x="11.5" y="10" width="2" height="4" rx="0.5" fill="#444"/>
        <rect x="34.5" y="10" width="2" height="4" rx="0.5" fill="#444"/>
        <rect x="11.5" y="34" width="2" height="4" rx="0.5" fill="#444"/>
        <rect x="34.5" y="34" width="2" height="4" rx="0.5" fill="#444"/>
      </g>
    </svg>`;
}

/**
 * Microbus/Van - Realistic top-down view
 */
function buildMicrobusIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 20);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 24, 24)" filter="url(#van_shadow_${id})">
        <!-- Van body -->
        <path d="M13 3 L35 3 Q38 3 38 6 L38 42 Q38 45 35 45 L13 45 Q10 45 10 42 L10 6 Q10 3 13 3 Z"
              fill="url(#van_body_${id})" stroke="${darker}" stroke-width="0.8"/>

        <!-- Front bumper -->
        <rect x="12" y="3" width="24" height="2.5" rx="1" fill="${darker}"/>

        <!-- Large windshield -->
        <rect x="12" y="6" width="24" height="10" rx="1.5" fill="url(#van_glass_${id})"/>
        <rect x="13" y="7" width="10" height="8" rx="1" fill="rgba(255,255,255,0.12)"/>

        <!-- Roof with AC unit -->
        <rect x="12" y="16" width="24" height="20" rx="1" fill="${light}" opacity="0.3"/>
        <rect x="18" y="20" width="12" height="12" rx="2" fill="${dark}" opacity="0.4"/>
        <rect x="20" y="22" width="8" height="8" rx="1" fill="${darker}" opacity="0.3"/>

        <!-- Side windows -->
        <rect x="10.5" y="18" width="3" height="5" rx="0.5" fill="url(#van_glass_${id})"/>
        <rect x="34.5" y="18" width="3" height="5" rx="0.5" fill="url(#van_glass_${id})"/>
        <rect x="10.5" y="24" width="3" height="5" rx="0.5" fill="url(#van_glass_${id})"/>
        <rect x="34.5" y="24" width="3" height="5" rx="0.5" fill="url(#van_glass_${id})"/>
        <rect x="10.5" y="30" width="3" height="5" rx="0.5" fill="url(#van_glass_${id})"/>
        <rect x="34.5" y="30" width="3" height="5" rx="0.5" fill="url(#van_glass_${id})"/>

        <!-- Rear window -->
        <rect x="14" y="38" width="20" height="4" rx="1" fill="url(#van_glass_${id})"/>

        <!-- Rear bumper -->
        <rect x="12" y="42.5" width="24" height="2.5" rx="1" fill="${darker}"/>

        <!-- Headlights -->
        <rect x="12" y="4" width="4" height="2" rx="0.8" fill="#fffef0"/>
        <rect x="32" y="4" width="4" height="2" rx="0.8" fill="#fffef0"/>

        <!-- Tail lights -->
        <rect x="12" y="42" width="4" height="2" rx="0.5" fill="#ff3333"/>
        <rect x="32" y="42" width="4" height="2" rx="0.5" fill="#ff3333"/>

        <!-- Wheels -->
        <rect x="9" y="8" width="3" height="7" rx="1" fill="#1a1a1a"/>
        <rect x="36" y="8" width="3" height="7" rx="1" fill="#1a1a1a"/>
        <rect x="9" y="33" width="3" height="7" rx="1" fill="#1a1a1a"/>
        <rect x="36" y="33" width="3" height="7" rx="1" fill="#1a1a1a"/>
      </g>
    </svg>`;
}

/**
 * Bus - Long rectangular realistic top-down view
 */
function buildBusIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 24, 24)" filter="url(#bus_shadow_${id})">
        <!-- Bus body -->
        <rect x="12" y="2" width="24" height="44" rx="3" fill="url(#bus_body_${id})" stroke="${darker}" stroke-width="0.8"/>

        <!-- Front section -->
        <rect x="13" y="3" width="22" height="3" rx="1" fill="${light}" opacity="0.3"/>

        <!-- Large windshield -->
        <rect x="14" y="6" width="20" height="6" rx="1.5" fill="url(#bus_glass_${id})"/>
        <rect x="15" y="7" width="8" height="4" rx="0.5" fill="rgba(255,255,255,0.1)"/>

        <!-- Roof stripe -->
        <rect x="14" y="12" width="20" height="26" rx="1" fill="${light}" opacity="0.15"/>

        <!-- Side windows (many) -->
        ${[14, 18, 22, 26, 30, 34].map(y => `
          <rect x="12.5" y="${y}" width="2.5" height="3" rx="0.3" fill="url(#bus_glass_${id})"/>
          <rect x="33" y="${y}" width="2.5" height="3" rx="0.3" fill="url(#bus_glass_${id})"/>
        `).join('')}

        <!-- Rear window -->
        <rect x="15" y="40" width="18" height="3" rx="1" fill="url(#bus_glass_${id})"/>

        <!-- Headlights -->
        <rect x="13" y="3" width="3" height="2" rx="0.5" fill="#fffef0"/>
        <rect x="32" y="3" width="3" height="2" rx="0.5" fill="#fffef0"/>

        <!-- Tail lights -->
        <rect x="13" y="43" width="4" height="2" rx="0.5" fill="#ff3333"/>
        <rect x="31" y="43" width="4" height="2" rx="0.5" fill="#ff3333"/>

        <!-- Wheels (dual rear) -->
        <rect x="11" y="8" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>
        <rect x="34.5" y="8" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>
        <rect x="10" y="34" width="3.5" height="7" rx="1" fill="#1a1a1a"/>
        <rect x="34.5" y="34" width="3.5" height="7" rx="1" fill="#1a1a1a"/>
      </g>
    </svg>`;
}

/**
 * Truck - With cargo container realistic view
 */
function buildTruckIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 15);
  const containerColor = "#e8e8e8";
  const containerDark = "#cccccc";

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 24, 24)" filter="url(#truck_shadow_${id})">
        <!-- Cargo container -->
        <rect x="11" y="16" width="26" height="28" rx="1" fill="url(#truck_container_${id})" stroke="#999" stroke-width="0.5"/>

        <!-- Container ridges -->
        <line x1="11" y1="22" x2="37" y2="22" stroke="#bbb" stroke-width="0.5"/>
        <line x1="11" y1="28" x2="37" y2="28" stroke="#bbb" stroke-width="0.5"/>
        <line x1="11" y1="34" x2="37" y2="34" stroke="#bbb" stroke-width="0.5"/>
        <line x1="11" y1="40" x2="37" y2="40" stroke="#bbb" stroke-width="0.5"/>

        <!-- Truck cab -->
        <path d="M13 4 L35 4 Q37 4 37 6 L37 15 L11 15 L11 6 Q11 4 13 4 Z"
              fill="url(#truck_cab_${id})" stroke="${darker}" stroke-width="0.8"/>

        <!-- Cab windshield -->
        <rect x="13" y="5" width="22" height="7" rx="1" fill="url(#truck_glass_${id})"/>
        <rect x="14" y="6" width="8" height="5" rx="0.5" fill="rgba(255,255,255,0.1)"/>

        <!-- Headlights -->
        <rect x="12" y="4" width="4" height="2" rx="0.5" fill="#fffef0"/>
        <rect x="32" y="4" width="4" height="2" rx="0.5" fill="#fffef0"/>

        <!-- Tail lights -->
        <rect x="12" y="42" width="4" height="2" rx="0.5" fill="#ff3333"/>
        <rect x="32" y="42" width="4" height="2" rx="0.5" fill="#ff3333"/>

        <!-- Side mirrors -->
        <rect x="8" y="8" width="3" height="4" rx="0.8" fill="${dark}"/>
        <rect x="37" y="8" width="3" height="4" rx="0.8" fill="${dark}"/>

        <!-- Front wheels -->
        <rect x="10" y="6" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>
        <rect x="35.5" y="6" width="2.5" height="6" rx="0.8" fill="#1a1a1a"/>

        <!-- Rear wheels (dual) -->
        <rect x="9" y="36" width="3.5" height="7" rx="1" fill="#1a1a1a"/>
        <rect x="35.5" y="36" width="3.5" height="7" rx="1" fill="#1a1a1a"/>
      </g>
    </svg>`;
}

/**
 * Motorbike - Realistic top-down view
 */
function buildMotorbikeIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 30);
  const darker = darkenColor(color, 45);
  const light = lightenColor(color, 20);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bike_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${darker}"/>
          <stop offset="50%" stop-color="${color}"/>
          <stop offset="100%" stop-color="${darker}"/>
        </linearGradient>
        <filter id="bike_shadow_${id}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 24, 24)" filter="url(#bike_shadow_${id})">
        <!-- Front wheel -->
        <ellipse cx="24" cy="8" rx="6" ry="3.5" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="24" cy="8" rx="4" ry="2" fill="#333"/>
        <ellipse cx="24" cy="8" rx="2" ry="1" fill="#555"/>

        <!-- Front fender -->
        <ellipse cx="24" cy="10" rx="4" ry="1.5" fill="${color}"/>

        <!-- Handlebars -->
        <rect x="15" y="11" width="18" height="2.5" rx="1.2" fill="#444"/>
        <circle cx="15" cy="12.2" r="2" fill="#333"/>
        <circle cx="33" cy="12.2" r="2" fill="#333"/>
        <circle cx="15" cy="12.2" r="1.2" fill="#555"/>
        <circle cx="33" cy="12.2" r="1.2" fill="#555"/>

        <!-- Headlight -->
        <ellipse cx="24" cy="7" rx="2.5" ry="1.2" fill="#fffef0"/>
        <ellipse cx="24" cy="7" rx="1.5" ry="0.7" fill="#ffffff"/>

        <!-- Fuel tank -->
        <ellipse cx="24" cy="17" rx="5" ry="3" fill="url(#bike_body_${id})" stroke="${darker}" stroke-width="0.5"/>
        <ellipse cx="24" cy="16.5" rx="3" ry="1.5" fill="${light}" opacity="0.3"/>

        <!-- Seat -->
        <ellipse cx="24" cy="26" rx="4.5" ry="7" fill="#1a1a1a"/>
        <ellipse cx="24" cy="25" rx="3.5" ry="5.5" fill="#2a2a2a"/>
        <ellipse cx="24" cy="24" rx="2.5" ry="4" fill="#333"/>

        <!-- Engine block -->
        <rect x="19" y="19" width="10" height="5" rx="1" fill="#444"/>
        <rect x="20" y="20" width="8" height="3" rx="0.5" fill="#555"/>

        <!-- Rear body -->
        <path d="M20 33 L28 33 L30 37 L18 37 Z" fill="url(#bike_body_${id})"/>

        <!-- Tail light -->
        <rect x="21" y="36" width="6" height="1.5" rx="0.5" fill="#ff3333"/>

        <!-- Rear wheel -->
        <ellipse cx="24" cy="40" rx="6" ry="3.5" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="24" cy="40" rx="4" ry="2" fill="#333"/>
        <ellipse cx="24" cy="40" rx="2" ry="1" fill="#555"/>

        <!-- Rear fender -->
        <ellipse cx="24" cy="38" rx="4" ry="1.5" fill="${color}"/>

        <!-- Exhaust pipes -->
        <rect x="29" y="30" width="5" height="1.5" rx="0.5" fill="#666"/>
        <rect x="14" y="30" width="5" height="1.5" rx="0.5" fill="#666"/>
      </g>
    </svg>`;
}

/**
 * CNG/Auto-rickshaw - Three-wheeler realistic top-down view
 */
function buildCngIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 25);
  const darker = darkenColor(color, 40);
  const light = lightenColor(color, 20);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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

      <g transform="rotate(${rotation}, 24, 24)" filter="url(#cng_shadow_${id})">
        <!-- Front wheel (single) -->
        <ellipse cx="24" cy="7" rx="4" ry="2.5" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="24" cy="7" rx="2.5" ry="1.5" fill="#333"/>

        <!-- Front fender -->
        <ellipse cx="24" cy="9" rx="3" ry="1.2" fill="${color}"/>

        <!-- Handlebar -->
        <rect x="19" y="10" width="10" height="2" rx="1" fill="#444"/>

        <!-- Headlight -->
        <ellipse cx="24" cy="6" rx="2" ry="1" fill="#fffef0"/>

        <!-- Body frame -->
        <path d="M13 12 L35 12 Q38 12 38 15 L38 38 Q38 42 35 42 L13 42 Q10 42 10 38 L10 15 Q10 12 13 12 Z"
              fill="url(#cng_body_${id})" stroke="${darker}" stroke-width="0.8"/>

        <!-- Canopy/Roof -->
        <rect x="12" y="14" width="24" height="22" rx="2" fill="url(#cng_roof_${id})" opacity="0.4"/>

        <!-- Front opening (windshield area) -->
        <rect x="14" y="13" width="20" height="7" rx="1.5" fill="#1e3a5f" opacity="0.7"/>
        <rect x="15" y="14" width="8" height="5" rx="0.5" fill="rgba(255,255,255,0.1)"/>

        <!-- Passenger area -->
        <rect x="14" y="22" width="20" height="14" rx="1" fill="#1a2634" opacity="0.5"/>

        <!-- Seat -->
        <rect x="15" y="24" width="18" height="10" rx="2" fill="#333"/>
        <rect x="16" y="25" width="16" height="8" rx="1.5" fill="#444"/>

        <!-- Rear section -->
        <rect x="14" y="38" width="20" height="3" rx="1" fill="${dark}"/>

        <!-- Rear wheels (two) -->
        <ellipse cx="12" cy="40" rx="4" ry="2.5" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="12" cy="40" rx="2.5" ry="1.5" fill="#333"/>
        <ellipse cx="36" cy="40" rx="4" ry="2.5" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="36" cy="40" rx="2.5" ry="1.5" fill="#333"/>

        <!-- Rear fenders -->
        <ellipse cx="12" cy="38" rx="3" ry="1" fill="${color}"/>
        <ellipse cx="36" cy="38" rx="3" ry="1" fill="${color}"/>

        <!-- Tail lights -->
        <rect x="11" y="41" width="2.5" height="1.2" rx="0.3" fill="#ff3333"/>
        <rect x="34.5" y="41" width="2.5" height="1.2" rx="0.3" fill="#ff3333"/>
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
