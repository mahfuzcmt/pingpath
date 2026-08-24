"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_ZOOM,
  DHAKA_CENTER,
  createBaseLayer,
  expandBounds,
  calculateFitZoom,
  layerSupportsTraffic,
  setLayerTraffic,
  hasGoogleMapsKey,
  type BaseLayerKind,
} from "@/lib/leaflet";
import { MapLayerDropdown } from "./MapLayerDropdown";
import { MapToolbar } from "./MapToolbar";
import { filterSpeed, formatSince, vehicleState, VEHICLE_STATE_COLOR, type VehicleState } from "@/lib/format";
import { buildVehicleSvg } from "@/lib/vehicleIcons";
import { useSpeedLimits } from "@/hooks/useSpeedLimits";
import type { DeviceView, LocationView } from "@/types/domain";
import { type LiveLocationView, getInterpolatedPosition, isAnimating } from "@/hooks/useLiveLocations";

interface FleetMapProps {
  devices: DeviceView[];
  locations: Map<string, LocationView | LiveLocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
  /** AutoNemo "Refresh" control — re-pull last-known positions. */
  onRefresh?: () => void | Promise<void>;
  /** Last refresh timestamp for countdown timer. */
  lastRefreshAt?: Date | null;
  /** Address search box (geocoding). Off by default — single-vehicle embeds don't need it. */
  showSearch?: boolean;
  /** Callback to advance waypoint animations. Called from the animation loop. */
  onAdvanceAnimations?: () => boolean;
}

const OVERSPEED_COLOR = "#DC2626";

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

/** Cache key for address lookups (rounded to ~100m precision to reduce API calls) */
function addressCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

/** Global address cache (persists across re-renders) */
const addressCache = new Map<string, string>();

/** Reverse geocode coordinates to address using Nominatim */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = addressCacheKey(lat, lng);
  if (addressCache.has(key)) {
    return addressCache.get(key)!;
  }

  try {
    // Use zoom=19 for maximum detail (building level)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MotoLink GPS Tracker"
      }
    });
    if (!res.ok) throw new Error("Geocoding failed");

    const data = await res.json();

    // Build detailed address from the response
    let address = "";
    if (data.address) {
      const parts: string[] = [];
      const addr = data.address;

      // Most specific first: house number + road
      if (addr.house_number) {
        parts.push(`House ${addr.house_number}`);
      }
      if (addr.road) {
        parts.push(addr.road);
      }
      // Add area/neighborhood
      if (addr.neighbourhood) {
        parts.push(addr.neighbourhood);
      } else if (addr.suburb) {
        parts.push(addr.suburb);
      } else if (addr.residential) {
        parts.push(addr.residential);
      }
      // Add city/town/village
      if (addr.city) {
        parts.push(addr.city);
      } else if (addr.town) {
        parts.push(addr.town);
      } else if (addr.village) {
        parts.push(addr.village);
      } else if (addr.county) {
        parts.push(addr.county);
      }
      // Add district if different from city
      if (addr.state_district && addr.state_district !== addr.city) {
        parts.push(addr.state_district);
      }

      // Join up to 4 parts for a detailed address
      address = parts.slice(0, 4).join(", ");

      // Fallback to display_name if no parts found
      if (!address && data.display_name) {
        address = data.display_name.split(",").slice(0, 4).join(",").trim();
      }
      if (!address) address = "Unknown location";
    } else {
      address = data.display_name?.split(",").slice(0, 4).join(",").trim() || "Unknown location";
    }

    addressCache.set(key, address);
    return address;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// Default to google-street if Google API key is available, otherwise OSM
const getDefaultLayer = (): BaseLayerKind => hasGoogleMapsKey() ? "google-street" : "osm";

const STATE_TEXT: Record<VehicleState, string> = {
  moving: "Moving",
  idle: "Idle",
  stopped: "Stopped",
  offline: "Offline",
  expired: "Expired",
  nodata: "No Data",
};

function formatDateTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const date = new Date(ts);
  return date.toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// Marker color + status text now follow the shared 6-state model, so the map
// matches the Vehicles screen (green=moving, purple=idle, red=stopped, …).
function markerColor(device: DeviceView | undefined, location: LocationView | undefined): string {
  if (!device) return VEHICLE_STATE_COLOR.offline;
  return VEHICLE_STATE_COLOR[vehicleState(device, location)];
}

function statusText(device: DeviceView | undefined, location: LocationView | undefined): string {
  if (!device) return "Offline";
  return STATE_TEXT[vehicleState(device, location)];
}

/**
 * True when the device is still transmitting but its newest packet carried no GPS
 * fix — the coordinates on screen are the last confirmed position, not a live one.
 */
function hasNoFix(location: LocationView | undefined): boolean {
  return location != null && !location.valid;
}

/** Stale threshold in milliseconds (5 minutes for GPS data) */
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

/** Freshness thresholds in milliseconds for UI feedback */
const FRESHNESS_LIVE_MS = 30 * 1000;    // 🟢 Live: < 30 seconds
const FRESHNESS_STALE_MS = 60 * 1000;   // 🟡 Stale: 30-60 seconds
// > 60 seconds = 🔴 No Signal

/**
 * True when the last location update is older than STALE_THRESHOLD_MS.
 * Stale data means the GPS position shown may not reflect current location.
 */
function isStaleData(location: LocationView | undefined, device: DeviceView | undefined): boolean {
  const ts = location?.ts || device?.lastSeenAt;
  if (!ts) return true;
  const age = Date.now() - new Date(ts).getTime();
  return age > STALE_THRESHOLD_MS;
}

/**
 * Returns freshness status based on the actual GPS timestamp.
 * This shows how old the data really is (🟢/🟡/🔴 indicator).
 */
type FreshnessStatus = "live" | "stale" | "no-signal";

function getFreshnessStatus(location: LocationView | LiveLocationView | undefined): FreshnessStatus {
  if (!location) return "no-signal";

  // Use the actual GPS timestamp to calculate real data age
  const gpsTime = new Date(location.ts).getTime();
  const age = Date.now() - gpsTime;

  if (age < FRESHNESS_LIVE_MS) return "live";
  if (age < FRESHNESS_STALE_MS) return "stale";
  return "no-signal";
}

