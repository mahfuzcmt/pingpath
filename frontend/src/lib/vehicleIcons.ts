// Clean, professional top-view vehicle markers - simplified for clarity on maps.
// Drawn pointing north in a 24×24 viewBox; callers wrap them in an <svg> with rotation/size.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

// Clean vehicle silhouettes - minimal, professional style
export const VEHICLE_BODY: Record<VehicleTypeId, (c: string) => string> = {
  // Car: Simple sedan top-view with windshield
  CAR: (c) => `
    <ellipse cx="12" cy="12" rx="7" ry="10" fill="${c}"/>
    <ellipse cx="12" cy="12" rx="7" ry="10" fill="url(#carGrad)" opacity="0.3"/>
    <ellipse cx="12" cy="6" rx="4" ry="2.5" fill="rgba(255,255,255,0.35)"/>
    <ellipse cx="12" cy="17" rx="3.5" ry="2" fill="rgba(255,255,255,0.2)"/>
    <circle cx="12" cy="3" r="1.2" fill="#fff" opacity="0.6"/>
    <defs><linearGradient id="carGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.2"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient></defs>`,

  // Motorbike: Narrow elongated shape
  MOTORBIKE: (c) => `
    <ellipse cx="12" cy="12" rx="4" ry="9" fill="${c}"/>
    <ellipse cx="12" cy="12" rx="4" ry="9" fill="url(#bikeGrad)" opacity="0.3"/>
    <circle cx="12" cy="4" r="2" fill="#333"/>
    <circle cx="12" cy="4" r="1" fill="#fff" opacity="0.5"/>
    <circle cx="12" cy="20" r="2" fill="#333"/>
    <rect x="10" y="8" width="4" height="3" rx="1" fill="rgba(255,255,255,0.25)"/>
    <defs><linearGradient id="bikeGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.25"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient></defs>`,

  // Truck: Cab + cargo box
  TRUCK: (c) => `
    <rect x="5" y="2" width="14" height="8" rx="2" fill="${c}"/>
    <rect x="5" y="2" width="14" height="8" rx="2" fill="url(#truckGrad)" opacity="0.3"/>
    <rect x="7" y="3.5" width="10" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
    <rect x="4" y="11" width="16" height="11" rx="1.5" fill="#dde3e9" stroke="#9aa5b1" stroke-width="0.5"/>
    <line x1="4" y1="14.5" x2="20" y2="14.5" stroke="#9aa5b1" stroke-width="0.4"/>
    <line x1="4" y1="18" x2="20" y2="18" stroke="#9aa5b1" stroke-width="0.4"/>
    <defs><linearGradient id="truckGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.2"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient></defs>`,

  // Bus: Long rectangular shape
  BUS: (c) => `
    <rect x="5" y="2" width="14" height="20" rx="3" fill="${c}"/>
    <rect x="5" y="2" width="14" height="20" rx="3" fill="url(#busGrad)" opacity="0.3"/>
    <rect x="7" y="4" width="10" height="4" rx="1" fill="rgba(255,255,255,0.3)"/>
    <rect x="6" y="10" width="2" height="8" rx="0.5" fill="rgba(255,255,255,0.2)"/>
    <rect x="16" y="10" width="2" height="8" rx="0.5" fill="rgba(255,255,255,0.2)"/>
    <rect x="9" y="11" width="6" height="5" rx="1" fill="rgba(255,255,255,0.15)"/>
    <defs><linearGradient id="busGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.2"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient></defs>`,

  // CNG/Auto-rickshaw: Rounded compact shape
  CNG: (c) => `
    <ellipse cx="12" cy="13" rx="6" ry="8" fill="${c}"/>
    <ellipse cx="12" cy="13" rx="6" ry="8" fill="url(#cngGrad)" opacity="0.3"/>
    <circle cx="12" cy="5" r="2.5" fill="#333"/>
    <circle cx="12" cy="5" r="1.2" fill="#fff" opacity="0.4"/>
    <ellipse cx="12" cy="10" rx="4" ry="2.5" fill="rgba(255,255,255,0.25)"/>
    <ellipse cx="12" cy="18" rx="3" ry="1.5" fill="rgba(0,0,0,0.15)"/>
    <defs><linearGradient id="cngGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.2"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient></defs>`,
};

/** Full standalone SVG string for a vehicle marker, rotated to `rotation` degrees. */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 36,
): string {
  const body =
    VEHICLE_BODY[(vehicleType ?? "") as VehicleTypeId] ?? VEHICLE_BODY.CAR;
  const c = bodyColor || DEFAULT_ICON_COLOR;
  // Clean professional marker with shadow ring
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} 12 12)">
        <circle cx="12" cy="12" r="11.5" fill="none" stroke="${c}" stroke-width="1.5" stroke-opacity="0.4"/>
        ${body(c)}
        <polygon points="12,0 14,4 10,4" fill="${c}"/>
      </g>
    </svg>`;
}
