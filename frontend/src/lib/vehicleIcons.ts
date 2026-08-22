// AutoNemo-style realistic top-down vehicle icons for fleet tracking.
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
 * AutoNemo-style realistic top-down vehicle icons.
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

  // Get the appropriate vehicle SVG
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
 * Sedan/Car - Top-down view with realistic proportions
 */
function buildCarIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="car_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${dark}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${dark}"/>
        </linearGradient>
        <filter id="car_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 20, 20)" filter="url(#car_shadow_${id})">
        <!-- Car body (sedan shape) -->
        <path d="M14 6 L26 6 Q30 6 30 10 L30 30 Q30 34 26 34 L14 34 Q10 34 10 30 L10 10 Q10 6 14 6 Z"
              fill="url(#car_body_${id})" stroke="${dark}" stroke-width="0.5"/>

        <!-- Hood (front) -->
        <path d="M12 8 L28 8 Q29 8 29 9 L29 12 L11 12 L11 9 Q11 8 12 8 Z"
              fill="${light}" opacity="0.3"/>

        <!-- Windshield -->
        <rect x="13" y="12" width="14" height="6" rx="1" fill="#1a2634" opacity="0.85"/>

        <!-- Roof -->
        <rect x="13" y="18" width="14" height="8" rx="1" fill="${light}" opacity="0.2"/>

        <!-- Rear window -->
        <rect x="13" y="26" width="14" height="4" rx="1" fill="#1a2634" opacity="0.75"/>

        <!-- Front headlights -->
        <rect x="12" y="7" width="3" height="2" rx="0.5" fill="#fff" opacity="0.9"/>
        <rect x="25" y="7" width="3" height="2" rx="0.5" fill="#fff" opacity="0.9"/>

        <!-- Rear lights -->
        <rect x="12" y="32" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>
        <rect x="25" y="32" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>

        <!-- Side mirrors -->
        <ellipse cx="9" cy="14" rx="1.5" ry="1" fill="${dark}"/>
        <ellipse cx="31" cy="14" rx="1.5" ry="1" fill="${dark}"/>

        <!-- Direction arrow indicator -->
        <path d="M20 3 L17 7 L20 5.5 L23 7 Z" fill="#fff" stroke="${dark}" stroke-width="0.3"/>
      </g>
    </svg>`;
}

/**
 * Microbus/Van - Taller, boxier top-down view
 */
function buildMicrobusIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="microbus_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${dark}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${dark}"/>
        </linearGradient>
        <filter id="microbus_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 20, 20)" filter="url(#microbus_shadow_${id})">
        <!-- Microbus body (rectangular with rounded front) -->
        <path d="M12 5 L28 5 Q32 5 32 9 L32 32 Q32 36 28 36 L12 36 Q8 36 8 32 L8 9 Q8 5 12 5 Z"
              fill="url(#microbus_body_${id})" stroke="${dark}" stroke-width="0.5"/>

        <!-- Large front windshield -->
        <rect x="10" y="7" width="20" height="8" rx="2" fill="#1a2634" opacity="0.85"/>

        <!-- Roof section -->
        <rect x="10" y="15" width="20" height="14" rx="1" fill="${light}" opacity="0.15"/>

        <!-- Side windows (3 rows) -->
        <rect x="10" y="16" width="4" height="4" rx="0.5" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="16" width="4" height="4" rx="0.5" fill="#1a2634" opacity="0.6"/>
        <rect x="10" y="21" width="4" height="4" rx="0.5" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="21" width="4" height="4" rx="0.5" fill="#1a2634" opacity="0.6"/>
        <rect x="10" y="26" width="4" height="4" rx="0.5" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="26" width="4" height="4" rx="0.5" fill="#1a2634" opacity="0.6"/>

        <!-- Rear window -->
        <rect x="12" y="31" width="16" height="3" rx="1" fill="#1a2634" opacity="0.7"/>

        <!-- Front lights -->
        <rect x="10" y="5.5" width="4" height="2" rx="0.5" fill="#fff" opacity="0.9"/>
        <rect x="26" y="5.5" width="4" height="2" rx="0.5" fill="#fff" opacity="0.9"/>

        <!-- Rear lights -->
        <rect x="10" y="34.5" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>
        <rect x="27" y="34.5" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>

        <!-- Direction arrow -->
        <path d="M20 2 L16 6 L20 4 L24 6 Z" fill="#fff" stroke="${dark}" stroke-width="0.3"/>
      </g>
    </svg>`;
}