/**
 * Returns the seconds since the GPS timestamp, for "X sec ago" display.
 * This shows the real age of the data, not when frontend received it.
 */
function getSecondsSinceUpdate(location: LocationView | LiveLocationView | undefined): number {
  if (!location) return 999;
  const gpsTime = new Date(location.ts).getTime();
  return Math.floor((Date.now() - gpsTime) / 1000);
}

/**
 * Checks if location was just updated (for pulse animation).
 */
function isJustUpdated(location: LocationView | LiveLocationView | undefined): boolean {
  if (!location) return false;
  return (location as LiveLocationView).justUpdated === true;
}

const FRESHNESS_CONFIG = {
  live: { label: "Live", color: "#16A34A", icon: "🟢", bgColor: "rgba(22, 163, 74, 0.15)" },
  stale: { label: "Stale", color: "#F59E0B", icon: "🟡", bgColor: "rgba(245, 158, 11, 0.15)" },
  "no-signal": { label: "No Signal", color: "#DC2626", icon: "🔴", bgColor: "rgba(220, 38, 38, 0.15)" },
} as const;

/**
 * Returns human-readable GPS quality status with icon
 */
function gpsQualityInfo(location: LocationView | undefined, device: DeviceView | undefined): { status: string; color: string; icon: string } {
  const stale = isStaleData(location, device);
  const noFix = hasNoFix(location);

  if (!location && !device?.lastSeenAt) {
    return { status: "No Data", color: "#D97706", icon: "⚠" };
  }
  if (noFix && stale) {
    return { status: "GPS Lost", color: "#DC2626", icon: "✕" };
  }
  if (noFix) {
    return { status: "No GPS Fix", color: "#F59E0B", icon: "?" };
  }
  if (stale) {
    return { status: "Stale Data", color: "#F59E0B", icon: "⏱" };
  }
  return { status: "Live", color: "#16A34A", icon: "●" };
}

// Vehicle marker: top-down realistic vehicle icon, centered on position.
function createVehicleIcon(
  vehicleType: string | null | undefined,
  bodyColor: string,
  rotation: number,
  isSelected: boolean,
  isOverspeed = false,
  noFix = false,
  isMoving = false,
  isStale = false,
  justUpdated = false,
  speed = 0,
): L.DivIcon {
  // GoMax-style: smaller icons to fit on roads (was 44/40, now 32/28)
  const baseSize = isSelected ? 32 : 28;
  const classes = [
    'pp-vehicle-icon',
    isSelected && 'pp-selected',
    isOverspeed && 'pp-overspeed',
    noFix && 'pp-nofix',
    isStale && 'pp-stale',
    isMoving && !isOverspeed && 'pp-moving',
    justUpdated && 'pp-just-updated',
    // Speed-based intensity classes
    speed > 80 && !isOverspeed && 'pp-very-high-speed',
    speed > 50 && speed <= 80 && !isOverspeed && 'pp-high-speed',
  ].filter(Boolean).join(' ');

  // Add GPS warning badge for nofix or stale (scaled for smaller icon)
  const warningBadge = (noFix || isStale) ? `
    <div class="pp-gps-badge" style="
      position: absolute;
      top: -3px;
      right: -3px;
      width: 12px;
      height: 12px;
      background: ${noFix ? '#DC2626' : '#F59E0B'};
      border: 1.5px solid #0A1928;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: bold;
      color: white;
      z-index: 10;
    ">${noFix ? '?' : '!'}</div>
  ` : '';

  return L.divIcon({
    html: `<div style="position: relative;">${buildVehicleSvg(vehicleType, isOverspeed ? OVERSPEED_COLOR : bodyColor, rotation, baseSize)}${warningBadge}</div>`,
    className: classes,
    iconSize: [baseSize, baseSize],
    iconAnchor: [baseSize / 2, baseSize / 2], // Center anchor for top-down view
  });
}

// Compact plate-number pill with speed inline (professional style).
function plateLabelHtml(device: DeviceView | undefined, location: LocationView | LiveLocationView | undefined, stateColor: string): string {
  const text = device?.vehiclePlate || device?.name || device?.imei.slice(-8) || "—";
  const speed = filterSpeed(location?.speed, location?.valid);
  const gpsInfo = gpsQualityInfo(location, device);
  const showWarning = gpsInfo.status !== "Live";

  // Freshness status for real-time feedback
  const freshness = getFreshnessStatus(location);
  const freshnessConfig = FRESHNESS_CONFIG[freshness];
  const secondsAgo = getSecondsSinceUpdate(location);
  const justUpdated = isJustUpdated(location);

  const warningIndicator = showWarning
    ? `<span class="pp-label-gps" style="background: ${gpsInfo.color};" title="${gpsInfo.status}">${gpsInfo.icon}</span>`
    : '';

  // Freshness indicator with seconds ago
  const freshnessIndicator = `<span class="pp-label-freshness ${justUpdated ? 'pp-label-pulse' : ''}" style="background: ${freshnessConfig.bgColor}; color: ${freshnessConfig.color};" title="${freshnessConfig.label}">${freshnessConfig.icon} ${secondsAgo}s</span>`;

  return `<div class="pp-label${showWarning ? ' pp-label-warning' : ''}" style="--state-color:${stateColor}">
    ${warningIndicator}
    <span class="pp-label-name">${text}</span>
    <span class="pp-label-speed">${speed} kph</span>
    ${freshnessIndicator}
  </div>`;
}

/**
 * Global data freshness indicator showing overall system status.
 * Shows how fresh the most recent GPS data is across all devices.
 */
