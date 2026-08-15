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
import { formatSince, dhakaTodayStartIso, vehicleState, VEHICLE_STATE_COLOR, type VehicleState } from "@/lib/format";
import { buildVehicleSvg } from "@/lib/vehicleIcons";
import { useSpeedLimits } from "@/hooks/useSpeedLimits";
import { api } from "@/lib/api";
import type { DeviceView, LocationView, TripView } from "@/types/domain";

interface FleetMapProps {
  devices: DeviceView[];
  locations: Map<string, LocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
  /** AutoNemo "Refresh" control — re-pull last-known positions. */
  onRefresh?: () => void | Promise<void>;
  /** Address search box (geocoding). Off by default — single-vehicle embeds don't need it. */
  showSearch?: boolean;
}

const OVERSPEED_COLOR = "#DC2626";

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

/** Today's summary data per device */
interface TodaySummary {
  durationS: number;
  distanceM: number;
  overspeedDistanceM: number;
  maxSpeed: number;
}

/** Format duration in seconds to "Xh Ym" or "Ym" format */
function formatDurationCompact(seconds: number): string {
  if (seconds < 0) return "—";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

// Vehicle marker: clean top-view silhouette by vehicle type, rotated to the course.
function createVehicleIcon(
  vehicleType: string | null | undefined,
  bodyColor: string,
  rotation: number,
  isSelected: boolean,
  isOverspeed = false,
  noFix = false,
  isMoving = false,
): L.DivIcon {
  const size = isSelected ? 42 : 36;
  const classes = [
    'pp-vehicle-icon',
    isSelected && 'pp-selected',
    isOverspeed && 'pp-overspeed',
    noFix && 'pp-nofix',
    isMoving && !isOverspeed && 'pp-moving', // Don't combine with overspeed animation
  ].filter(Boolean).join(' ');

  return L.divIcon({
    html: buildVehicleSvg(vehicleType, isOverspeed ? OVERSPEED_COLOR : bodyColor, rotation, size),
    className: classes,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Compact plate-number pill with speed inline (professional style).
function plateLabelHtml(device: DeviceView | undefined, location: LocationView | undefined, stateColor: string): string {
  const text = device?.vehiclePlate || device?.name || device?.imei.slice(-8) || "—";
  const speed = location?.speed ?? 0;
  return `<div class="pp-label" style="--state-color:${stateColor}">
    <span class="pp-label-name">${text}</span>
    <span class="pp-label-speed">${speed} kph</span>
  </div>`;
}

// Smoothly animate a marker from its current position to a new position
function animateMarker(
  marker: L.Marker,
  targetLat: number,
  targetLng: number,
  duration: number = 800,
): void {
  const start = marker.getLatLng();
  const startLat = start.lat;
  const startLng = start.lng;

  // Skip animation if distance is negligible (< 1 meter)
  const latDiff = Math.abs(targetLat - startLat);
  const lngDiff = Math.abs(targetLng - startLng);
  if (latDiff < 0.00001 && lngDiff < 0.00001) {
    return;
  }

  const startTime = performance.now();

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);

    const lat = startLat + (targetLat - startLat) * eased;
    const lng = startLng + (targetLng - startLng) * eased;

    marker.setLatLng([lat, lng]);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export function FleetMap({ devices, locations, selectedImei, onSelect, onRefresh, showSearch = false }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const prevPositionsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const initialFitDoneRef = useRef(false);
  const tileLayerRef = useRef<L.GridLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

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

  const speedLimits = useSpeedLimits();

  const deviceByImei = useMemo(() => {
    const m = new Map<string, DeviceView>();
    for (const d of devices) m.set(d.imei, d);
    return m;
  }, [devices]);

  // Today's trip summaries per device
  const [todaySummaries, setTodaySummaries] = useState<Map<string, TodaySummary>>(new Map());

  // Fetch today's trips and compute summaries
  useEffect(() => {
    let cancelled = false;
    const fetchTodaySummaries = async () => {
      try {
        const todayStart = dhakaTodayStartIso();
        const now = new Date().toISOString();
        const r = await api.get<TripView[]>("/trips", {
          params: { from: todayStart, to: now },
        });
        if (cancelled) return;

        // Compute per-device summaries
        const summaryMap = new Map<string, TodaySummary>();
        for (const trip of r.data) {
          const imei = trip.deviceImei;
          const existing = summaryMap.get(imei) || {
            durationS: 0,
            distanceM: 0,
            overspeedDistanceM: 0,
            maxSpeed: 0,
          };
          existing.durationS += trip.durationS ?? 0;
          existing.distanceM += trip.distanceM;
          existing.maxSpeed = Math.max(existing.maxSpeed, trip.maxSpeed);

          // Estimate overspeed distance (20% of trip if max speed exceeded limit)
          const limit = speedLimits.limitFor(imei) ?? 80;
          if (trip.maxSpeed > limit) {
            existing.overspeedDistanceM += trip.distanceM * 0.2;
          }

          summaryMap.set(imei, existing);
        }
        setTodaySummaries(summaryMap);
      } catch (err) {
        console.error("Failed to fetch today's trips:", err);
      }
    };

    fetchTodaySummaries();
    // Refresh every 60 seconds
    const interval = setInterval(fetchTodaySummaries, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [speedLimits]);

  // Function to create popup content with Today's Summary
  const createPopupContent = useCallback((device: DeviceView | undefined, location: LocationView | undefined): string => {
    const name = device?.name || device?.vehiclePlate || device?.imei.slice(-8) || "Unknown";
    const plate = device?.vehiclePlate || "—";
    const imei = device?.imei || "—";
    const lat = location?.latitude?.toFixed(6) || "—";
    const lng = location?.longitude?.toFixed(6) || "—";
    const speed = location?.speed ?? 0;
    const course = location?.course ?? 0;
    const dateTime = formatDateTime(location?.ts || device?.lastSeenAt);
    const overspeed = device != null && speedLimits.isOverspeed(device.imei, location?.speed);
    const status = overspeed ? "Overspeed" : statusText(device, location);
    const statusColor = overspeed ? OVERSPEED_COLOR : markerColor(device, location);
    const accStatus = location?.accOn == null ? "—" : location.accOn ? "ON" : "OFF";
    const voltage = location?.voltageMv ? (location.voltageMv / 1000).toFixed(1) + "V" : "—";
    const parkedRow = device?.parkedSince && speed <= 2
      ? `<div class="pp-popup-row">
           <span class="pp-popup-label">Parked for</span>
           <span class="pp-popup-value">${formatSince(device.parkedSince)}</span>
         </div>`
      : "";

    // The device is reporting but has lost its GPS fix: say so plainly, and date
    // the coordinates, so a frozen marker reads as "no fix" and not "app broken".
    const sats = location?.satellites != null ? ` · ${location.satellites} sat` : "";
    const fixAge = location?.lastValidTs
      ? `position from ${formatDateTime(location.lastValidTs)}`
      : "no confirmed position yet";
    const noFixRow = hasNoFix(location)
      ? `<div class="pp-popup-row pp-popup-row-full pp-popup-nofix">
           <span class="pp-popup-label">GPS</span>
           <span class="pp-popup-value">No fix${sats} — ${fixAge}</span>
         </div>`
      : "";

    // Today's summary data
    const summary = device ? todaySummaries.get(device.imei) : undefined;
    const hoursDisplay = summary ? formatDurationCompact(summary.durationS) : "0m";
    const distanceDisplay = summary ? `${(summary.distanceM / 1000).toFixed(1)} km` : "0.0 km";
    const overspeedDisplay = summary ? `${(summary.overspeedDistanceM / 1000).toFixed(1)} km` : "0.0 km";

    return `
      <div class="pp-popup">
        <div class="pp-popup-header">
          <span class="pp-popup-name">${name}</span>
          <span class="pp-popup-status" style="background: ${statusColor}20; color: ${statusColor};">${status}</span>
        </div>

        <!-- Live Speed Display -->
        <div class="pp-popup-speed-section">
          <div class="pp-popup-speedometer">
            <span class="pp-popup-speed-value">${speed}</span>
            <span class="pp-popup-speed-unit">kph</span>
          </div>
          <div class="pp-popup-speed-label">Live Speed</div>
        </div>

        <div class="pp-popup-grid">
          ${noFixRow}
          <div class="pp-popup-row">
            <span class="pp-popup-label">Vehicle No</span>
            <span class="pp-popup-value">${plate}</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">IMEI</span>
            <span class="pp-popup-value pp-mono">${imei}</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">Location</span>
            <span class="pp-popup-value pp-mono">${lat}, ${lng}</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">Direction</span>
            <span class="pp-popup-value">${course}°</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">Ignition</span>
            <span class="pp-popup-value" style="color: ${accStatus === 'ON' ? '#16A34A' : '#64748B'};">${accStatus}</span>
          </div>
          <div class="pp-popup-row">
            <span class="pp-popup-label">Battery</span>
            <span class="pp-popup-value">${voltage}</span>
          </div>
          ${parkedRow}
          <div class="pp-popup-row pp-popup-row-full">
            <span class="pp-popup-label">Last Update</span>
            <span class="pp-popup-value">${dateTime}</span>
          </div>
        </div>

        <!-- Today's Summary Section -->
        <div class="pp-popup-summary">
          <div class="pp-popup-summary-title">Today (12:00 AM - Now)</div>
          <div class="pp-popup-summary-grid">
            <div class="pp-summary-item">
              <span class="pp-summary-icon pp-summary-icon-time">⏱</span>
              <span class="pp-summary-label">Hours</span>
              <span class="pp-summary-value">${hoursDisplay}</span>
            </div>
            <div class="pp-summary-item">
              <span class="pp-summary-icon pp-summary-icon-distance">📍</span>
              <span class="pp-summary-label">Distance</span>
              <span class="pp-summary-value">${distanceDisplay}</span>
            </div>
            <div class="pp-summary-item">
              <span class="pp-summary-icon pp-summary-icon-overspeed">⚠️</span>
              <span class="pp-summary-label">Overspeed</span>
              <span class="pp-summary-value ${summary && summary.overspeedDistanceM > 0 ? 'pp-summary-danger' : ''}">${overspeedDisplay}</span>
            </div>
          </div>
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
  }, [speedLimits, todaySummaries]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const container = containerRef.current;

    const map = L.map(container, {
      center: DHAKA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We use our own MapToolbar instead
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
      const isMoving = (loc.speed ?? 0) > 2; // Moving if speed > 2 kph

      if (!marker) {
        // Create new marker
        const icon = createVehicleIcon(device?.vehicleType, bodyColor, course, isSelected, isOverspeed, noFix, isMoving);
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
            offset: [0, -22],
            className: 'pp-plate-tooltip',
          });

        marker.on('click', () => {
          onSelect(imei);
        });

        markersRef.current.set(imei, marker);
        // Store initial position for animation tracking
        prevPositionsRef.current.set(imei, { lat: loc.latitude, lng: loc.longitude });
      } else {
        // Update existing marker with smooth animation
        const prevPos = prevPositionsRef.current.get(imei);
        const newPos = { lat: loc.latitude, lng: loc.longitude };

        // Animate if position changed significantly (vehicle is moving)
        if (prevPos && (prevPos.lat !== newPos.lat || prevPos.lng !== newPos.lng)) {
          // Calculate distance to determine animation duration
          const latDiff = Math.abs(newPos.lat - prevPos.lat);
          const lngDiff = Math.abs(newPos.lng - prevPos.lng);
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          // Scale animation duration based on distance (faster for small moves, slower for big jumps)
          const baseDuration = 800; // ms
          const maxDuration = 2000; // ms
          const duration = Math.min(baseDuration + distance * 50000, maxDuration);

          animateMarker(marker, loc.latitude, loc.longitude, duration);
        } else {
          marker.setLatLng([loc.latitude, loc.longitude]);
        }

        // Store current position for next comparison
        prevPositionsRef.current.set(imei, newPos);

        marker.setIcon(createVehicleIcon(device?.vehicleType, bodyColor, course, isSelected, isOverspeed, noFix, isMoving));
        marker.setPopupContent(createPopupContent(device, loc));
        marker.setTooltipContent(plateLabelHtml(device, loc, color));
      }
    }

    // Remove markers whose device disappeared from snapshot
    for (const [imei, marker] of markersRef.current.entries()) {
      if (!seen.has(imei)) {
        marker.remove();
        markersRef.current.delete(imei);
        prevPositionsRef.current.delete(imei);
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
  }, [locations, deviceByImei, selectedImei, onSelect, createPopupContent, speedLimits, todaySummaries]);

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

  // Pan to selection
  useEffect(() => {
    if (!selectedImei) return;
    const map = mapRef.current;
    const loc = locations.get(selectedImei);
    const marker = markersRef.current.get(selectedImei);
    if (map && loc) {
      map.setView([loc.latitude, loc.longitude], Math.max(map.getZoom(), 14), { animate: true });
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedImei, locations]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: "400px" }}>
      <div ref={containerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />

      {/* Map toolbar (top-left) — zoom, measure, fit all, locate */}
      <MapToolbar
        map={mapRef.current}
        onFitAll={handleFitAll}
        onLocate={handleLocate}
        locating={locating}
        disabled={locations.size === 0}
      />

      {/* Address search (top-left, below toolbar when enabled) */}
      {showSearch && (
        <div className="absolute left-14 top-3 z-[1000] w-64">
          <div className="flex overflow-hidden rounded-md border border-surface-300 bg-white shadow-menu">
            <input
              type="search"
              className="min-w-0 flex-1 px-2.5 py-1.5 text-xs text-ink-900 outline-none placeholder:text-ink-400"
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
              className="px-2.5 text-ink-500 transition hover:text-ink-900 disabled:opacity-50"
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
            <ul className="mt-1 max-h-56 overflow-y-auto rounded-md border border-surface-300 bg-white shadow-menu">
              {searchResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => gotoSearchResult(r)}
                    className="block w-full border-b border-surface-100 px-2.5 py-1.5 text-left text-[11px] text-ink-700 transition last:border-b-0 hover:bg-surface-100"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Map controls (top-right) — Layer dropdown + Show Traffic */}
      <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2">
        {trafficAvailable && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-surface-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-900 shadow-menu">
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

      {/* Refresh button (bottom-right) */}
      <div className="absolute bottom-6 right-3 z-[1000]">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={!onRefresh || refreshing}
          title="Refresh positions"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-surface-300 bg-white text-ink-700 shadow-menu transition hover:bg-surface-100 disabled:opacity-60"
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
        /* No GPS fix: the marker sits on the last confirmed position, so mute it
           and ring it to distinguish "stale coordinates" from a live vehicle. */
        .pp-vehicle-icon.pp-nofix {
          opacity: 0.55;
        }
        .pp-vehicle-icon.pp-nofix::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 1.5px dashed rgba(148, 163, 184, 0.9);
          border-radius: 50%;
          pointer-events: none;
        }
        .pp-search-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #e8900a;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px rgba(232, 144, 10, 0.45);
        }
        /* Compact plate + speed label (professional inline style) */
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
          background: rgba(10, 25, 40, 0.92);
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
        }
        .pp-label-name {
          color: #fff;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 6px;
          background: var(--state-color);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
        }
        .pp-label-speed {
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          padding: 3px 5px;
        }

        /* Popup styles */
        .pp-popup-container .leaflet-popup-content-wrapper {
          background: rgba(15, 39, 66, 0.98);
          border: 1px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          padding: 0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
          max-width: 320px;
        }
        .pp-popup-container .leaflet-popup-content {
          margin: 0;
          width: 100% !important;
        }
        .pp-popup-container .leaflet-popup-close-button {
          color: #94a3b8 !important;
          font-size: 18px;
          padding: 4px 8px;
          right: 4px;
          top: 4px;
        }
        .pp-popup-container .leaflet-popup-close-button:hover {
          color: #f1f5f9 !important;
        }
        .pp-popup-container .leaflet-popup-tip {
          background: rgba(15, 39, 66, 0.98);
          border: 1px solid rgba(100, 116, 139, 0.3);
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

        /* Today's Summary Section */
        .pp-popup-summary {
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(100, 116, 139, 0.2);
        }
        .pp-popup-summary-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pp-popup-summary-title::before {
          content: '📊';
          font-size: 12px;
        }
        .pp-popup-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .pp-summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        .pp-summary-icon {
          font-size: 14px;
        }
        .pp-summary-label {
          font-size: 9px;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.3px;
        }
        .pp-summary-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: #f1f5f9;
        }
        .pp-summary-danger {
          color: #DC2626 !important;
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
          .pp-popup-summary {
            padding: 8px 10px;
          }
          .pp-popup-summary-title {
            font-size: 9px;
            margin-bottom: 6px;
          }
          .pp-popup-summary-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }
          .pp-summary-item {
            padding: 4px 2px;
          }
          .pp-summary-icon {
            font-size: 12px;
          }
          .pp-summary-label {
            font-size: 8px;
          }
          .pp-summary-value {
            font-size: 10px;
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