/**
 * Bus - Long rectangular top-down view
 */
function buildBusIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bus_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${dark}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${dark}"/>
        </linearGradient>
        <filter id="bus_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 20, 20)" filter="url(#bus_shadow_${id})">
        <!-- Bus body (long rectangle) -->
        <rect x="10" y="3" width="20" height="34" rx="3"
              fill="url(#bus_body_${id})" stroke="${dark}" stroke-width="0.5"/>

        <!-- Front windshield -->
        <rect x="12" y="5" width="16" height="5" rx="1.5" fill="#1a2634" opacity="0.85"/>

        <!-- Roof stripe -->
        <rect x="12" y="11" width="16" height="20" rx="1" fill="${light}" opacity="0.1"/>

        <!-- Side windows (multiple) -->
        <rect x="11" y="12" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="12" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="11" y="16" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="16" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="11" y="20" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="20" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="11" y="24" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="24" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="11" y="28" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>
        <rect x="26" y="28" width="3" height="3" rx="0.3" fill="#1a2634" opacity="0.6"/>

        <!-- Rear window -->
        <rect x="14" y="33" width="12" height="2.5" rx="0.5" fill="#1a2634" opacity="0.7"/>

        <!-- Front lights -->
        <rect x="11" y="3.5" width="3" height="1.5" rx="0.3" fill="#fff" opacity="0.9"/>
        <rect x="26" y="3.5" width="3" height="1.5" rx="0.3" fill="#fff" opacity="0.9"/>

        <!-- Rear lights -->
        <rect x="11" y="35.5" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>
        <rect x="26" y="35.5" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>

        <!-- Direction arrow -->
        <path d="M20 1 L16 4 L20 2.5 L24 4 Z" fill="#fff" stroke="${dark}" stroke-width="0.3"/>
      </g>
    </svg>`;
}

/**
 * Truck - With cargo bed
 */
function buildTruckIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="truck_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${dark}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${dark}"/>
        </linearGradient>
        <filter id="truck_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 20, 20)" filter="url(#truck_shadow_${id})">
        <!-- Truck cab -->
        <path d="M12 4 L28 4 Q31 4 31 7 L31 14 Q31 15 30 15 L10 15 Q9 15 9 14 L9 7 Q9 4 12 4 Z"
              fill="url(#truck_body_${id})" stroke="${dark}" stroke-width="0.5"/>

        <!-- Cab windshield -->
        <rect x="11" y="5.5" width="18" height="5" rx="1" fill="#1a2634" opacity="0.85"/>

        <!-- Cargo bed (container) -->
        <rect x="9" y="16" width="22" height="20" rx="1"
              fill="${darkenColor(color, 5)}" stroke="${dark}" stroke-width="0.5"/>

        <!-- Cargo bed ridges -->
        <line x1="9" y1="20" x2="31" y2="20" stroke="${dark}" stroke-width="0.3" opacity="0.5"/>
        <line x1="9" y1="24" x2="31" y2="24" stroke="${dark}" stroke-width="0.3" opacity="0.5"/>
        <line x1="9" y1="28" x2="31" y2="28" stroke="${dark}" stroke-width="0.3" opacity="0.5"/>
        <line x1="9" y1="32" x2="31" y2="32" stroke="${dark}" stroke-width="0.3" opacity="0.5"/>

        <!-- Front lights -->
        <rect x="10" y="4.5" width="4" height="1.5" rx="0.3" fill="#fff" opacity="0.9"/>
        <rect x="26" y="4.5" width="4" height="1.5" rx="0.3" fill="#fff" opacity="0.9"/>

        <!-- Rear lights -->
        <rect x="10" y="35" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>
        <rect x="27" y="35" width="3" height="1.5" rx="0.3" fill="#dc2626" opacity="0.9"/>

        <!-- Side mirrors -->
        <rect x="7" y="8" width="2" height="3" rx="0.5" fill="${dark}"/>
        <rect x="31" y="8" width="2" height="3" rx="0.5" fill="${dark}"/>

        <!-- Direction arrow -->
        <path d="M20 1 L16 4 L20 2.5 L24 4 Z" fill="#fff" stroke="${dark}" stroke-width="0.3"/>
      </g>
    </svg>`;
}

