// Centralized Leaflet config so the dashboard, geofence editor, and trip
// playback share tile provider + Bangladesh defaults.

// OpenStreetMap tiles (free, no API key needed)
export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Alternative: CartoDB light/dark themes (also free)
export const TILE_URL_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_URL_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Satellite imagery (Esri World Imagery — free with attribution). Powers the
// AutoNemo-style Normal/Satellite map-view toggle.
export const TILE_URL_SATELLITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const SATELLITE_ATTRIBUTION =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

// Dhaka centre — used as initial map view when no devices yet have a fix.
export const DHAKA_CENTER: [number, number] = [23.8103, 90.4125]; // [lat, lng] for Leaflet

export const DEFAULT_ZOOM = 11;

/** Bounds expansion helper: returns [[minLat, minLng], [maxLat, maxLng]] padded. */
export function expandBounds(
  pts: Array<[number, number]>, // [lat, lng] pairs
  paddingDeg = 0.01,
): [[number, number], [number, number]] | null {
  if (pts.length === 0) return null;
  let minLat = pts[0][0];
  let maxLat = pts[0][0];
  let minLng = pts[0][1];
  let maxLng = pts[0][1];
  for (const [lat, lng] of pts) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return [
    [minLat - paddingDeg, minLng - paddingDeg],
    [maxLat + paddingDeg, maxLng + paddingDeg],
  ];
}
