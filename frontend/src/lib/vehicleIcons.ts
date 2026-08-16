// Professional 3D isometric vehicle icons for fleet tracking map markers.
// Each icon has smooth gradients, realistic details, and shadows.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

// SVG gradient definitions (injected once per icon)
const GRADIENTS = (c: string, id: string) => `
  <defs>
    <linearGradient id="body_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${lightenColor(c, 20)}"/>
      <stop offset="100%" style="stop-color:${c}"/>
    </linearGradient>
    <linearGradient id="side_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${darkenColor(c, 20)}"/>
      <stop offset="100%" style="stop-color:${c}"/>
    </linearGradient>
    <linearGradient id="glass_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E0F2FE"/>
      <stop offset="30%" style="stop-color:#BAE6FD"/>
      <stop offset="100%" style="stop-color:#7DD3FC"/>
    </linearGradient>
    <linearGradient id="wheel_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4a4a4a"/>
      <stop offset="100%" style="stop-color:#1a1a1a"/>
    </linearGradient>
  </defs>
`;

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

// Vehicle icons - 3D isometric style
export const VEHICLE_BODY: Record<VehicleTypeId, (c: string, id: string) => string> = {
  // Car: 3D isometric sedan
  CAR: (c, id) => `
    ${GRADIENTS(c, id)}
    <!-- Shadow -->
    <ellipse cx="40" cy="58" rx="28" ry="5" fill="rgba(0,0,0,0.15)"/>
    <g transform="translate(0, -2)">
      <!-- Underbody -->
      <path d="M12 46 L68 46 L70 50 L70 54 L10 54 L10 50 Z" fill="#1E3A5F"/>
      <!-- Body main -->
      <path d="M14 38 L66 38 L68 46 L12 46 Z" fill="url(#body_${id})"/>
      <!-- Body side (3D depth) -->
      <path d="M10 46 L12 38 L12 46 L10 54 Z" fill="url(#side_${id})"/>
      <!-- Roof section -->
      <path d="M20 26 L60 26 L64 32 L66 38 L14 38 L16 32 Z" fill="url(#body_${id})"/>
      <!-- Roof top highlight -->
      <path d="M22 24 L58 24 L60 26 L20 26 Z" fill="${lightenColor(c, 30)}"/>
      <!-- Front windshield -->
      <path d="M18 32 L24 24 L56 24 L62 32 Z" fill="url(#glass_${id})"/>
      <path d="M20 31 L25 25 L55 25 L60 31 Z" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>
      <!-- Side windows -->
      <rect x="24" y="28" width="12" height="8" rx="1.5" fill="url(#glass_${id})"/>
      <rect x="38" y="28" width="12" height="8" rx="1.5" fill="url(#glass_${id})"/>
      <!-- Window divider -->
      <rect x="36" y="28" width="2" height="8" fill="${c}"/>
      <!-- Headlights -->
      <ellipse cx="16" cy="42" rx="3" ry="2" fill="#FFFDE7"/>
      <ellipse cx="16" cy="42" rx="2" ry="1.2" fill="#fff"/>
      <ellipse cx="64" cy="42" rx="3" ry="2" fill="#FFFDE7"/>
      <!-- Taillights -->
      <rect x="64" y="40" width="3" height="4" rx="1" fill="#EF4444"/>
      <!-- Grill -->
      <rect x="18" y="40" width="14" height="3" rx="1" fill="#1E3A5F"/>
      <!-- Front wheels -->
      <ellipse cx="22" cy="52" rx="7" ry="4" fill="url(#wheel_${id})"/>
      <ellipse cx="22" cy="52" rx="4.5" ry="2.5" fill="#333"/>
      <ellipse cx="22" cy="52" rx="2.5" ry="1.4" fill="#666"/>
      <!-- Rear wheels -->
      <ellipse cx="58" cy="52" rx="7" ry="4" fill="url(#wheel_${id})"/>
      <ellipse cx="58" cy="52" rx="4.5" ry="2.5" fill="#333"/>
      <ellipse cx="58" cy="52" rx="2.5" ry="1.4" fill="#666"/>
      <!-- Door handle -->
      <rect x="30" y="40" width="4" height="1.5" rx="0.75" fill="${darkenColor(c, 15)}"/>
      <!-- Side mirror -->
      <ellipse cx="13" cy="32" rx="2" ry="1.5" fill="#333"/>
    </g>`,

  // Motorbike: 3D isometric motorcycle
  MOTORBIKE: (c, id) => `
    ${GRADIENTS(c, id)}
    <ellipse cx="40" cy="56" rx="28" ry="4" fill="rgba(0,0,0,0.15)"/>
    <g transform="translate(0, 0)">
      <!-- Rear wheel -->
      <ellipse cx="58" cy="48" rx="10" ry="6" fill="#1a1a1a"/>
      <ellipse cx="58" cy="48" rx="7" ry="4" fill="#333"/>
      <ellipse cx="58" cy="48" rx="4" ry="2.3" fill="#555"/>
      <ellipse cx="58" cy="48" rx="2" ry="1.1" fill="#777"/>
      <!-- Front wheel -->
      <ellipse cx="22" cy="48" rx="10" ry="6" fill="#1a1a1a"/>
      <ellipse cx="22" cy="48" rx="7" ry="4" fill="#333"/>
      <ellipse cx="22" cy="48" rx="4" ry="2.3" fill="#555"/>
      <ellipse cx="22" cy="48" rx="2" ry="1.1" fill="#777"/>
      <!-- Fork -->
      <path d="M22 42 L26 30" stroke="#555" stroke-width="3" stroke-linecap="round"/>
      <!-- Frame -->
      <path d="M26 30 L38 28 L50 32 L58 42" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M38 28 L42 42 L50 42" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
      <!-- Engine block -->
      <rect x="36" y="38" width="14" height="10" rx="2" fill="#2D4A6F"/>
      <rect x="38" y="40" width="10" height="6" rx="1" fill="#3D5A7F"/>
      <ellipse cx="52" cy="44" rx="2" ry="3" fill="#444"/>
      <!-- Fuel tank -->
      <ellipse cx="38" cy="28" rx="10" ry="5" fill="url(#body_${id})"/>
      <ellipse cx="38" cy="27" rx="7" ry="3" fill="${lightenColor(c, 25)}"/>
      <path d="M32 28 Q38 24 44 28" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.4"/>
      <!-- Seat -->
      <path d="M42 26 Q52 22 58 28 L58 34 Q50 30 42 32 Z" fill="#222"/>
      <!-- Handlebar -->
      <path d="M26 28 L20 22" stroke="#444" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 28 L32 22" stroke="#444" stroke-width="3" stroke-linecap="round"/>
      <circle cx="20" cy="22" r="2.5" fill="#333"/>
      <circle cx="32" cy="22" r="2.5" fill="#333"/>
      <!-- Headlight -->
      <ellipse cx="20" cy="36" rx="4" ry="3" fill="#FFFDE7"/>
      <ellipse cx="20" cy="36" rx="2.5" ry="1.8" fill="#fff"/>
      <!-- Exhaust -->
      <path d="M56 44 L66 46 Q68 46 68 48 L68 50 L56 48" fill="#666"/>
      <!-- Taillight -->
      <rect x="58" y="30" width="3" height="2" rx="0.5" fill="#EF4444"/>
    </g>`,

  // Truck: 3D isometric cargo truck
  TRUCK: (c, id) => `
    ${GRADIENTS(c, id)}
    <ellipse cx="40" cy="58" rx="32" ry="5" fill="rgba(0,0,0,0.15)"/>
    <g transform="translate(-4, -2)">
      <!-- Container -->
      <rect x="30" y="20" width="44" height="30" rx="2" fill="#90A4AE"/>
      <rect x="32" y="22" width="40" height="26" fill="#B0BEC5"/>
      <!-- Container ridges -->
      <line x1="42" y1="22" x2="42" y2="48" stroke="#78909C" stroke-width="1.5"/>
      <line x1="52" y1="22" x2="52" y2="48" stroke="#78909C" stroke-width="1.5"/>
      <line x1="62" y1="22" x2="62" y2="48" stroke="#78909C" stroke-width="1.5"/>
      <!-- Container shadow -->
      <rect x="30" y="46" width="44" height="4" fill="#607D8B"/>
      <!-- Cab body -->
      <path d="M10 30 L30 30 L30 54 L10 54 Z" fill="url(#body_${id})"/>
      <path d="M8 32 L10 30 L10 54 L8 52 Z" fill="url(#side_${id})"/>
      <!-- Cab roof -->
      <path d="M10 24 L28 24 L30 30 L10 30 Z" fill="${lightenColor(c, 25)}"/>
      <rect x="12" y="22" width="14" height="3" rx="1" fill="${c}"/>
      <!-- Windshield -->
      <path d="M12 26 L26 26 L28 30 L12 30 Z" fill="url(#glass_${id})"/>
      <!-- Side window -->
      <rect x="12" y="32" width="10" height="8" rx="1.5" fill="url(#glass_${id})"/>
      <!-- Door -->
      <rect x="14" y="32" width="12" height="18" rx="1" fill="none" stroke="${darkenColor(c, 15)}" stroke-width="1"/>
      <rect x="22" y="40" width="3" height="1.5" rx="0.5" fill="${darkenColor(c, 15)}"/>
      <!-- Headlights -->
      <circle cx="12" cy="46" r="2.5" fill="#FFFDE7"/>
      <circle cx="12" cy="46" r="1.5" fill="#fff"/>
      <circle cx="22" cy="46" r="2.5" fill="#FFFDE7"/>
      <!-- Grill -->
      <rect x="12" y="42" width="12" height="3" rx="1" fill="#1E3A5F"/>
      <!-- Bumper -->
      <rect x="8" y="50" width="24" height="3" rx="1" fill="#444"/>
      <!-- Front wheel -->
      <ellipse cx="20" cy="54" rx="7" ry="4" fill="url(#wheel_${id})"/>
      <ellipse cx="20" cy="54" rx="4.5" ry="2.5" fill="#333"/>
      <ellipse cx="20" cy="54" rx="2" ry="1.1" fill="#666"/>
      <!-- Rear wheels (dual) -->
      <ellipse cx="42" cy="54" rx="6" ry="3.5" fill="url(#wheel_${id})"/>
      <ellipse cx="42" cy="54" rx="3.5" ry="2" fill="#333"/>
      <ellipse cx="52" cy="54" rx="6" ry="3.5" fill="url(#wheel_${id})"/>
      <ellipse cx="52" cy="54" rx="3.5" ry="2" fill="#333"/>
      <ellipse cx="64" cy="54" rx="6" ry="3.5" fill="url(#wheel_${id})"/>
      <ellipse cx="64" cy="54" rx="3.5" ry="2" fill="#333"/>
      <!-- Side mirror -->
      <ellipse cx="6" cy="32" rx="2.5" ry="2" fill="#333"/>
    </g>`,

  // Bus: 3D isometric passenger bus (blue theme)
  BUS: (c, id) => `
    ${GRADIENTS(c, id)}
    <ellipse cx="40" cy="58" rx="32" ry="5" fill="rgba(0,0,0,0.15)"/>
    <g transform="translate(-2, -2)">
      <!-- Main body -->
      <rect x="8" y="18" width="64" height="34" rx="4" fill="url(#body_${id})"/>
      <!-- Side depth -->
      <path d="M6 20 L8 18 L8 52 L6 50 Z" fill="url(#side_${id})"/>
      <!-- Bottom trim -->
      <rect x="8" y="46" width="64" height="6" fill="#1E3A5F"/>
      <!-- Roof -->
      <rect x="10" y="16" width="60" height="4" rx="2" fill="${lightenColor(c, 15)}"/>
      <path d="M12 14 L68 14 L70 16 L10 16 Z" fill="${lightenColor(c, 30)}"/>
      <!-- Front windshield -->
      <path d="M10 20 L22 20 L22 36 L10 36 Z" fill="url(#glass_${id})"/>
      <path d="M12 22 L20 22 L20 34 L12 34 Z" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
      <path d="M12 22 L18 34" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <!-- Side windows -->
      <rect x="26" y="22" width="10" height="12" rx="1.5" fill="url(#glass_${id})"/>
      <rect x="38" y="22" width="10" height="12" rx="1.5" fill="url(#glass_${id})"/>
      <rect x="50" y="22" width="10" height="12" rx="1.5" fill="url(#glass_${id})"/>
      <rect x="62" y="22" width="8" height="12" rx="1.5" fill="url(#glass_${id})"/>
      <!-- Window reflections -->
      <path d="M28 24 L32 32" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <path d="M40 24 L44 32" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <path d="M52 24 L56 32" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
      <!-- Door -->
      <rect x="24" y="22" width="1.5" height="24" fill="${darkenColor(c, 30)}"/>
      <!-- Destination display -->
      <rect x="12" y="17" width="18" height="3" rx="1" fill="#1E293B"/>
      <rect x="13" y="17.5" width="16" height="2" rx="0.5" fill="#FDE047" opacity="0.8"/>
      <!-- Headlights -->
      <ellipse cx="12" cy="42" rx="2.5" ry="2" fill="#FFFDE7"/>
      <ellipse cx="12" cy="42" rx="1.5" ry="1" fill="#fff"/>
      <ellipse cx="18" cy="42" rx="2.5" ry="2" fill="#FFFDE7"/>
      <!-- Taillights -->
      <rect x="68" y="40" width="3" height="4" rx="1" fill="#EF4444"/>
      <!-- Indicator -->
      <rect x="10" y="38" width="4" height="2" rx="0.5" fill="#FDE047"/>
      <!-- Grill -->
      <rect x="12" y="44" width="10" height="2" rx="0.5" fill="#1E3A5F"/>
      <!-- Front wheel -->
      <ellipse cx="20" cy="52" rx="8" ry="4.5" fill="url(#wheel_${id})"/>
      <ellipse cx="20" cy="52" rx="5" ry="2.8" fill="#333"/>
      <ellipse cx="20" cy="52" rx="2.5" ry="1.4" fill="#666"/>
      <!-- Rear wheel -->
      <ellipse cx="60" cy="52" rx="8" ry="4.5" fill="url(#wheel_${id})"/>
      <ellipse cx="60" cy="52" rx="5" ry="2.8" fill="#333"/>
      <ellipse cx="60" cy="52" rx="2.5" ry="1.4" fill="#666"/>
      <!-- Side mirror -->
      <rect x="4" y="26" width="3" height="5" rx="1" fill="#1E3A5F"/>
      <!-- Wheel arch trim -->
      <path d="M12 48 Q20 44 28 48" fill="none" stroke="${darkenColor(c, 25)}" stroke-width="2"/>
      <path d="M52 48 Q60 44 68 48" fill="none" stroke="${darkenColor(c, 25)}" stroke-width="2"/>
    </g>`,

  // CNG/Auto-rickshaw: 3D isometric three-wheeler (green theme)
  CNG: (c, id) => `
    ${GRADIENTS(c, id)}
    <ellipse cx="40" cy="56" rx="26" ry="4" fill="rgba(0,0,0,0.15)"/>
    <g transform="translate(0, 0)">
      <!-- Main body -->
      <path d="M24 28 L60 28 L64 52 L20 52 Z" fill="url(#body_${id})"/>
      <!-- Side depth -->
      <path d="M20 52 L24 28 L22 30 L18 52 Z" fill="url(#side_${id})"/>
      <!-- Canopy -->
      <path d="M26 18 L58 18 L60 28 L24 28 Z" fill="url(#body_${id})"/>
      <path d="M24 28 L26 18 L24 20 L22 28 Z" fill="url(#side_${id})"/>
      <!-- Canopy top -->
      <path d="M28 16 L56 16 L58 18 L26 18 Z" fill="${lightenColor(c, 30)}"/>
      <!-- Front section -->
      <path d="M16 34 L24 28 L24 52 L16 46 Z" fill="url(#body_${id})"/>
      <path d="M14 36 L16 34 L16 46 L14 44 Z" fill="url(#side_${id})"/>
      <!-- Windshield -->
      <path d="M28 20 L42 20 L44 26 L26 26 Z" fill="url(#glass_${id})"/>
      <path d="M30 21 L40 21 L41 25 L28 25 Z" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
      <!-- Side opening -->
      <path d="M46 20 L56 20 L58 26 L46 26 Z" fill="url(#glass_${id})" opacity="0.6"/>
      <!-- Rear passenger area -->
      <rect x="28" y="32" width="28" height="16" rx="2" fill="${darkenColor(c, 25)}" opacity="0.4"/>
      <!-- Seat -->
      <rect x="30" y="34" width="24" height="10" rx="2" fill="#1a1a1a"/>
      <rect x="32" y="36" width="20" height="6" rx="1" fill="#333"/>
      <!-- Front wheel -->
      <ellipse cx="22" cy="50" rx="8" ry="5" fill="#1a1a1a"/>
      <ellipse cx="22" cy="50" rx="5" ry="3" fill="#333"/>
      <ellipse cx="22" cy="50" rx="2.5" ry="1.5" fill="#666"/>
      <!-- Rear wheels -->
      <ellipse cx="42" cy="52" rx="7" ry="4" fill="#1a1a1a"/>
      <ellipse cx="42" cy="52" rx="4.5" ry="2.5" fill="#333"/>
      <ellipse cx="42" cy="52" rx="2" ry="1.1" fill="#666"/>
      <ellipse cx="58" cy="52" rx="7" ry="4" fill="#1a1a1a"/>
      <ellipse cx="58" cy="52" rx="4.5" ry="2.5" fill="#333"/>
      <ellipse cx="58" cy="52" rx="2" ry="1.1" fill="#666"/>
      <!-- Headlight -->
      <ellipse cx="16" cy="40" rx="3" ry="2" fill="#FFFDE7"/>
      <ellipse cx="16" cy="40" rx="2" ry="1.2" fill="#fff"/>
      <!-- Handlebar -->
      <path d="M20 32 L14 26" stroke="#444" stroke-width="3" stroke-linecap="round"/>
      <path d="M20 32 L26 26" stroke="#444" stroke-width="3" stroke-linecap="round"/>
      <circle cx="14" cy="26" r="2.5" fill="#333"/>
      <circle cx="26" cy="26" r="2.5" fill="#333"/>
      <!-- Meter -->
      <rect x="18" y="34" width="4" height="3" rx="1" fill="#FDE047"/>
      <rect x="19" y="35" width="2" height="1" fill="#1a1a1a"/>
      <!-- Support bars -->
      <path d="M28 32 L28 28" stroke="${darkenColor(c, 20)}" stroke-width="2"/>
      <path d="M56 32 L56 28" stroke="${darkenColor(c, 20)}" stroke-width="2"/>
    </g>`,
};

/** Generate unique ID for SVG gradients to avoid conflicts */
let iconIdCounter = 0;
function generateIconId(): string {
  return `v${++iconIdCounter}`;
}

/** Full standalone SVG string for a vehicle marker. */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 56,
): string {
  const body =
    VEHICLE_BODY[(vehicleType ?? "") as VehicleTypeId] ?? VEHICLE_BODY.CAR;
  const c = bodyColor || DEFAULT_ICON_COLOR;
  const id = generateIconId();

  // For isometric icons, we don't rotate the whole icon (it would look wrong)
  // Instead, we just render it as-is. Direction is shown by the vehicle's orientation.
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg">
      ${body(c, id)}
    </svg>`;
}