function GlobalFreshnessIndicator({
  locations,
  lastRefreshAt,
}: {
  locations: Map<string, LocationView | LiveLocationView>;
  lastRefreshAt?: Date | null;
}) {
  // Find the most recent GPS timestamp across all locations
  let mostRecentGpsTime = 0;
  let liveCount = 0;
  let staleCount = 0;
  let noSignalCount = 0;

  for (const loc of locations.values()) {
    const gpsTime = new Date(loc.ts).getTime();
    if (gpsTime > mostRecentGpsTime) {
      mostRecentGpsTime = gpsTime;
    }

    const freshness = getFreshnessStatus(loc);
    if (freshness === "live") liveCount++;
    else if (freshness === "stale") staleCount++;
    else noSignalCount++;
  }

  const totalDevices = locations.size;
  const now = Date.now();
  const secondsAgo = mostRecentGpsTime ? Math.floor((now - mostRecentGpsTime) / 1000) : 999;
  const overallFreshness = getFreshnessStatusFromAge(secondsAgo);
  const config = FRESHNESS_CONFIG[overallFreshness];

  // Determine if we should show "pulsing live" status
  const isLive = secondsAgo < 30;

  if (totalDevices === 0) return null;

  return (
    <div className="absolute bottom-6 left-3 z-[1000] flex items-center gap-2">
      {/* Overall system status */}
      <div
        className={`glass-btn flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
          isLive ? "pp-global-live" : ""
        }`}
        style={{ borderColor: `${config.color}40` }}
      >
        <span className="pp-status-dot" style={{ background: config.color }} />
        <span style={{ color: config.color }}>
          {isLive ? "LIVE" : secondsAgo < 60 ? `${secondsAgo}s` : secondsAgo < 3600 ? `${Math.floor(secondsAgo / 60)}m` : "—"}
        </span>
        <span className="text-ink-400">|</span>
        <span className="text-ink-100">
          <span style={{ color: FRESHNESS_CONFIG.live.color }}>{liveCount}</span>
          {" / "}
          <span style={{ color: FRESHNESS_CONFIG.stale.color }}>{staleCount}</span>
          {" / "}
          <span style={{ color: FRESHNESS_CONFIG["no-signal"].color }}>{noSignalCount}</span>
        </span>
      </div>
    </div>
  );
}

/** Helper to get freshness status from seconds age */
function getFreshnessStatusFromAge(secondsAgo: number): FreshnessStatus {
  if (secondsAgo < 30) return "live";
  if (secondsAgo < 60) return "stale";
  return "no-signal";
}

/** Countdown timer for next batch update */
function BatchCountdown({ lastRefreshAt }: { lastRefreshAt: Date | null }) {
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!lastRefreshAt) {
      setSecondsLeft(10);
      return;
    }

    const updateCountdown = () => {
      const elapsed = (Date.now() - lastRefreshAt.getTime()) / 1000;
      const remaining = Math.max(0, Math.ceil(10 - elapsed));
      setSecondsLeft(remaining);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastRefreshAt]);

  return (
    <div className="glass-btn flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium text-ink-600">
      <div
        className={`h-1.5 w-1.5 rounded-full ${secondsLeft <= 2 ? "animate-pulse bg-brand-500" : "bg-emerald-500"}`}
      />
      <span>Next update in {secondsLeft}s</span>
    </div>
  );
}

