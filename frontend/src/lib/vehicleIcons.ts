// Realistic 3D-style vehicle icons for fleet tracking map markers.
// Designed to look like actual vehicles from a slight top-down perspective.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

// Realistic vehicle icons with 3D depth and details
export const VEHICLE_BODY: Record<VehicleTypeId, (c: string) => string> = {
  // Car: Realistic sedan with roof, windows, wheels
  CAR: (c) => `
    <defs>
      <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.7"/>
      </linearGradient>
      <linearGradient id="carRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.6"/>
      </linearGradient>
    </defs>
    <!-- Shadow -->
    <ellipse cx="12" cy="21" rx="6" ry="2" fill="rgba(0,0,0,0.2)"/>
    <!-- Wheels -->
    <ellipse cx="6" cy="6" rx="2.2" ry="1.8" fill="#1a1a1a"/>
    <ellipse cx="18" cy="6" rx="2.2" ry="1.8" fill="#1a1a1a"/>
    <ellipse cx="6" cy="17" rx="2.2" ry="1.8" fill="#1a1a1a"/>
    <ellipse cx="18" cy="17" rx="2.2" ry="1.8" fill="#1a1a1a"/>
    <!-- Body -->
    <path d="M5 4 Q5 2 7 2 L17 2 Q19 2 19 4 L19 19 Q19 21 17 21 L7 21 Q5 21 5 19 Z" fill="url(#carBody)" stroke="#333" stroke-width="0.3"/>
    <!-- Roof/cabin -->
    <path d="M7 5 L17 5 L16 9 L8 9 Z" fill="url(#carRoof)" stroke="#444" stroke-width="0.2"/>
    <path d="M8 14 L16 14 L17 18 L7 18 Z" fill="url(#carRoof)" stroke="#444" stroke-width="0.2"/>
    <!-- Windshield -->
    <path d="M8 5.5 L16 5.5 L15.5 8.5 L8.5 8.5 Z" fill="#87CEEB" opacity="0.7"/>
    <!-- Rear window -->
    <path d="M8.5 14.5 L15.5 14.5 L16 17 L8 17 Z" fill="#87CEEB" opacity="0.5"/>
    <!-- Headlights -->
    <rect x="7" y="2.2" width="2" height="1" rx="0.3" fill="#FFFACD"/>
    <rect x="15" y="2.2" width="2" height="1" rx="0.3" fill="#FFFACD"/>
    <!-- Taillights -->
    <rect x="7" y="19.8" width="2" height="0.8" rx="0.2" fill="#DC143C"/>
    <rect x="15" y="19.8" width="2" height="0.8" rx="0.2" fill="#DC143C"/>`,

  // Motorbike: Realistic motorcycle with rider silhouette
  MOTORBIKE: (c) => `
    <defs>
      <linearGradient id="bikeBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <!-- Shadow -->
    <ellipse cx="12" cy="21" rx="4" ry="1.5" fill="rgba(0,0,0,0.2)"/>
    <!-- Front wheel -->
    <ellipse cx="12" cy="3" rx="3" ry="2" fill="#1a1a1a"/>
    <ellipse cx="12" cy="3" rx="2" ry="1.3" fill="#333"/>
    <!-- Rear wheel -->
    <ellipse cx="12" cy="20" rx="3" ry="2" fill="#1a1a1a"/>
    <ellipse cx="12" cy="20" rx="2" ry="1.3" fill="#333"/>
    <!-- Bike frame -->
    <path d="M10 5 L14 5 L15 8 L15 16 L14 19 L10 19 L9 16 L9 8 Z" fill="url(#bikeBody)" stroke="#333" stroke-width="0.3"/>
    <!-- Fuel tank -->
    <ellipse cx="12" cy="9" rx="3" ry="2" fill="${c}" stroke="#333" stroke-width="0.2"/>
    <ellipse cx="12" cy="9" rx="2" ry="1.2" fill="${c}" opacity="0.8"/>
    <!-- Seat -->
    <ellipse cx="12" cy="14" rx="2.5" ry="3" fill="#2d2d2d"/>
    <!-- Handlebar -->
    <rect x="8" y="5" width="8" height="1.5" rx="0.5" fill="#444"/>
    <!-- Headlight -->
    <ellipse cx="12" cy="4" rx="1.5" ry="0.8" fill="#FFFACD"/>
    <!-- Taillight -->
    <rect x="10.5" y="18.5" width="3" height="0.8" rx="0.2" fill="#DC143C"/>`,

  // Truck: Realistic truck with cab and cargo container
  TRUCK: (c) => `
    <defs>
      <linearGradient id="truckCab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <!-- Shadow -->
    <ellipse cx="12" cy="22" rx="7" ry="1.5" fill="rgba(0,0,0,0.2)"/>
    <!-- Front wheels -->
    <ellipse cx="6" cy="5" rx="2.5" ry="1.8" fill="#1a1a1a"/>
    <ellipse cx="18" cy="5" rx="2.5" ry="1.8" fill="#1a1a1a"/>
    <!-- Rear wheels (dual) -->
    <ellipse cx="5.5" cy="18" rx="2.2" ry="1.6" fill="#1a1a1a"/>
    <ellipse cx="7.5" cy="18" rx="2.2" ry="1.6" fill="#1a1a1a"/>
    <ellipse cx="16.5" cy="18" rx="2.2" ry="1.6" fill="#1a1a1a"/>
    <ellipse cx="18.5" cy="18" rx="2.2" ry="1.6" fill="#1a1a1a"/>
    <!-- Cab -->
    <rect x="4" y="1" width="16" height="8" rx="1.5" fill="url(#truckCab)" stroke="#333" stroke-width="0.3"/>
    <!-- Cab windshield -->
    <rect x="6" y="2" width="12" height="4" rx="0.5" fill="#87CEEB" opacity="0.7"/>
    <!-- Cargo container -->
    <rect x="3" y="10" width="18" height="11" rx="1" fill="#E8E8E8" stroke="#999" stroke-width="0.4"/>
    <!-- Container lines -->
    <line x1="3" y1="13" x2="21" y2="13" stroke="#ccc" stroke-width="0.3"/>
    <line x1="3" y1="16" x2="21" y2="16" stroke="#ccc" stroke-width="0.3"/>
    <line x1="3" y1="19" x2="21" y2="19" stroke="#ccc" stroke-width="0.3"/>
    <!-- Container doors (back) -->
    <line x1="12" y1="10" x2="12" y2="21" stroke="#aaa" stroke-width="0.3"/>
    <!-- Headlights -->
    <rect x="5" y="7.5" width="2.5" height="1.2" rx="0.3" fill="#FFFACD"/>
    <rect x="16.5" y="7.5" width="2.5" height="1.2" rx="0.3" fill="#FFFACD"/>`,

  // Bus: Realistic passenger bus
  BUS: (c) => `
    <defs>
      <linearGradient id="busBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.75"/>
      </linearGradient>
    </defs>
    <!-- Shadow -->
    <ellipse cx="12" cy="22" rx="6" ry="1.5" fill="rgba(0,0,0,0.2)"/>
    <!-- Wheels -->
    <ellipse cx="6" cy="5" rx="2.3" ry="1.7" fill="#1a1a1a"/>
    <ellipse cx="18" cy="5" rx="2.3" ry="1.7" fill="#1a1a1a"/>
    <ellipse cx="6" cy="18" rx="2.3" ry="1.7" fill="#1a1a1a"/>
    <ellipse cx="18" cy="18" rx="2.3" ry="1.7" fill="#1a1a1a"/>
    <!-- Body -->
    <rect x="4" y="1" width="16" height="20" rx="2" fill="url(#busBody)" stroke="#333" stroke-width="0.3"/>
    <!-- Windows row 1 -->
    <rect x="5" y="2" width="4" height="2.5" rx="0.3" fill="#87CEEB" opacity="0.8"/>
    <rect x="10" y="2" width="4" height="2.5" rx="0.3" fill="#87CEEB" opacity="0.8"/>
    <rect x="15" y="2" width="4" height="2.5" rx="0.3" fill="#87CEEB" opacity="0.8"/>
    <!-- Windows row 2 -->
    <rect x="5" y="6" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="9" y="6" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="13" y="6" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="17" y="6" width="2" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <!-- Windows row 3 -->
    <rect x="5" y="10" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="9" y="10" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="13" y="10" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="17" y="10" width="2" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <!-- Windows row 4 -->
    <rect x="5" y="14" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="9" y="14" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="13" y="14" width="3" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <rect x="17" y="14" width="2" height="2.2" rx="0.3" fill="#87CEEB" opacity="0.7"/>
    <!-- Rear window -->
    <rect x="6" y="17.5" width="12" height="2" rx="0.3" fill="#87CEEB" opacity="0.6"/>
    <!-- Stripe -->
    <rect x="4" y="9" width="16" height="0.8" fill="#fff" opacity="0.5"/>
    <!-- Taillights -->
    <rect x="5" y="20" width="2" height="0.8" rx="0.2" fill="#DC143C"/>
    <rect x="17" y="20" width="2" height="0.8" rx="0.2" fill="#DC143C"/>`,

  // CNG/Auto-rickshaw: Three-wheeler
  CNG: (c) => `
    <defs>
      <linearGradient id="cngBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <!-- Shadow -->
    <ellipse cx="12" cy="21" rx="5" ry="1.5" fill="rgba(0,0,0,0.2)"/>
    <!-- Front wheel -->
    <ellipse cx="12" cy="3" rx="2.5" ry="2" fill="#1a1a1a"/>
    <ellipse cx="12" cy="3" rx="1.5" ry="1.2" fill="#333"/>
    <!-- Rear wheels -->
    <ellipse cx="6" cy="18" rx="2.5" ry="2" fill="#1a1a1a"/>
    <ellipse cx="18" cy="18" rx="2.5" ry="2" fill="#1a1a1a"/>
    <!-- Body frame -->
    <path d="M8 5 L16 5 L19 10 L19 17 L5 17 L5 10 Z" fill="url(#cngBody)" stroke="#333" stroke-width="0.3"/>
    <!-- Canopy/roof -->
    <path d="M6 6 L18 6 L18 8 L6 8 Z" fill="${c}" stroke="#333" stroke-width="0.2"/>
    <path d="M6 6 L18 6" stroke="#222" stroke-width="0.5"/>
    <!-- Front windshield area -->
    <path d="M9 5.5 L15 5.5 L15.5 7.5 L8.5 7.5 Z" fill="#87CEEB" opacity="0.6"/>
    <!-- Open sides -->
    <rect x="5.5" y="9" width="0.8" height="6" fill="#333"/>
    <rect x="17.7" y="9" width="0.8" height="6" fill="#333"/>
    <!-- Seat -->
    <rect x="7" y="10" width="10" height="5" rx="1" fill="#2d2d2d"/>
    <!-- Headlight -->
    <ellipse cx="12" cy="5.2" rx="1.5" ry="0.6" fill="#FFFACD"/>
    <!-- Meter/display -->
    <rect x="10" y="7" width="4" height="1.5" rx="0.3" fill="#111"/>`,
};

/** Full standalone SVG string for a vehicle marker, rotated to `rotation` degrees. */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 40,
): string {
  const body =
    VEHICLE_BODY[(vehicleType ?? "") as VehicleTypeId] ?? VEHICLE_BODY.CAR;
  const c = bodyColor || DEFAULT_ICON_COLOR;
  // Realistic vehicle marker
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} 12 12)">
        ${body(c)}
      </g>
    </svg>`;
}
