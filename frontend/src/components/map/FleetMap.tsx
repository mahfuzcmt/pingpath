"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_ZOOM,
  DHAKA_CENTER,
  createBaseLayer,
  expandBounds,
  layerSupportsTraffic,
  setLayerTraffic,
} from "@/lib/leaflet";
import { formatSince, vehicleState, VEHICLE_STATE_COLOR, type VehicleState } from "@/lib/format";
import { buildVehicleSvg } from "@/lib/vehicleIcons";
import { useSpeedLimits } from "@/hooks/useSpeedLimits";
import type { DeviceView, LocationView } from "@/types/domain";

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

type BaseLayer = "normal" | "satellite";

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

// Vehicle marker: top-view silhouette by vehicle type, rotated to the course.
function createVehicleIcon(
  vehicleType: string | null | undefined,
  bodyColor: string,
  rotation: number,
  isSelected: boolean,
  isOverspeed = false,
): L.DivIcon {
  const size = isSelected ? 46 : 38;
  return L.divIcon({
    html: buildVehicleSvg(vehicleType, isOverspeed ? OVERSPEED_COLOR : bodyColor, rotation, size),
    className: `pp-vehicle-icon ${isSelected ? 'pp-selected' : ''} ${isOverspeed ? 'pp-overspeed' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Plate-number pill shown permanently above the marker (AutoNemo-style).
function plateLabelHtml(device: DeviceView | undefined, stateColor: string): string {
  const text = device?.vehiclePlate || device?.name || device?.imei.slice(-8) || "—";
  return `<div class="pp-plate" style="background:${stateColor}">${text}</div>`;
}

export function FleetMap({ devices, locations, selectedImei, onSelect, onRefresh, showSearch = false }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const initialFitDoneRef = useRef(false);
  const tileLayerRef = useRef<L.GridLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  const [baseLayer, setBaseLayer] = useState<BaseLayer>("normal");
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

  // Function to create popup content
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

    return `
      <div class="pp-popup">
        <div class="pp-popup-header">
          <span class="pp-popup-name">${name}</span>
          <span class="pp-popup-status" style="background: ${statusColor}20; color: ${statusColor};">${status}</span>
        </div>
        <div class="pp-popup-grid">
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
            <span class="pp-popup-label">Speed</span>
            <span class="pp-popup-value pp-speed">${speed} <small>kph</small></span>
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
      zoomControl: true,
    });

    // Move zoom control to bottom-right. The tile layer is added by the
    // base-layer effect below so the Normal/Satellite toggle can swap it.
    map.zoomControl.setPosition('bottomright');

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

  // Base layer (Normal / Satellite). Owns the tile layer so the toggle can swap
  // it; runs on mount to create the initial layer too.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    createBaseLayer(baseLayer === "satellite" ? "satellite" : "street").then((layer) => {
      // Guard: toggle changed again or map unmounted while Google API loaded.
      if (cancelled || mapRef.current !== map) return;
      tileLayerRef.current?.remove();
      layer.addTo(map);
      layer.bringToBack();
      tileLayerRef.current = layer;
      // Traffic only exists on the Google base layer, not the OSM fallback.
      setTrafficAvailable(layerSupportsTraffic(layer));
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

      if (!marker) {
        // Create new marker
        const icon = createVehicleIcon(device?.vehicleType, bodyColor, course, isSelected, isOverspeed);
        marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .bindPopup(createPopupContent(device, loc), {
            maxWidth: 320,
            className: 'pp-popup-container',
          })
          .bindTooltip(plateLabelHtml(device, color), {
            permanent: true,
            direction: 'top',
            offset: [0, -22],
            className: 'pp-plate-tooltip',
          });

        marker.on('click', () => {
          onSelect(imei);
        });

        markersRef.current.set(imei, marker);
      } else {
        // Update existing marker
        marker.setLatLng([loc.latitude, loc.longitude]);
        marker.setIcon(createVehicleIcon(device?.vehicleType, bodyColor, course, isSelected, isOverspeed));
        marker.setPopupContent(createPopupContent(device, loc));
        marker.setTooltipContent(plateLabelHtml(device, color));
      }
    }

    // Remove markers whose device disappeared from snapshot
    for (const [imei, marker] of markersRef.current.entries()) {
      if (!seen.has(imei)) {
        marker.remove();
        markersRef.current.delete(imei);
      }
    }

    // First-load fit-to-bounds
    if (!initialFitDoneRef.current && locations.size > 0) {
      const pts: Array<[number, number]> = [];
      for (const l of locations.values()) pts.push([l.latitude, l.longitude]);
      const bounds = expandBounds(pts, 0.02);
      if (bounds) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
      initialFitDoneRef.current = true;
    }
  }, [locations, deviceByImei, selectedImei, onSelect, createPopupContent, speedLimits]);

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

      {/* Address search (top-left) */}
      {showSearch && (
        <div className="absolute left-3 top-3 z-[1000] w-64">
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

      {/* Map controls (top-right) — Normal / Satellite + Show Traffic */}
      <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2">
        {trafficAvailable && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-surface-300 bg-white px-2.5 py-1 text-xs font-semibold text-ink-900 shadow-menu">
            <input
              type="checkbox"
              checked={showTraffic}
              onChange={(e) => setShowTraffic(e.target.checked)}
              className="h-3.5 w-3.5 accent-brand-500"
            />
            Show Traffic
          </label>
        )}
        <div className="flex overflow-hidden rounded-md border border-surface-300 bg-white text-xs shadow-menu">
          {(["normal", "satellite"] as BaseLayer[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setBaseLayer(k)}
              className={
                baseLayer === k
                  ? "bg-brand-500 px-2.5 py-1 font-semibold capitalize text-white"
                  : "px-2.5 py-1 capitalize text-ink-700 transition hover:bg-surface-100"
              }
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Control cluster (bottom-right, above the zoom control) */}
      <div className="absolute bottom-[92px] right-3 z-[1000] flex flex-col gap-1.5">
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
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Locate me"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-surface-300 bg-white text-ink-700 shadow-menu transition hover:bg-surface-100 disabled:opacity-60"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={locating ? "animate-pulse" : ""}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
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
        .pp-search-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #e8900a;
          border: 3px solid #fff;
          box-shadow: 0 0 0 2px rgba(232, 144, 10, 0.45);
        }
        /* Plate-number pill above each vehicle (AutoNemo-style) */
        .pp-plate-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .pp-plate-tooltip::before {
          display: none !important;
        }
        .pp-plate {
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          padding: 2px 9px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.55);
          box-shadow: 0 1px 4px rgba(10, 25, 40, 0.35);
          white-space: nowrap;
        }

        /* Popup styles */
        .pp-popup-container .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 10px 25px rgba(10, 25, 40, 0.15);
        }
        .pp-popup-container .leaflet-popup-content {
          margin: 0;
        }
        .pp-popup-container .leaflet-popup-close-button {
          color: #64748b !important;
          font-size: 18px;
          padding: 4px 8px;
          right: 4px;
          top: 4px;
        }
        .pp-popup-container .leaflet-popup-close-button:hover {
          color: #0f2742 !important;
        }
        .pp-popup-container .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #e2e8f0;
          box-shadow: none;
        }
        .pp-popup {
          font-family: 'Inter', sans-serif;
          min-width: 240px;
        }
        .pp-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid #e2e8f0;
        }
        .pp-popup-name {
          font-size: 14px;
          font-weight: 600;
          color: #0f2742;
        }
        .pp-popup-status {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
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
        .pp-popup-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .pp-popup-value {
          font-size: 12px;
          color: #334155;
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
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
