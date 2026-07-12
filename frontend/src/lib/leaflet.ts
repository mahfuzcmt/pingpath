// Centralized Leaflet config so the dashboard, geofence editor, and trip
// playback share tile provider + Bangladesh defaults.

import L from "leaflet";

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

// ---------------------------------------------------------------------------
// Base layer factory — Google Maps when a key is configured, OSM/Esri fallback.
//
// OSM's Bangladesh coverage misses roads/buildings/POIs, so production uses the
// official Google Maps JS API rendered as a Leaflet layer via the GoogleMutant
// plugin (ToS-compliant: it embeds the real Google map, billed as Dynamic Map
// loads). Without NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (e.g. local dev) we fall
// back to the previous free OSM + Esri satellite tiles so maps still render.
// ---------------------------------------------------------------------------

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export type BaseLayerKind = "street" | "satellite";

declare global {
  interface Window {
    google?: { maps?: unknown };
    __mlGoogleMapsReady?: () => void;
  }
}

let googleMapsLoader: Promise<boolean> | null = null;

/** Load the Google Maps JS API once. Resolves false when no key / load error. */
function loadGoogleMaps(): Promise<boolean> {
  if (!GOOGLE_MAPS_API_KEY || typeof window === "undefined") return Promise.resolve(false);
  if (window.google?.maps) return Promise.resolve(true);
  if (!googleMapsLoader) {
    googleMapsLoader = new Promise<boolean>((resolve) => {
      window.__mlGoogleMapsReady = () => resolve(true);
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js" +
        `?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
        "&loading=async&callback=__mlGoogleMapsReady";
      script.async = true;
      script.onerror = () => {
        googleMapsLoader = null; // allow retry on next map mount
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  return googleMapsLoader;
}

/**
 * Create the base map layer. Async because the Google JS API loads lazily;
 * callers should guard against the map being torn down before it resolves.
 */
export async function createBaseLayer(kind: BaseLayerKind = "street"): Promise<L.GridLayer> {
  if (await loadGoogleMaps()) {
    // Attaches L.gridLayer.googleMutant; import lazily so the plugin (which
    // touches window) never runs during SSR and stays out of the no-key path.
    await import("leaflet.gridlayer.googlemutant");
    return L.gridLayer.googleMutant({
      type: kind === "satellite" ? "hybrid" : "roadmap",
      maxZoom: 21,
    });
  }
  return kind === "satellite"
    ? L.tileLayer(TILE_URL_SATELLITE, { attribution: SATELLITE_ATTRIBUTION, maxZoom: 19 })
    : L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 });
}

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