export function FleetMap({ devices, locations, selectedImei, onSelect, onRefresh, lastRefreshAt, showSearch = false, onAdvanceAnimations }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const initialFitDoneRef = useRef(false);
  const tileLayerRef = useRef<L.GridLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const locationsRef = useRef<Map<string, LocationView | LiveLocationView>>(locations);
  const trailsRef = useRef<Map<string, L.Polyline>>(new Map());
  const trailPointsRef = useRef<Map<string, Array<[number, number]>>>(new Map());
  const predictiveMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const [baseLayer, setBaseLayer] = useState<BaseLayerKind>(getDefaultLayer);
  const [googleAvailable, setGoogleAvailable] = useState(hasGoogleMapsKey);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [trafficAvailable, setTrafficAvailable] = useState(false);
  const showTrafficRef = useRef(showTraffic);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [autoFollow, setAutoFollow] = useState(true); // Auto-follow selected vehicle
  const [showTrails, setShowTrails] = useState(false); // Motion trails (off by default, like GoMax)
  const showTrailsRef = useRef(showTrails);
  const [, setTick] = useState(0); // Force re-render every second for freshness timer

  const speedLimits = useSpeedLimits();

  // Tick every second to update the "X sec ago" freshness display
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const deviceByImei = useMemo(() => {
    const m = new Map<string, DeviceView>();
    for (const d of devices) m.set(d.imei, d);
    return m;
  }, [devices]);

  // Function to create popup content
  const createPopupContent = useCallback((device: DeviceView | undefined, location: LocationView | LiveLocationView | undefined): string => {
    const name = device?.name || device?.vehiclePlate || device?.imei.slice(-8) || "Unknown";
    const lat = location?.latitude?.toFixed(6) || "—";
    const lng = location?.longitude?.toFixed(6) || "—";
    const speed = filterSpeed(location?.speed, location?.valid);
    const dateTime = formatDateTime(location?.ts || device?.lastSeenAt);
    const overspeed = device != null && speedLimits.isOverspeed(device.imei, location?.speed);
    const status = overspeed ? "Overspeed" : statusText(device, location);
    const statusColor = overspeed ? OVERSPEED_COLOR : markerColor(device, location);
    const accStatus = location?.accOn == null ? "—" : location.accOn ? "ON" : "OFF";
    const gpsInfo = gpsQualityInfo(location, device);
    const parkedRow = device?.parkedSince && speed === 0
      ? `<div class="pp-popup-row">
           <span class="pp-popup-label">Parked for</span>
           <span class="pp-popup-value">${formatSince(device.parkedSince)}</span>
         </div>`
      : "";

    // Freshness status for real-time feedback
    const freshness = getFreshnessStatus(location);
    const freshnessConfig = FRESHNESS_CONFIG[freshness];
    const secondsAgo = getSecondsSinceUpdate(location);
    const freshnessText = secondsAgo < 60
      ? `${secondsAgo}s ago`
      : secondsAgo < 3600
        ? `${Math.floor(secondsAgo / 60)}m ago`
        : `${Math.floor(secondsAgo / 3600)}h ago`;

    // GPS quality warning banner
    const gpsWarningBanner = gpsInfo.status !== "Live"
      ? `<div class="pp-popup-gps-warning" style="background: ${gpsInfo.color}15; border-left: 3px solid ${gpsInfo.color}; color: ${gpsInfo.color};">
           <span class="pp-popup-gps-icon">${gpsInfo.icon}</span>
           <span class="pp-popup-gps-text">${gpsInfo.status} - Position may be inaccurate</span>
         </div>`
      : "";

    return `
      <div class="pp-popup">
        <div class="pp-popup-header">
          <span class="pp-popup-name">${name}</span>
          <div class="pp-popup-badges">
            <span class="pp-popup-freshness" style="background: ${freshnessConfig.bgColor}; color: ${freshnessConfig.color};">
              ${freshnessConfig.icon} ${freshnessText}
            </span>
            <span class="pp-popup-status" style="background: ${statusColor}20; color: ${statusColor};">${status}</span>
          </div>
        </div>

        ${gpsWarningBanner}

        <!-- Live Speed Display -->
        <div class="pp-popup-speed-section">
          <div class="pp-popup-speedometer">
            <span class="pp-popup-speed-value">${speed}</span>
            <span class="pp-popup-speed-unit">kph</span>
          </div>
          <div class="pp-popup-speed-label">${gpsInfo.status === "Live" ? "Live Speed" : "Last Known Speed"}</div>
        </div>

        <div class="pp-popup-grid">
          <div class="pp-popup-row">
            <span class="pp-popup-label">GPS</span>
            <span class="pp-popup-value" style="color: ${gpsInfo.color}; font-weight: 600;">${gpsInfo.icon} ${gpsInfo.status}</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">ACC</span>
            <span class="pp-popup-value" style="color: ${accStatus === 'ON' ? '#16A34A' : '#64748B'}; font-weight: 600;">${accStatus}</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">Last Update</span>
            <span class="pp-popup-value">${dateTime}</span>
          </div>
          <div class="pp-popup-row pp-popup-row-full">
            <span class="pp-popup-label">Location</span>
            <span class="pp-popup-value pp-popup-address" data-lat="${lat}" data-lng="${lng}">Loading address...</span>
          </div>
          ${parkedRow}
        </div>

        <!-- Live Tracking Button -->
        <button class="pp-popup-live-btn" data-imei="${device?.imei || ''}" onclick="window.dispatchEvent(new CustomEvent('openLiveTracking', {detail: '${device?.imei || ''}'}))">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          Live Tracking
        </button>
      </div>
    `;
  }, [speedLimits]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const container = containerRef.current;

    const map = L.map(container, {
      center: DHAKA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We use our own MapToolbar instead
      minZoom: 3,         // Prevent zooming out too far
      maxZoom: 18,        // GoMax-style: limit max zoom to prevent excessive detail
    });

    mapRef.current = map;

    // Force map to recalculate size after a brief delay (container may not have final dimensions yet)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Also use ResizeObserver to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Base layer (all 5 types). Owns the tile layer so the dropdown can swap it;
  // runs on mount to create the initial layer too.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    createBaseLayer(baseLayer).then((layer) => {
      // Guard: toggle changed again or map unmounted while Google API loaded.
      if (cancelled || mapRef.current !== map) return;
      tileLayerRef.current?.remove();
      layer.addTo(map);
      layer.bringToBack();
      tileLayerRef.current = layer;
      // Traffic only exists on the Google base layer, not the OSM fallback.
      const supportsTraffic = layerSupportsTraffic(layer);
      setTrafficAvailable(supportsTraffic);
      setGoogleAvailable(supportsTraffic || hasGoogleMapsKey());
      setLayerTraffic(layer, showTrafficRef.current);
    });
    return () => {
      cancelled = true;
    };
  }, [baseLayer]);

  // Toggle Google's live traffic overlay on the current base layer.
  useEffect(() => {
    showTrafficRef.current = showTraffic;
    setLayerTraffic(tileLayerRef.current, showTraffic);
  }, [showTraffic]);

  // Sync showTrailsRef with showTrails state for animation loop access
  useEffect(() => {
    showTrailsRef.current = showTrails;
  }, [showTrails]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleLocate = useCallback(() => {
    const map = mapRef.current;
    if (!map || typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], Math.max(map.getZoom(), 15), { animate: true });
        const icon = L.divIcon({
          html: '<div style="width:14px;height:14px;border-radius:50%;background:#2B82D4;border:3px solid #fff;box-shadow:0 0 0 2px rgba(43,130,212,.4)"></div>',
          className: "pp-user-loc",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        if (userMarkerRef.current) userMarkerRef.current.setLatLng([latitude, longitude]);
        else userMarkerRef.current = L.marker([latitude, longitude], { icon, interactive: false }).addTo(map);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  // Fit map to show all vehicles
  const handleFitAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || locations.size === 0) return;

    const pts: Array<[number, number]> = [];
    for (const l of locations.values()) pts.push([l.latitude, l.longitude]);

    const optimalZoom = calculateFitZoom(pts);

    if (pts.length === 1) {
      map.setView(pts[0], optimalZoom, { animate: true });
    } else {
      const bounds = expandBounds(pts, 0.005);
      if (bounds) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: optimalZoom, animate: true });
      }
    }
  }, [locations]);

  // Sync markers with locations
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    for (const [imei, loc] of locations.entries()) {
      seen.add(imei);
      const device = deviceByImei.get(imei);
      const isOverspeed = speedLimits.isOverspeed(imei, loc.speed);
      const color = isOverspeed ? OVERSPEED_COLOR : markerColor(device, loc);
      const isSelected = imei === selectedImei;
      let marker = markersRef.current.get(imei);

      const course = loc.course ?? 0;
      const bodyColor = device?.iconColor || "#E8900A";
      const noFix = hasNoFix(loc);
      const isStale = isStaleData(loc, device);
      const isMoving = filterSpeed(loc.speed, loc.valid) > 0; // Moving if speed above noise threshold
      const justUpdated = isJustUpdated(loc);

      if (!marker) {
        // Create new marker
        const icon = createVehicleIcon(device?.vehicleType, bodyColor, course, isSelected, isOverspeed, noFix, isMoving, isStale, justUpdated, filterSpeed(loc.speed, loc.valid));
        marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .bindPopup(createPopupContent(device, loc), {
            maxWidth: 320,
            className: 'pp-popup-container',
            autoPanPaddingTopLeft: L.point(60, 60), // Account for left toolbar
            autoPanPaddingBottomRight: L.point(20, 100), // Account for bottom controls
          })
          .bindTooltip(plateLabelHtml(device, loc, color), {
            permanent: true,
            direction: 'top',
            offset: [0, -50],  // Clear teardrop marker height (47-55px)
            className: 'pp-plate-tooltip',
          });

        marker.on('click', () => {
          onSelect(imei);
        });

        // Fetch and display address when popup opens
        const currentMarker = marker; // Capture for closure
        currentMarker.on('popupopen', () => {
          const popup = currentMarker.getPopup();
          if (!popup) return;
          const container = popup.getElement();
          if (!container) return;
          const addressEl = container.querySelector('.pp-popup-address') as HTMLElement;
          if (!addressEl) return;

          const lat = parseFloat(addressEl.dataset.lat || "0");
          const lng = parseFloat(addressEl.dataset.lng || "0");
          if (lat === 0 && lng === 0) return;

          // Check cache first
          const key = addressCacheKey(lat, lng);
          if (addressCache.has(key)) {
            addressEl.textContent = addressCache.get(key)!;
          } else {
            // Fetch async
            reverseGeocode(lat, lng).then(address => {
              addressEl.textContent = address;
            });
          }
        });

        markersRef.current.set(imei, marker);
      } else {
        // Update existing marker - GoMax style: update position directly, CSS transition handles smooth animation
        // Update icon, popup, tooltip, and POSITION
        marker.setIcon(createVehicleIcon(device?.vehicleType, bodyColor, course, isSelected, isOverspeed, noFix, isMoving, isStale, justUpdated, filterSpeed(loc.speed, loc.valid)));
        marker.setPopupContent(createPopupContent(device, loc));
        marker.setTooltipContent(plateLabelHtml(device, loc, color));

        // Update position - CSS transition will animate smoothly
        const currentLatLng = marker.getLatLng();
        if (currentLatLng.lat !== loc.latitude || currentLatLng.lng !== loc.longitude) {
          marker.setLatLng([loc.latitude, loc.longitude]);
        }

        // Auto-follow: pan map to keep selected vehicle in view when position changes
        if (autoFollow && isSelected && map) {
          const bounds = map.getBounds();
          const point = L.latLng(loc.latitude, loc.longitude);
          // Only pan if vehicle moved outside visible area (with some padding)
          const paddedBounds = bounds.pad(-0.2); // 20% padding from edges
          if (!paddedBounds.contains(point)) {
            map.panTo(point, { animate: true, duration: 0.5 });
          }
        }
      }
    }

    // Remove markers whose device disappeared from snapshot
    for (const [imei, marker] of markersRef.current.entries()) {
      if (!seen.has(imei)) {
        marker.remove();
        markersRef.current.delete(imei);
        // Also clean up trails and predictive markers
        const trail = trailsRef.current.get(imei);
        if (trail) {
          trail.remove();
          trailsRef.current.delete(imei);
        }
        trailPointsRef.current.delete(imei);
        const predictive = predictiveMarkersRef.current.get(imei);
        if (predictive) {
          predictive.remove();
          predictiveMarkersRef.current.delete(imei);
        }
      }
    }

    // First-load fit-to-bounds — dynamically zoom based on vehicle spread
    if (!initialFitDoneRef.current && locations.size > 0) {
      const pts: Array<[number, number]> = [];
      for (const l of locations.values()) pts.push([l.latitude, l.longitude]);

      // Calculate optimal zoom: close for 1 vehicle, wider for spread-out fleet
      const optimalZoom = calculateFitZoom(pts);

      if (pts.length === 1) {
        // Single vehicle: center directly with close zoom
        map.setView(pts[0], optimalZoom, { animate: false });
      } else {
        // Multiple vehicles: fit bounds with dynamic maxZoom
        const bounds = expandBounds(pts, 0.005); // smaller padding for tighter fit
        if (bounds) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: optimalZoom });
        }
      }
      initialFitDoneRef.current = true;
    }
  }, [locations, deviceByImei, selectedImei, onSelect, createPopupContent, speedLimits, autoFollow]);

  // Keep locationsRef in sync with state (doesn't trigger animation restart)
  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  // 60fps animation loop for smooth marker interpolation between batch updates
  // Uses ref to avoid restarting on every state change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let running = true;
    let frameCount = 0;

    // Maximum trail points to keep (fades out older points)
    const MAX_TRAIL_POINTS = 15;
    // Minimum distance (meters) between trail points to avoid clustering
    const MIN_TRAIL_DISTANCE = 5;

    // Calculate distance between two points in meters (Haversine approximation)
    const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371000; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Create or update trail polyline with gradient effect
    const updateTrail = (imei: string, points: Array<[number, number]>, speed: number) => {
      const existingTrail = trailsRef.current.get(imei);

      if (points.length < 2) {
        // Remove trail if less than 2 points
        if (existingTrail) {
          existingTrail.remove();
          trailsRef.current.delete(imei);
        }
        return;
      }

      // Speed-based trail color: green for slow, orange for medium, red for fast
      const trailColor = speed > 60 ? '#DC2626' : speed > 30 ? '#E8900A' : '#16A34A';
      const trailOpacity = Math.min(0.8, 0.3 + (speed / 100));

      if (existingTrail) {
        existingTrail.setLatLngs(points);
        existingTrail.setStyle({ color: trailColor, opacity: trailOpacity });
      } else {
        const trail = L.polyline(points, {
          color: trailColor,
          weight: 3,
          opacity: trailOpacity,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'pp-motion-trail',
        }).addTo(map);
        trail.bringToBack();
        trailsRef.current.set(imei, trail);
      }
    };

    // Create predictive position marker (ghost showing where vehicle is heading)
    const updatePredictiveMarker = (imei: string, lat: number, lng: number, course: number, speed: number) => {
      if (speed < 5) {
        // Remove predictive marker if vehicle is slow/stopped
        const existing = predictiveMarkersRef.current.get(imei);
        if (existing) {
          existing.remove();
          predictiveMarkersRef.current.delete(imei);
        }
        return;
      }

      // Calculate predicted position (3 seconds ahead based on speed and course)
      const predictSeconds = 3;
      const distanceM = (speed * 1000 / 3600) * predictSeconds; // meters in predictSeconds
      const R = 6371000; // Earth's radius in meters
      const courseRad = course * Math.PI / 180;

      const lat1 = lat * Math.PI / 180;
      const lng1 = lng * Math.PI / 180;

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distanceM / R) +
        Math.cos(lat1) * Math.sin(distanceM / R) * Math.cos(courseRad)
      );
      const lng2 = lng1 + Math.atan2(
        Math.sin(courseRad) * Math.sin(distanceM / R) * Math.cos(lat1),
        Math.cos(distanceM / R) - Math.sin(lat1) * Math.sin(lat2)
      );

      const predictedLat = lat2 * 180 / Math.PI;
      const predictedLng = lng2 * 180 / Math.PI;

      const existing = predictiveMarkersRef.current.get(imei);
      if (existing) {
        existing.setLatLng([predictedLat, predictedLng]);
      } else {
        const predictiveMarker = L.circleMarker([predictedLat, predictedLng], {
          radius: 4,
          color: '#E8900A',
          fillColor: '#E8900A',
          fillOpacity: 0.4,
          weight: 2,
          opacity: 0.6,
          className: 'pp-predictive-marker',
        }).addTo(map);
        predictiveMarker.bringToBack();
        predictiveMarkersRef.current.set(imei, predictiveMarker);
      }
    };

    const animate = () => {
      if (!running) return;

      const currentLocations = locationsRef.current;
      if (currentLocations.size === 0) {
        // No locations yet, keep polling
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      frameCount++;

      // GoMax-style: NO JavaScript position interpolation
      // Marker positions are updated in the marker sync useEffect when data changes
      // CSS transitions handle the smooth animation automatically

      // Only handle trail updates if enabled (every 30 frames = ~2/sec to reduce load)
      if (showTrailsRef.current && frameCount % 30 === 0) {
        for (const [imei, loc] of currentLocations.entries()) {
          const marker = markersRef.current.get(imei);
          if (!marker) continue;

          const currentLatLng = marker.getLatLng();
          const currentLat = currentLatLng.lat;
          const currentLng = currentLatLng.lng;
          const speed = filterSpeed(loc.speed, loc.valid);

          if (speed > 3) {
            const trailPoints = trailPointsRef.current.get(imei) || [];
            const lastPoint = trailPoints[trailPoints.length - 1];

            // Only add point if moved minimum distance (avoid clustering)
            if (!lastPoint || getDistance(lastPoint[0], lastPoint[1], currentLat, currentLng) > MIN_TRAIL_DISTANCE) {
              trailPoints.push([currentLat, currentLng]);

              // Keep only recent points (creates fading trail effect)
              while (trailPoints.length > MAX_TRAIL_POINTS) {
                trailPoints.shift();
              }

              trailPointsRef.current.set(imei, trailPoints);
              updateTrail(imei, trailPoints, speed);
            }

            // Update predictive marker
            updatePredictiveMarker(imei, currentLat, currentLng, loc.course ?? 0, speed);
          } else {
            // Clear trail when vehicle stops
            const trail = trailsRef.current.get(imei);
            if (trail) {
              trail.remove();
              trailsRef.current.delete(imei);
            }
            trailPointsRef.current.delete(imei);

            // Clear predictive marker
            const predictive = predictiveMarkersRef.current.get(imei);
            if (predictive) {
              predictive.remove();
              predictiveMarkersRef.current.delete(imei);
            }
          }
        }
      } else if (!showTrailsRef.current && frameCount % 60 === 0) {
        // Clean up trails if disabled (once per second)
        for (const [imei] of currentLocations.entries()) {
          const trail = trailsRef.current.get(imei);
          if (trail) {
            trail.remove();
            trailsRef.current.delete(imei);
          }
          trailPointsRef.current.delete(imei);
          const predictive = predictiveMarkersRef.current.get(imei);
          if (predictive) {
            predictive.remove();
            predictiveMarkersRef.current.delete(imei);
          }
        }
      }

      // Always continue the animation loop (don't stop between batches)
      // This prevents markers from vanishing when animation finishes
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop once and keep it running
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Cleanup trails and predictive markers
      for (const trail of trailsRef.current.values()) {
        trail.remove();
      }
      trailsRef.current.clear();
      for (const pred of predictiveMarkersRef.current.values()) {
        pred.remove();
      }
      predictiveMarkersRef.current.clear();
    };
  }, [onAdvanceAnimations]); // Only restart if onAdvanceAnimations changes (it shouldn't)

  // Address search (Nominatim; biased to the current viewport). Free, no key —
  // matches the OSM fallback strategy of lib/leaflet.ts.
  const runSearch = useCallback(async () => {
    const q = searchQ.trim();
    if (!q) return;
    setSearching(true);
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
      const map = mapRef.current;
      if (map) {
        const b = map.getBounds();
        url += `&viewbox=${b.getWest()},${b.getNorth()},${b.getEast()},${b.getSouth()}`;
      }
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
      setSearchResults(
        data.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })),
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQ]);

  const gotoSearchResult = useCallback((r: GeocodeResult) => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([r.lat, r.lng], Math.max(map.getZoom(), 16), { animate: true });
    const icon = L.divIcon({
      html: '<div class="pp-search-pin"></div>',
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    if (searchMarkerRef.current) searchMarkerRef.current.setLatLng([r.lat, r.lng]);
    else searchMarkerRef.current = L.marker([r.lat, r.lng], { icon, interactive: false }).addTo(map);
    setSearchResults([]);
  }, []);

  // Track previous selection to avoid re-opening popup on refresh
  const prevSelectedImeiRef = useRef<string | null>(null);

  // Pan to selection (only open popup when selection actually changes)
  useEffect(() => {
    if (!selectedImei) {
      prevSelectedImeiRef.current = null;
      return;
    }
    const map = mapRef.current;
    const loc = locations.get(selectedImei);
    const marker = markersRef.current.get(selectedImei);
    if (map && loc) {
      // Only pan and open popup if selection changed (not on every refresh)
      const selectionChanged = prevSelectedImeiRef.current !== selectedImei;
      if (selectionChanged) {
        map.setView([loc.latitude, loc.longitude], Math.max(map.getZoom(), 14), { animate: true });
        if (marker) {
          marker.openPopup();
        }
        prevSelectedImeiRef.current = selectedImei;
      }
    }
  }, [selectedImei, locations]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: "400px" }}>
      <div ref={containerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />

      {/* Batch update countdown (top-left, above toolbar) */}
      {lastRefreshAt && (
        <div className="absolute left-3 top-3 z-[1000]">
          <BatchCountdown lastRefreshAt={lastRefreshAt} />
        </div>
      )}

      {/* Map toolbar (top-left) — zoom, measure, fit all, locate */}
      <MapToolbar
        map={mapRef.current}
        onFitAll={handleFitAll}
        onLocate={handleLocate}
        locating={locating}
        disabled={locations.size === 0}
        className={lastRefreshAt ? "top-10" : "top-3"}
      />

      {/* Address search (top-left, beside toolbar when enabled) - Glassy */}
      {showSearch && (
        <div className={`absolute left-14 z-[1000] w-64 ${lastRefreshAt ? "top-10" : "top-3"}`}>
          <div className="glass-btn flex overflow-hidden rounded-xl">
            <input
              type="search"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-ink-900 outline-none placeholder:text-ink-400"
              placeholder="Search address…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch();
                if (e.key === "Escape") setSearchResults([]);
              }}
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching || !searchQ.trim()}
              className="px-3 text-ink-500 transition hover:text-ink-900 disabled:opacity-50"
              title="Search"
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"
                className={searching ? "animate-pulse" : ""}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul className="glass-panel mt-2 max-h-56 overflow-y-auto rounded-xl">
              {searchResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => gotoSearchResult(r)}
                    className="block w-full border-b border-surface-200/50 px-3 py-2 text-left text-[11px] text-ink-700 transition last:border-b-0 hover:bg-white/60"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Map controls (top-right) — Layer dropdown + Show Traffic + Auto-follow - Glassy */}
      <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2">
        {/* Auto-follow toggle - only show when a vehicle is selected */}
        {selectedImei && (
          <label
            className={`glass-btn flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              autoFollow
                ? "!bg-brand-500/90 !border-brand-400/50 text-white"
                : "text-ink-900"
            }`}
            title={autoFollow ? "Map follows selected vehicle" : "Click to follow selected vehicle"}
          >
            <input
              type="checkbox"
              checked={autoFollow}
              onChange={(e) => setAutoFollow(e.target.checked)}
              className="sr-only"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Follow
          </label>
        )}
        {trafficAvailable && (
          <label className="glass-btn flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-900">
            <input
              type="checkbox"
              checked={showTraffic}
              onChange={(e) => setShowTraffic(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-500"
            />
            Traffic
          </label>
        )}
        <MapLayerDropdown
          currentLayer={baseLayer}
          onChange={setBaseLayer}
          googleAvailable={googleAvailable}
        />
      </div>

      {/* Global data freshness indicator (bottom-left) */}
      <GlobalFreshnessIndicator locations={locations} lastRefreshAt={lastRefreshAt} />

      {/* Refresh button (bottom-right) - Glassy */}
      <div className="absolute bottom-6 right-3 z-[1000]">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={!onRefresh || refreshing}
          title="Refresh positions"
          className="glass-btn flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 disabled:opacity-60"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={refreshing ? "animate-spin" : ""}
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      <style jsx global>{`
        .pp-vehicle-icon {
          transition: transform 300ms ease-out;
        }
        /* GoMax-style smooth position transitions - CSS handles the animation */
        .leaflet-marker-icon {
          transition: transform 1s ease-out !important;
        }
        .leaflet-marker-pane .leaflet-marker-icon {
          will-change: transform;
        }
        .pp-vehicle-icon.pp-selected {
          filter: drop-shadow(0 0 6px #e8900a);
          z-index: 1000 !important;
        }
        /* Overspeed: red marker that blinks until speed drops below the rule threshold */
        .pp-vehicle-icon.pp-overspeed {
          animation: pp-blink 1s step-start infinite;
          filter: drop-shadow(0 0 6px #dc2626);
        }
        @keyframes pp-blink {
          50% {
            opacity: 0.25;
          }
        }
        /* Moving vehicle: subtle pulse glow effect */
        .pp-vehicle-icon.pp-moving {
          animation: pp-pulse 2s ease-in-out infinite;
        }
        @keyframes pp-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(22, 163, 74, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(22, 163, 74, 0.9));
          }
        }

        /* Motion trail effect - fading polyline behind moving vehicles */
        .pp-motion-trail {
          pointer-events: none;
          filter: blur(0.5px);
        }

        /* Predictive marker - ghost showing where vehicle is heading */
        .pp-predictive-marker {
          pointer-events: none;
          animation: pp-predictive-pulse 1.5s ease-in-out infinite;
        }
        @keyframes pp-predictive-pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.3);
          }
        }

        /* Speed-based intensity effect (applied via inline style based on speed) */
        .pp-high-speed {
          filter: drop-shadow(0 0 8px rgba(232, 144, 10, 0.9)) brightness(1.1);
        }
        .pp-very-high-speed {
          filter: drop-shadow(0 0 12px rgba(220, 38, 38, 0.9)) brightness(1.15);
          animation: pp-speed-pulse 0.5s ease-in-out infinite;
        }
        @keyframes pp-speed-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(220, 38, 38, 0.9)) brightness(1.15);
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(220, 38, 38, 1)) brightness(1.25);
          }
        }
        /* No GPS fix: the marker sits on the last confirmed position, so mute it
           and ring it to distinguish "stale coordinates" from a live vehicle. */
        .pp-vehicle-icon.pp-nofix {
          opacity: 0.55;
        }
        .pp-vehicle-icon.pp-nofix::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px dashed #DC2626;
          border-radius: 50%;
          pointer-events: none;
          animation: pp-nofix-pulse 1.5s ease-in-out infinite;
        }
        @keyframes pp-nofix-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        /* Stale data: position may be outdated */
        .pp-vehicle-icon.pp-stale {
          opacity: 0.65;
        }
        .pp-vehicle-icon.pp-stale::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px dashed #F59E0B;
          border-radius: 50%;
          pointer-events: none;
        }
        /* GPS warning badge on vehicle icon */
        .pp-gps-badge {
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .pp-search-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #e8900a;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px rgba(232, 144, 10, 0.45);
        }
        /* Compact plate + speed label - Glassy style */
        .pp-plate-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .pp-plate-tooltip::before {
          display: none !important;
        }
        .pp-label {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: rgba(15, 39, 66, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(100, 116, 139, 0.2);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          white-space: nowrap;
        }
        .pp-label-name {
          color: #fff;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          background: var(--state-color);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pp-label-speed {
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          padding: 4px 6px;
        }
        /* GPS warning indicator in plate label */
        .pp-label-gps {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 100%;
          min-height: 22px;
          font-size: 10px;
          color: white;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pp-label-warning {
          border: 1px solid rgba(245, 158, 11, 0.5);
        }
        /* Freshness indicator in label */
        .pp-label-freshness {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 8px;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
          white-space: nowrap;
          transition: background 0.3s ease;
        }
        /* Pulse animation when data just arrived */
        .pp-label-pulse {
          animation: pp-freshness-pulse 0.8s ease-out;
        }
        @keyframes pp-freshness-pulse {
          0% {
            transform: scale(1.2);
            box-shadow: 0 0 8px currentColor;
          }
          100% {
            transform: scale(1);
            box-shadow: none;
          }
        }
        /* Just updated vehicle marker - bright glow pulse */
        .pp-vehicle-icon.pp-just-updated {
          animation: pp-data-arrived 0.8s ease-out;
        }
        @keyframes pp-data-arrived {
          0% {
            filter: drop-shadow(0 0 12px rgba(22, 163, 74, 1)) brightness(1.3);
            transform: scale(1.15);
          }
          100% {
            filter: drop-shadow(0 0 4px rgba(22, 163, 74, 0.6));
            transform: scale(1);
          }
        }
        /* Global freshness indicator */
        .pp-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 4px currentColor;
        }
        .pp-global-live .pp-status-dot {
          animation: pp-status-pulse 1.5s ease-in-out infinite;
        }
        @keyframes pp-status-pulse {
          0%, 100% {
            box-shadow: 0 0 4px #16A34A;
            opacity: 1;
          }
          50% {
            box-shadow: 0 0 12px #16A34A, 0 0 20px rgba(22, 163, 74, 0.5);
            opacity: 0.8;
          }
        }

        /* Popup styles - Glassy dark theme */
        .pp-popup-container .leaflet-popup-content-wrapper {
          background: rgba(15, 39, 66, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(100, 116, 139, 0.25);
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35),
                      0 4px 16px rgba(0, 0, 0, 0.2),
                      inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
          max-width: 320px;
          overflow: hidden;
        }
        .pp-popup-container .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        .pp-popup-container .leaflet-popup-close-button {
          color: #94a3b8 !important;
          font-size: 18px;
          padding: 6px 10px;
          right: 4px;
          top: 4px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .pp-popup-container .leaflet-popup-close-button:hover {
          color: #f1f5f9 !important;
          background: rgba(255, 255, 255, 0.1);
        }
        .pp-popup-container .leaflet-popup-tip {
          background: rgba(15, 39, 66, 0.88);
          border: 1px solid rgba(100, 116, 139, 0.25);
          box-shadow: none;
        }
        .pp-popup {
          font-family: 'Inter', sans-serif;
          min-width: 280px;
        }
        .pp-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        }
        .pp-popup-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pp-popup-freshness {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        /* GPS warning banner in popup */
        .pp-popup-gps-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .pp-popup-gps-icon {
          font-size: 14px;
        }
        .pp-popup-gps-text {
          flex: 1;
        }
        .pp-popup-name {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }
        .pp-popup-status {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }

        /* Live Speed Section */
        .pp-popup-speed-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 14px;
          background: linear-gradient(135deg, rgba(232, 144, 10, 0.15) 0%, rgba(232, 144, 10, 0.05) 100%);
          border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        }
        .pp-popup-speedometer {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .pp-popup-speed-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 36px;
          font-weight: 700;
          color: #e8900a;
          line-height: 1;
        }
        .pp-popup-speed-unit {
          font-size: 14px;
          font-weight: 500;
          color: #94a3b8;
        }
        .pp-popup-speed-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .pp-popup-grid {
          padding: 10px 14px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .pp-popup-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pp-popup-row-full {
          grid-column: span 2;
        }
        .pp-popup-nofix {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 6px;
          padding: 6px 8px;
        }
        .pp-popup-nofix .pp-popup-label,
        .pp-popup-nofix .pp-popup-value {
          color: #f59e0b;
        }
        .pp-popup-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .pp-popup-value {
          font-size: 12px;
          color: #e2e8f0;
          font-weight: 500;
        }
        .pp-popup-value.pp-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        .pp-popup-address {
          font-size: 11px;
          line-height: 1.4;
          word-wrap: break-word;
          max-width: 100%;
        }
        .pp-popup-value.pp-speed {
          color: #e8900a;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-popup-value.pp-speed small {
          font-size: 10px;
          font-weight: 400;
          color: #94a3b8;
        }

        /* Live Tracking Button */
        .pp-popup-live-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: calc(100% - 28px);
          margin: 10px 14px 14px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #e8900a 0%, #d97706 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pp-popup-live-btn:hover {
          background: linear-gradient(135deg, #f59e0b 0%, #e8900a 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(232, 144, 10, 0.4);
        }
        .pp-popup-live-btn:active {
          transform: translateY(0);
        }
        .pp-popup-live-btn svg {
          flex-shrink: 0;
        }

        /* Mobile responsive - compact popup */
        @media (max-width: 640px) {
          .pp-popup-container .leaflet-popup-content-wrapper {
            max-width: 280px;
          }
          .pp-popup {
            min-width: 240px;
          }
          .pp-popup-header {
            padding: 8px 10px;
          }
          .pp-popup-name {
            font-size: 12px;
          }
          .pp-popup-status {
            font-size: 9px;
            padding: 2px 6px;
          }
          .pp-popup-speed-section {
            padding: 8px 10px;
          }
          .pp-popup-speed-value {
            font-size: 24px;
          }
          .pp-popup-speed-unit {
            font-size: 11px;
          }
          .pp-popup-speed-label {
            font-size: 9px;
          }
          .pp-popup-grid {
            padding: 6px 10px;
            gap: 4px;
          }
          .pp-popup-label {
            font-size: 9px;
          }
          .pp-popup-value {
            font-size: 10px;
          }
          .pp-popup-value.pp-mono {
            font-size: 9px;
          }
          .pp-popup-live-btn {
            margin: 8px 10px 10px;
            padding: 8px 12px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
