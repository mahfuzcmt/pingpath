"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_ZOOM, DHAKA_CENTER, TILE_URL, TILE_ATTRIBUTION, expandBounds } from "@/lib/leaflet";
import type { DeviceView, LocationView } from "@/types/domain";

interface FleetMapProps {
  devices: DeviceView[];
  locations: Map<string, LocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
}

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

function getStatusColor(device: DeviceView | undefined, location: LocationView | undefined): string {
  if (!device || device.status !== "ONLINE") return "#64748B"; // offline - gray
  if (!location) return "#3B82F6"; // no location - blue/idle
  if (location.speed > 2) return "#16A34A"; // moving - green
  if (location.accOn) return "#3B82F6"; // idle - blue
  return "#DC2626"; // stopped - red
}

function getStatusText(device: DeviceView | undefined, location: LocationView | undefined): string {
  if (!device || device.status !== "ONLINE") return "Offline";
  if (!location) return "Idle";
  if (location.speed > 2) return "Moving";
  if (location.accOn) return "Idle";
  return "Stopped";
}

function getDeviceLabel(device: DeviceView | undefined): string {
  if (!device) return "Unknown";
  return device.name || device.vehiclePlate || device.imei.slice(-8);
}

function colorFor(device: DeviceView | undefined): string {
  if (!device) return "#E8900A"; // brand-500
  if (device.status === "OFFLINE") return "#64748B"; // ink-400
  return device.iconColor ?? "#E8900A";
}

// Create arrow SVG icon for vehicle marker
function createArrowIcon(color: string, rotation: number, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 36 : 28;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(14 14) rotate(${rotation})">
        <circle r="13" fill="${color}" fill-opacity="0.18"/>
        <path d="M0 -10 L7 8 L0 4 L-7 8 Z" fill="${color}" stroke="#0A1928" stroke-width="1.2" stroke-linejoin="round"/>
      </g>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: `pp-vehicle-icon ${isSelected ? 'pp-selected' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function FleetMap({ devices, locations, selectedImei, onSelect }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const initialFitDoneRef = useRef(false);

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
    const status = getStatusText(device, location);
    const statusColor = getStatusColor(device, location);
    const accStatus = location?.accOn == null ? "—" : location.accOn ? "ON" : "OFF";
    const voltage = location?.voltageMv ? (location.voltageMv / 1000).toFixed(1) + "V" : "—";

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
          <div class="pp-popup-row pp-popup-row-full">
            <span class="pp-popup-label">Last Update</span>
            <span class="pp-popup-value">${dateTime}</span>
          </div>
        </div>
      </div>
    `;
  }, []);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: DHAKA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Move zoom control to bottom-right
    map.zoomControl.setPosition('bottomright');

    mapRef.current = map;

    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers with locations
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    for (const [imei, loc] of locations.entries()) {
      seen.add(imei);
      const device = deviceByImei.get(imei);
      const color = colorFor(device);
      const isSelected = imei === selectedImei;
      let marker = markersRef.current.get(imei);

      const label = getDeviceLabel(device);
      const speed = loc.speed ?? 0;
      const course = loc.course ?? 0;

      if (!marker) {
        // Create new marker
        const icon = createArrowIcon(color, course, isSelected);
        marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .bindPopup(createPopupContent(device, loc), {
            maxWidth: 320,
            className: 'pp-popup-container',
          })
          .bindTooltip(`<div class="pp-tooltip"><strong>${label}</strong><br/>${speed} kph</div>`, {
            permanent: true,
            direction: 'bottom',
            offset: [0, 10],
            className: 'pp-marker-tooltip',
          });

        marker.on('click', () => {
          onSelect(imei);
        });

        markersRef.current.set(imei, marker);
      } else {
        // Update existing marker
        marker.setLatLng([loc.latitude, loc.longitude]);
        marker.setIcon(createArrowIcon(color, course, isSelected));
        marker.setPopupContent(createPopupContent(device, loc));
        marker.setTooltipContent(`<div class="pp-tooltip"><strong>${label}</strong><br/>${speed} kph</div>`);
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
  }, [locations, deviceByImei, selectedImei, onSelect, createPopupContent]);

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
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      <style jsx global>{`
        .pp-vehicle-icon {
          transition: transform 300ms ease-out;
        }
        .pp-vehicle-icon.pp-selected {
          filter: drop-shadow(0 0 6px #e8900a);
          z-index: 1000 !important;
        }
        .pp-marker-tooltip {
          background: rgba(10, 25, 40, 0.9) !important;
          border: 1px solid rgba(100, 116, 139, 0.3) !important;
          border-radius: 4px !important;
          color: #f1f5f9 !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 11px !important;
          padding: 4px 8px !important;
          box-shadow: none !important;
        }
        .pp-marker-tooltip::before {
          border-bottom-color: rgba(10, 25, 40, 0.9) !important;
        }
        .pp-tooltip strong {
          color: #f1f5f9;
          font-weight: 600;
        }

        /* Popup styles */
        .pp-popup-container .leaflet-popup-content-wrapper {
          background: rgba(15, 39, 66, 0.98);
          border: 1px solid rgba(100, 116, 139, 0.3);
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .pp-popup-container .leaflet-popup-content {
          margin: 0;
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
          min-width: 240px;
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
      `}</style>
    </div>
  );
}