/**
 * Motorbike - Top-down view
 */
function buildMotorbikeIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 25);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bike_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${dark}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${dark}"/>
        </linearGradient>
        <filter id="bike_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 20, 20)" filter="url(#bike_shadow_${id})">
        <!-- Front wheel -->
        <ellipse cx="20" cy="8" rx="5" ry="3" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="20" cy="8" rx="3" ry="1.5" fill="#444"/>

        <!-- Bike body/frame -->
        <path d="M17 10 L23 10 L24 14 L26 18 L26 28 L24 32 L16 32 L14 28 L14 18 L16 14 Z"
              fill="url(#bike_body_${id})" stroke="${dark}" stroke-width="0.5"/>

        <!-- Seat -->
        <ellipse cx="20" cy="22" rx="4" ry="6" fill="#1a1a1a"/>
        <ellipse cx="20" cy="22" rx="3" ry="5" fill="#333"/>

        <!-- Handlebars -->
        <rect x="13" y="11" width="14" height="2" rx="1" fill="#555"/>
        <circle cx="13" cy="12" r="1.5" fill="#333"/>
        <circle cx="27" cy="12" r="1.5" fill="#333"/>

        <!-- Rear wheel -->
        <ellipse cx="20" cy="32" rx="5" ry="3" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="20" cy="32" rx="3" ry="1.5" fill="#444"/>

        <!-- Headlight -->
        <ellipse cx="20" cy="7" rx="2" ry="1" fill="#fff" opacity="0.9"/>

        <!-- Tail light -->
        <rect x="18" y="34" width="4" height="1" rx="0.3" fill="#dc2626" opacity="0.9"/>

        <!-- Direction arrow -->
        <path d="M20 3 L17 6 L20 4.5 L23 6 Z" fill="#fff" stroke="${dark}" stroke-width="0.3"/>
      </g>
    </svg>`;
}

/**
 * CNG/Auto-rickshaw - Three-wheeler top-down view
 */
function buildCngIcon(color: string, rotation: number, size: number, id: string): string {
  const dark = darkenColor(color, 20);
  const light = lightenColor(color, 15);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cng_body_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${dark}"/>
          <stop offset="50%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${dark}"/>
        </linearGradient>
        <filter id="cng_shadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      <g transform="rotate(${rotation}, 20, 20)" filter="url(#cng_shadow_${id})">
        <!-- Front wheel (single) -->
        <ellipse cx="20" cy="7" rx="3" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>

        <!-- CNG body (rounded cabin) -->
        <path d="M12 10 L28 10 Q32 10 32 14 L32 30 Q32 34 28 34 L12 34 Q8 34 8 30 L8 14 Q8 10 12 10 Z"
              fill="url(#cng_body_${id})" stroke="${dark}" stroke-width="0.5"/>

        <!-- Roof/Canopy -->
        <rect x="10" y="12" width="20" height="18" rx="3" fill="${light}" opacity="0.2"/>

        <!-- Front windshield area -->
        <rect x="12" y="11" width="16" height="6" rx="2" fill="#1a2634" opacity="0.75"/>

        <!-- Passenger area -->
        <rect x="12" y="18" width="16" height="10" rx="1" fill="#1a2634" opacity="0.4"/>

        <!-- Rear wheels (two) -->
        <ellipse cx="10" cy="32" rx="3" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
        <ellipse cx="30" cy="32" rx="3" ry="2" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>

        <!-- Handlebar -->
        <rect x="17" y="9" width="6" height="2" rx="1" fill="#555"/>

        <!-- Headlight -->
        <ellipse cx="20" cy="6" rx="2" ry="1" fill="#fff" opacity="0.9"/>

        <!-- Rear lights -->
        <rect x="9" y="33" width="2" height="1" rx="0.2" fill="#dc2626" opacity="0.9"/>
        <rect x="29" y="33" width="2" height="1" rx="0.2" fill="#dc2626" opacity="0.9"/>

        <!-- Direction arrow -->
        <path d="M20 3 L17 6 L20 4.5 L23 6 Z" fill="#fff" stroke="${dark}" stroke-width="0.3"/>
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
