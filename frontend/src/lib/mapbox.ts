// Centralised Mapbox config so the dashboard, geofence editor, and trip
// playback share style + token + Bangladesh defaults.

export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11";

// Dhaka centre — used as initial map view when no devices yet have a fix.
export const DHAKA_CENTER: [number, number] = [90.4125, 23.8103];

export const DEFAULT_ZOOM = 11;

export function mapboxToken(): string {
  const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!t) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn("NEXT_PUBLIC_MAPBOX_TOKEN is not set — map will fail to render.");
    }
    return "";
  }
  return t;
}

/** Bounds expansion helper: returns [[minLng,minLat],[maxLng,maxLat]] padded. */
export function expandBounds(
  pts: Array<[number, number]>,
  paddingDeg = 0.01,
): [[number, number], [number, number]] | null {
  if (pts.length === 0) return null;
  let minLng = pts[0][0];
  let maxLng = pts[0][0];
  let minLat = pts[0][1];
  let maxLat = pts[0][1];
  for (const [lng, lat] of pts) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng - paddingDeg, minLat - paddingDeg],
    [maxLng + paddingDeg, maxLat + paddingDeg],
  ];
}
