// Top-view vehicle silhouettes shared by the fleet map markers and the
// vehicle-edit icon picker. Drawn pointing north in a 24×40 box; callers wrap
// them in an <svg> with their own rotation/size.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

export const VEHICLE_BODY: Record<VehicleTypeId, (c: string) => string> = {
  CAR: (c) => `
    <rect x="5" y="4" width="14" height="32" rx="5.5" fill="${c}" stroke="#0A1928" stroke-width="1.2"/>
    <rect x="7" y="10" width="10" height="6" rx="2" fill="#fff" fill-opacity="0.75"/>
    <rect x="7" y="26" width="10" height="5" rx="2" fill="#fff" fill-opacity="0.45"/>`,
  MOTORBIKE: (c) => `
    <rect x="9" y="6" width="6" height="28" rx="3" fill="${c}" stroke="#0A1928" stroke-width="1.2"/>
    <rect x="4" y="9" width="16" height="2.5" rx="1.2" fill="#0A1928"/>
    <circle cx="12" cy="7" r="2.6" fill="#fff" fill-opacity="0.75"/>
    <rect x="9.5" y="23" width="5" height="7" rx="2" fill="#0A1928" fill-opacity="0.55"/>`,
  TRUCK: (c) => `
    <rect x="4" y="3" width="16" height="12" rx="3" fill="${c}" stroke="#0A1928" stroke-width="1.2"/>
    <rect x="6" y="6" width="12" height="4" rx="1.5" fill="#fff" fill-opacity="0.75"/>
    <rect x="4" y="16" width="16" height="21" rx="2" fill="${c}" stroke="#0A1928" stroke-width="1.2"/>
    <line x1="4" y1="26" x2="20" y2="26" stroke="#0A1928" stroke-width="1" stroke-opacity="0.4"/>`,
  BUS: (c) => `
    <rect x="4.5" y="3" width="15" height="34" rx="4" fill="${c}" stroke="#0A1928" stroke-width="1.2"/>
    <rect x="6.5" y="7" width="11" height="4.5" rx="1.5" fill="#fff" fill-opacity="0.75"/>
    <rect x="6.5" y="15" width="11" height="14" rx="1.5" fill="#fff" fill-opacity="0.35"/>
    <rect x="6.5" y="31" width="11" height="3.5" rx="1.5" fill="#fff" fill-opacity="0.5"/>`,
  CNG: (c) => `
    <path d="M12 4 C16 4 18 7 18 11 L18 31 C18 34.5 15.5 36 12 36 C8.5 36 6 34.5 6 31 L6 11 C6 7 8 4 12 4 Z"
          fill="${c}" stroke="#0A1928" stroke-width="1.2"/>
    <path d="M8.5 9 Q12 6.5 15.5 9 L15.5 13 L8.5 13 Z" fill="#fff" fill-opacity="0.75"/>
    <rect x="8.5" y="27" width="7" height="6" rx="2" fill="#0A1928" fill-opacity="0.45"/>`,
};

/** Full standalone SVG string for a vehicle marker, rotated to `rotation` degrees. */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 38,
): string {
  const body =
    VEHICLE_BODY[(vehicleType ?? "") as VehicleTypeId] ?? VEHICLE_BODY.CAR;
  const c = bodyColor || DEFAULT_ICON_COLOR;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} 20 20) translate(8 0)">
        ${body(c)}
      </g>
    </svg>`;
}
