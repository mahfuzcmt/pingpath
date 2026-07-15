// Pseudo-3D top-view vehicles shared by the fleet map markers and the
// vehicle-edit icon picker. Drawn pointing north in a 24×40 box; callers wrap
// them in an <svg> with their own rotation/size. Mirrors the mobile app's
// mobile/src/components/WebMap.tsx BODY set — keep the two in sync.

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#E8900A";

// Gradient defs repeat per marker with fixed ids — the defs are identical, so
// duplicate ids across markers are harmless (url(#...) resolves to the first).
const DEFS = `
  <defs>
    <linearGradient id="mlsh" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".38"/>
      <stop offset=".22" stop-color="#fff" stop-opacity=".30"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".04"/>
      <stop offset=".8" stop-color="#000" stop-opacity=".16"/>
      <stop offset="1" stop-color="#000" stop-opacity=".42"/>
    </linearGradient>
    <linearGradient id="mlgl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#C7D8E6"/><stop offset="1" stop-color="#54718A"/>
    </linearGradient>
    <linearGradient id="mlgl2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#54718A"/><stop offset="1" stop-color="#C7D8E6"/>
    </linearGradient>
  </defs>`;

const CAR_BODY =
  "M12 2.2 C16.6 2.2 19.6 4.6 19.6 8.8 L19.6 33.2 C19.6 36.6 16.4 38 12 38 C7.6 38 4.4 36.6 4.4 33.2 L4.4 8.8 C4.4 4.6 7.4 2.2 12 2.2 Z";

