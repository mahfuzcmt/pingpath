// Bold, visible vehicle icons for fleet tracking map markers.
// Each icon has a white circular background for visibility on any map.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

// Vehicle icons with white background circle for visibility
export const VEHICLE_BODY: Record<VehicleTypeId, (c: string) => string> = {
  // Car: Top-down sedan view
  CAR: (c) => `
    <!-- White background circle -->
    <circle cx="12" cy="12" r="11" fill="white" stroke="${c}" stroke-width="1.5"/>
    <!-- Car body -->
    <rect x="6" y="4" width="12" height="16" rx="3" fill="${c}"/>
    <!-- Windshield -->
    <rect x="7.5" y="5.5" width="9" height="3.5" rx="1" fill="#4A90D9"/>
    <!-- Rear window -->
    <rect x="7.5" y="15" width="9" height="3" rx="1" fill="#4A90D9"/>
    <!-- Roof -->
    <rect x="8" y="9.5" width="8" height="5" rx="0.5" fill="${c}" stroke="#fff" stroke-width="0.5"/>
    <!-- Wheels -->
    <ellipse cx="6" cy="7" rx="1.5" ry="2" fill="#333"/>
    <ellipse cx="18" cy="7" rx="1.5" ry="2" fill="#333"/>
    <ellipse cx="6" cy="17" rx="1.5" ry="2" fill="#333"/>
    <ellipse cx="18" cy="17" rx="1.5" ry="2" fill="#333"/>
    <!-- Headlights -->
    <rect x="8" y="4.2" width="2" height="1" rx="0.3" fill="#FFE066"/>
    <rect x="14" y="4.2" width="2" height="1" rx="0.3" fill="#FFE066"/>`,

  // Motorbike: Top-down view
  MOTORBIKE: (c) => `
    <!-- White background circle -->
    <circle cx="12" cy="12" r="11" fill="white" stroke="${c}" stroke-width="1.5"/>
    <!-- Body/frame -->
    <ellipse cx="12" cy="12" rx="4" ry="7" fill="${c}"/>
    <!-- Front wheel -->
    <ellipse cx="12" cy="4" rx="2.5" ry="1.5" fill="#333" stroke="#555" stroke-width="0.5"/>
    <!-- Rear wheel -->
    <ellipse cx="12" cy="20" rx="2.5" ry="1.5" fill="#333" stroke="#555" stroke-width="0.5"/>
    <!-- Handlebar -->
    <rect x="7" y="5.5" width="10" height="2" rx="1" fill="#444"/>
    <!-- Seat -->
    <ellipse cx="12" cy="14" rx="2.5" ry="4" fill="#222"/>
    <!-- Tank -->
    <ellipse cx="12" cy="8" rx="2.5" ry="2" fill="${c}" stroke="#fff" stroke-width="0.3"/>
    <!-- Headlight -->
    <circle cx="12" cy="4.5" r="1.2" fill="#FFE066"/>`,

  // Truck: Top-down view with cab and cargo
  TRUCK: (c) => `
    <!-- White background circle -->
    <circle cx="12" cy="12" r="11" fill="white" stroke="${c}" stroke-width="1.5"/>
    <!-- Cab -->
    <rect x="5" y="3" width="14" height="6" rx="2" fill="${c}"/>
    <!-- Cargo container -->
    <rect x="4" y="9.5" width="16" height="10" rx="1" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="0.5"/>
    <!-- Container lines -->
    <line x1="4" y1="12.5" x2="20" y2="12.5" stroke="#9CA3AF" stroke-width="0.5"/>
    <line x1="4" y1="16" x2="20" y2="16" stroke="#9CA3AF" stroke-width="0.5"/>
    <!-- Windshield -->
    <rect x="6.5" y="4" width="11" height="3.5" rx="1" fill="#4A90D9"/>
    <!-- Front wheels -->
    <ellipse cx="5" cy="6" rx="1.5" ry="2" fill="#333"/>
    <ellipse cx="19" cy="6" rx="1.5" ry="2" fill="#333"/>
    <!-- Rear wheels (dual) -->
    <ellipse cx="5" cy="17" rx="1.5" ry="2" fill="#333"/>
    <ellipse cx="7" cy="17" rx="1" ry="1.5" fill="#333"/>
    <ellipse cx="19" cy="17" rx="1.5" ry="2" fill="#333"/>
    <ellipse cx="17" cy="17" rx="1" ry="1.5" fill="#333"/>`,

  // Bus: Top-down passenger bus
  BUS: (c) => `
    <!-- White background circle -->
    <circle cx="12" cy="12" r="11" fill="white" stroke="${c}" stroke-width="1.5"/>
    <!-- Bus body -->
    <rect x="5" y="2" width="14" height="20" rx="2.5" fill="${c}"/>
    <!-- Front windshield -->
    <rect x="6.5" y="3" width="11" height="3" rx="1" fill="#4A90D9"/>
    <!-- Windows row 1 -->
    <rect x="6.5" y="7" width="4" height="2" rx="0.5" fill="#4A90D9"/>
    <rect x="13.5" y="7" width="4" height="2" rx="0.5" fill="#4A90D9"/>
    <!-- Windows row 2 -->
    <rect x="6.5" y="10" width="4" height="2" rx="0.5" fill="#4A90D9"/>
    <rect x="13.5" y="10" width="4" height="2" rx="0.5" fill="#4A90D9"/>
    <!-- Windows row 3 -->
    <rect x="6.5" y="13" width="4" height="2" rx="0.5" fill="#4A90D9"/>
    <rect x="13.5" y="13" width="4" height="2" rx="0.5" fill="#4A90D9"/>
    <!-- Rear window -->
    <rect x="7" y="17" width="10" height="2.5" rx="0.5" fill="#4A90D9"/>
    <!-- White stripe -->
    <rect x="5" y="9.5" width="14" height="1" fill="white" opacity="0.6"/>
    <!-- Wheels -->
    <ellipse cx="5" cy="6" rx="1.5" ry="2.5" fill="#333"/>
    <ellipse cx="19" cy="6" rx="1.5" ry="2.5" fill="#333"/>
    <ellipse cx="5" cy="18" rx="1.5" ry="2.5" fill="#333"/>
    <ellipse cx="19" cy="18" rx="1.5" ry="2.5" fill="#333"/>`,

  // CNG/Auto-rickshaw: Three-wheeler
  CNG: (c) => `
    <!-- White background circle -->
    <circle cx="12" cy="12" r="11" fill="white" stroke="${c}" stroke-width="1.5"/>
    <!-- Body -->
    <path d="M7 6 L17 6 L19 10 L19 18 L5 18 L5 10 Z" fill="${c}"/>
    <!-- Canopy top -->
    <rect x="6" y="5" width="12" height="3" rx="1" fill="${c}" stroke="#fff" stroke-width="0.3"/>
    <!-- Front windshield -->
    <path d="M8 6 L16 6 L17 9 L7 9 Z" fill="#4A90D9"/>
    <!-- Rear opening -->
    <rect x="7" y="14" width="10" height="4" fill="#333" opacity="0.3"/>
    <!-- Seat -->
    <rect x="8" y="10" width="8" height="4" rx="1" fill="#333"/>
    <!-- Front wheel -->
    <ellipse cx="12" cy="4" rx="2" ry="1.5" fill="#333"/>
    <!-- Rear wheels -->
    <ellipse cx="5.5" cy="17" rx="2" ry="2" fill="#333"/>
    <ellipse cx="18.5" cy="17" rx="2" ry="2" fill="#333"/>
    <!-- Headlight -->
    <circle cx="12" cy="5.5" r="1" fill="#FFE066"/>`,
};

/** Full standalone SVG string for a vehicle marker, rotated to `rotation` degrees. */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 48,
): string {
  const body =
    VEHICLE_BODY[(vehicleType ?? "") as VehicleTypeId] ?? VEHICLE_BODY.CAR;
  const c = bodyColor || DEFAULT_ICON_COLOR;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} 12 12)">
        ${body(c)}
      </g>
    </svg>`;
}
