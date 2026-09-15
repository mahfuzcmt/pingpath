// ADL Moto Viewer exact style vehicle markers
// Minimal circles with ultra-simple side-view vehicle silhouettes
// Reference: ADL GPSBot interface - clean, recognizable icons at all zoom levels

export const VEHICLE_TYPES = ["CAR", "MOTORBIKE", "TRUCK", "BUS", "CNG", "MICROBUS"] as const;
export type VehicleTypeId = (typeof VEHICLE_TYPES)[number];

export const DEFAULT_ICON_COLOR = "#17a2b8"; // Teal for online/moving (ADL exact)

// Status-based colors (ADL exact colors from screenshot)
export const STATUS_COLORS = {
  moving: "#17a2b8",    // Teal/cyan - moving (ADL primary color)
  stopped: "#28a745",   // Green - stopped/parked
  idle: "#ffc107",      // Yellow/amber - idle
  offline: "#6c757d",   // Gray - offline
};

/**
 * Get icon dimensions
 */
export function getIconDimensions(size: number): { width: number; height: number } {
  return { width: size, height: size };
}

/**
 * Main function to build vehicle marker SVG.
 * ADL exact style - small circle with ultra-simple side-view vehicle icon.
 */
export function buildVehicleSvg(
  vehicleType: string | null | undefined,
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 24,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  const type = (vehicleType?.toUpperCase() || "TRUCK") as VehicleTypeId;

  switch (type) {
    case "MOTORBIKE":
      return buildMotorbikeIcon(color, size);
    case "CAR":
      return buildCarIcon(color, size);
    case "BUS":
      return buildBusIcon(color, size);
    case "CNG":
      return buildCngIcon(color, size);
    case "MICROBUS":
      return buildMicrobusIcon(color, size);
    case "TRUCK":
    default:
      return buildTruckIcon(color, size);
  }
}

/**
 * Shared drop shadow filter for all icons (ADL style)
 */
function getShadowFilter(): string {
  return `<defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>`;
}

/**
 * ADL exact style truck icon - minimal green circle with simple truck silhouette
 * Ultra-clean: just cab + cargo box outline, no complex details
 */
function buildTruckIcon(color: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${getShadowFilter()}
    <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    <g fill="#fff" transform="translate(5, 8)">
      <!-- Simple truck: cab + cargo box -->
      <rect x="0" y="0" width="8" height="6" rx="0.5"/>
      <path d="M8 2 L12 2 L14 5 L14 6 L8 6 Z"/>
      <!-- Simple wheels -->
      <circle cx="2.5" cy="6" r="1.5"/>
      <circle cx="11.5" cy="6" r="1.5"/>
    </g>
  </svg>`;
}

/**
 * ADL exact style car icon - minimal sedan silhouette
 */
function buildCarIcon(color: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${getShadowFilter()}
    <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    <g fill="#fff" transform="translate(4, 9)">
      <!-- Simple car body -->
      <path d="M1 3 L3 0 L13 0 L15 3 L15 5 L1 5 Z"/>
      <!-- Simple wheels -->
      <circle cx="4" cy="5" r="1.5"/>
      <circle cx="12" cy="5" r="1.5"/>
    </g>
  </svg>`;
}

/**
 * ADL exact style motorbike icon - minimal bike silhouette
 */
function buildMotorbikeIcon(color: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${getShadowFilter()}
    <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    <g fill="#fff" transform="translate(4, 8)">
      <!-- Two wheels connected by frame -->
      <circle cx="2.5" cy="5" r="2.5" fill="none" stroke="#fff" stroke-width="1.5"/>
      <circle cx="13.5" cy="5" r="2.5" fill="none" stroke="#fff" stroke-width="1.5"/>
      <!-- Simple frame + rider silhouette -->
      <path d="M5 5 L8 1 L11 1 L13 3 L11 5 Z"/>
      <circle cx="9" cy="0" r="1.5"/>
    </g>
  </svg>`;
}

/**
 * ADL exact style bus icon - minimal long vehicle
 */
function buildBusIcon(color: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${getShadowFilter()}
    <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    <g fill="#fff" transform="translate(4, 8)">
      <!-- Simple bus body -->
      <rect x="0" y="0" width="16" height="6" rx="1"/>
      <!-- Window strip (negative space) -->
      <rect x="1" y="1" width="14" height="2.5" rx="0.5" fill="${color}"/>
      <!-- Simple wheels -->
      <circle cx="3" cy="6" r="1.5"/>
      <circle cx="13" cy="6" r="1.5"/>
    </g>
  </svg>`;
}

/**
 * ADL exact style CNG/auto-rickshaw icon - minimal three-wheeler
 */
function buildCngIcon(color: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${getShadowFilter()}
    <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    <g fill="#fff" transform="translate(5, 8)">
      <!-- Simple auto body -->
      <path d="M0 2 L2 0 L12 0 L14 2 L14 6 L0 6 Z"/>
      <!-- Window (negative space) -->
      <rect x="2" y="1" width="6" height="2.5" rx="0.5" fill="${color}"/>
      <!-- Simple wheels -->
      <circle cx="3" cy="6" r="1.5"/>
      <circle cx="11" cy="6" r="1.5"/>
    </g>
  </svg>`;
}

/**
 * ADL exact style microbus/van icon - minimal van silhouette
 */
function buildMicrobusIcon(color: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    ${getShadowFilter()}
    <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#fff" stroke-width="1.5" filter="url(#shadow)"/>
    <g fill="#fff" transform="translate(4, 8)">
      <!-- Simple van body with angled front -->
      <path d="M0 1 C0 0.5 0.5 0 1 0 L12 0 L16 3 L16 6 L0 6 Z"/>
      <!-- Window strip (negative space) -->
      <rect x="1" y="1" width="11" height="2.5" rx="0.5" fill="${color}"/>
      <!-- Simple wheels -->
      <circle cx="3" cy="6" r="1.5"/>
      <circle cx="13" cy="6" r="1.5"/>
    </g>
  </svg>`;
}

/**
 * Simple circle marker (for compatibility)
 */
export function buildSimpleArrow(
  bodyColor: string | null | undefined,
  rotation = 0,
  size = 24,
): string {
  return buildTruckIcon(bodyColor || DEFAULT_ICON_COLOR, size);
}

/**
 * Simple pin marker for static locations
 */
export function buildSimplePin(
  bodyColor: string | null | undefined,
  size = 24,
): string {
  const color = bodyColor || DEFAULT_ICON_COLOR;
  return `<svg width="${size}" height="${Math.round(size * 1.3)}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0 C6 0 1 5 1 11 C1 18 12 30 12 30 C12 30 23 18 23 11 C23 5 18 0 12 0 Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="4" fill="#fff"/>
  </svg>`;
}

/**
 * Cluster marker for grouped vehicles
 */
export function buildClusterMarker(
  count: number,
  color: string = "#1890ff",
  size = 28,
): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="${color}" stroke="#fff" stroke-width="2"/>
    <text x="14" y="18" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="Arial">${count}</text>
  </svg>`;
}

// Helper functions
export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