export const VEHICLE_BODY: Record<VehicleTypeId, (c: string) => string> = {
  CAR: (c) => `${DEFS}
    <rect x="2.6" y="7.5" width="3" height="6.5" rx="1.5" fill="#222"/><rect x="18.4" y="7.5" width="3" height="6.5" rx="1.5" fill="#222"/>
    <rect x="2.6" y="27" width="3" height="6.5" rx="1.5" fill="#222"/><rect x="18.4" y="27" width="3" height="6.5" rx="1.5" fill="#222"/>
    <rect x="2.9" y="14.4" width="2.4" height="1.8" rx=".9" fill="${c}"/><rect x="18.7" y="14.4" width="2.4" height="1.8" rx=".9" fill="${c}"/>
    <path d="${CAR_BODY}" fill="${c}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>
    <path d="${CAR_BODY}" fill="url(#mlsh)"/>
    <ellipse cx="7.6" cy="3.9" rx="1.7" ry=".9" fill="#FFF4C2"/><ellipse cx="16.4" cy="3.9" rx="1.7" ry=".9" fill="#FFF4C2"/>
    <path d="M6.6 9.6 Q12 7 17.4 9.6 L16.6 14.8 Q12 13 7.4 14.8 Z" fill="url(#mlgl)"/>
    <rect x="6.8" y="16.5" width="10.4" height="9.5" rx="3.2" fill="#fff" opacity=".14"/>
    <rect x="7.6" y="17.4" width="3.6" height="7.6" rx="1.8" fill="#fff" opacity=".14"/>
    <path d="M7.4 27.6 Q12 29.4 16.6 27.6 L17.2 31.6 Q12 33.6 6.8 31.6 Z" fill="url(#mlgl2)"/>
    <rect x="5.4" y="36.4" width="3.4" height="1.2" rx=".6" fill="#D23131"/><rect x="15.2" y="36.4" width="3.4" height="1.2" rx=".6" fill="#D23131"/>`,
  MOTORBIKE: (c) => `${DEFS}
    <rect x="10.6" y="1.6" width="2.8" height="7.4" rx="1.4" fill="#1d1d1d"/>
    <rect x="10.6" y="30.5" width="2.8" height="8" rx="1.4" fill="#1d1d1d"/>
    <rect x="10" y="3.6" width="4" height="4.4" rx="2" fill="${c}"/><rect x="10" y="3.6" width="4" height="4.4" rx="2" fill="url(#mlsh)"/>
    <rect x="4.6" y="9.2" width="14.8" height="2.2" rx="1.1" fill="#2b2b2b"/>
    <rect x="4.6" y="8.8" width="3" height="3" rx="1.4" fill="#111"/><rect x="16.4" y="8.8" width="3" height="3" rx="1.4" fill="#111"/>
    <ellipse cx="12" cy="10.2" rx="1.8" ry="1" fill="#FFF4C2"/>
    <path d="M12 10.8 C14.8 10.8 15.7 12.8 15.5 15.8 L14.7 24.5 C14.5 27.3 13.6 29.2 12 29.2 C10.4 29.2 9.5 27.3 9.3 24.5 L8.5 15.8 C8.3 12.8 9.2 10.8 12 10.8 Z" fill="${c}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>
    <path d="M12 10.8 C14.8 10.8 15.7 12.8 15.5 15.8 L14.7 24.5 C14.5 27.3 13.6 29.2 12 29.2 C10.4 29.2 9.5 27.3 9.3 24.5 L8.5 15.8 C8.3 12.8 9.2 10.8 12 10.8 Z" fill="url(#mlsh)"/>
    <ellipse cx="10.9" cy="14.2" rx="1.5" ry="2.4" fill="#fff" opacity=".32"/>
    <path d="M9.7 22.6 L14.3 22.6 L14.7 28.6 C14.7 30.3 13.5 31.2 12 31.2 C10.5 31.2 9.3 30.3 9.3 28.6 Z" fill="#1f1f1f"/>`,
  TRUCK: (c) => `${DEFS}
    <rect x="2.6" y="6.5" width="3" height="6" rx="1.5" fill="#222"/><rect x="18.4" y="6.5" width="3" height="6" rx="1.5" fill="#222"/>
    <rect x="2.6" y="21.5" width="3" height="6" rx="1.5" fill="#222"/><rect x="18.4" y="21.5" width="3" height="6" rx="1.5" fill="#222"/>
    <rect x="2.6" y="29" width="3" height="6" rx="1.5" fill="#222"/><rect x="18.4" y="29" width="3" height="6" rx="1.5" fill="#222"/>
    <rect x="3.1" y="7.8" width="2.4" height="1.8" rx=".9" fill="${c}"/><rect x="18.5" y="7.8" width="2.4" height="1.8" rx=".9" fill="${c}"/>
    <path d="M12 2.4 C15.8 2.4 18.8 3.7 18.8 6.7 L18.8 13.6 L5.2 13.6 L5.2 6.7 C5.2 3.7 8.2 2.4 12 2.4 Z" fill="${c}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>
    <path d="M12 2.4 C15.8 2.4 18.8 3.7 18.8 6.7 L18.8 13.6 L5.2 13.6 L5.2 6.7 C5.2 3.7 8.2 2.4 12 2.4 Z" fill="url(#mlsh)"/>
    <ellipse cx="7.8" cy="3.7" rx="1.6" ry=".8" fill="#FFF4C2"/><ellipse cx="16.2" cy="3.7" rx="1.6" ry=".8" fill="#FFF4C2"/>
    <path d="M6.4 5.6 Q12 3.8 17.6 5.6 L17.6 9.2 Q12 7.8 6.4 9.2 Z" fill="url(#mlgl)"/>
    <rect x="4" y="15" width="16" height="22.6" rx="1.6" fill="#E9EDF2" stroke="#9AA7B5" stroke-width=".8"/>
    <rect x="4" y="15" width="16" height="22.6" rx="1.6" fill="url(#mlsh)" opacity=".55"/>
    <path d="M4 19.5 H20 M4 24 H20 M4 28.5 H20 M4 33 H20" stroke="#9AA7B5" stroke-width=".6" opacity=".7"/>`,
  BUS: (c) => `${DEFS}
    <rect x="2.8" y="6.5" width="3" height="6.5" rx="1.5" fill="#222"/><rect x="18.2" y="6.5" width="3" height="6.5" rx="1.5" fill="#222"/>
    <rect x="2.8" y="27.5" width="3" height="6.5" rx="1.5" fill="#222"/><rect x="18.2" y="27.5" width="3" height="6.5" rx="1.5" fill="#222"/>
    <rect x="4.4" y="2.4" width="15.2" height="35.2" rx="4.5" fill="${c}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>
    <rect x="4.4" y="2.4" width="15.2" height="35.2" rx="4.5" fill="url(#mlsh)"/>
    <ellipse cx="7.8" cy="4" rx="1.6" ry=".9" fill="#FFF4C2"/><ellipse cx="16.2" cy="4" rx="1.6" ry=".9" fill="#FFF4C2"/>
    <path d="M6.2 5.8 Q12 4 17.8 5.8 L17.8 9.8 Q12 8.4 6.2 9.8 Z" fill="url(#mlgl)"/>
    <rect x="4.9" y="12" width="1.8" height="18" fill="url(#mlgl)" opacity=".9"/><rect x="17.3" y="12" width="1.8" height="18" fill="url(#mlgl)" opacity=".9"/>
    <rect x="8.4" y="13.5" width="7.2" height="11.5" rx="1.6" fill="#fff" opacity=".18"/>
    <rect x="9.6" y="15.5" width="4.8" height="3" rx="1" fill="#fff" opacity=".22"/>
    <rect x="6.6" y="33.4" width="10.8" height="2.6" rx="1.2" fill="url(#mlgl2)"/>
    <rect x="5.4" y="36.6" width="3.2" height="1.1" rx=".55" fill="#D23131"/><rect x="15.4" y="36.6" width="3.2" height="1.1" rx=".55" fill="#D23131"/>`,
  CNG: (c) => `${DEFS}
    <rect x="10.7" y="2" width="2.6" height="5.5" rx="1.3" fill="#1d1d1d"/>
    <rect x="3" y="28" width="3" height="6.5" rx="1.5" fill="#222"/><rect x="18" y="28" width="3" height="6.5" rx="1.5" fill="#222"/>
    <path d="M12 3.5 C16.4 3.5 18.4 6.8 18.4 11 L18.4 30.5 C18.4 34.4 15.6 36.2 12 36.2 C8.4 36.2 5.6 34.4 5.6 30.5 L5.6 11 C5.6 6.8 7.6 3.5 12 3.5 Z" fill="${c}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>
    <path d="M12 3.5 C16.4 3.5 18.4 6.8 18.4 11 L18.4 30.5 C18.4 34.4 15.6 36.2 12 36.2 C8.4 36.2 5.6 34.4 5.6 30.5 L5.6 11 C5.6 6.8 7.6 3.5 12 3.5 Z" fill="url(#mlsh)"/>
    <ellipse cx="12" cy="4.6" rx="1.8" ry=".9" fill="#FFF4C2"/>
    <path d="M7.8 8.4 Q12 6 16.2 8.4 L15.8 12.6 Q12 11 8.2 12.6 Z" fill="url(#mlgl)"/>
    <rect x="6.6" y="14.4" width="10.8" height="16.4" rx="3" fill="#0A1928" opacity=".32"/>
    <path d="M6.6 18.6 H17.4 M6.6 23 H17.4 M6.6 27.4 H17.4" stroke="#0A1928" stroke-width=".7" opacity=".35"/>
    <rect x="8.6" y="36.4" width="6.8" height="1.2" rx=".6" fill="#D23131"/>`,
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
