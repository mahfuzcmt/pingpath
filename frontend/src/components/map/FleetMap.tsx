"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_ZOOM, DHAKA_CENTER, MAPBOX_STYLE, expandBounds, mapboxToken } from "@/lib/mapbox";
import type { DeviceView, LocationView } from "@/types/domain";

interface FleetMapProps {
  devices: DeviceView[];
  locations: Map<string, LocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
}

const ARROW_SVG = (color: string) =>
  `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
     <g transform="translate(14 14)">
       <circle r="13" fill="${color}" fill-opacity="0.18"/>
       <path d="M0 -10 L7 8 L0 4 L-7 8 Z" fill="${color}" stroke="#0A1928" stroke-width="1.2" stroke-linejoin="round"/>
     </g>
   </svg>`;

function getDeviceLabel(device: DeviceView | undefined): string {
  if (!device) return "Unknown";
  return device.name || device.vehiclePlate || device.imei.slice(-8);
}

function colorFor(device: DeviceView | undefined): string {
  if (!device) return "#E8900A"; // brand-500
  if (device.status === "OFFLINE") return "#64748B"; // ink-400
  return device.iconColor ?? "#E8900A";
}

export function FleetMap({ devices, locations, selectedImei, onSelect }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const initialFitDoneRef = useRef(false);

  const deviceByImei = useMemo(() => {
    const m = new Map<string, DeviceView>();
    for (const d of devices) m.set(d.imei, d);
    return m;
  }, [devices]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const token = mapboxToken();
    if (!token) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: DHAKA_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "bottom-right");
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
      let marker = markersRef.current.get(imei);

      const label = getDeviceLabel(device);
      const speed = loc.speed ?? 0;

      if (!marker) {
        const el = document.createElement("div");
        el.className = "pp-vehicle-marker";
        el.style.cssText = "cursor:pointer;will-change:transform;display:flex;flex-direction:column;align-items:center;";
        el.innerHTML = `
          <div class="pp-arrow-wrapper">${ARROW_SVG(color)}</div>
          <div class="pp-marker-label">
            <span class="pp-label-name">${label}</span>
            <span class="pp-label-speed">${speed} kph</span>
          </div>
        `;
        el.dataset.imei = imei;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelect(imei);
        });

        marker = new mapboxgl.Marker({ element: el, rotationAlignment: "map", anchor: "top" })
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map);
        markersRef.current.set(imei, marker);
      } else {
        // Animate to new position via CSS transition on the underlying transform
        marker.setLngLat([loc.longitude, loc.latitude]);
        const el = marker.getElement();
        const svg = el.querySelector("svg path") as SVGPathElement | null;
        if (svg) svg.setAttribute("fill", color);
        // Update label text
        const nameEl = el.querySelector(".pp-label-name");
        const speedEl = el.querySelector(".pp-label-speed");
        if (nameEl) nameEl.textContent = label;
        if (speedEl) speedEl.textContent = `${speed} kph`;
      }
      // Only rotate the arrow, not the label
      const arrowWrapper = marker.getElement().querySelector(".pp-arrow-wrapper") as HTMLElement | null;
      if (arrowWrapper) {
        arrowWrapper.style.transform = `rotate(${loc.course || 0}deg)`;
      }

      const el = marker.getElement();
      el.classList.toggle("pp-marker-selected", imei === selectedImei);
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
      for (const l of locations.values()) pts.push([l.longitude, l.latitude]);
      const bounds = expandBounds(pts, 0.02);
      if (bounds) {
        map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 14 });
      }
      initialFitDoneRef.current = true;
    }
  }, [locations, deviceByImei, selectedImei, onSelect]);

  // Pan to selection
  useEffect(() => {
    if (!selectedImei) return;
    const map = mapRef.current;
    const loc = locations.get(selectedImei);
    if (map && loc) {
      map.easeTo({ center: [loc.longitude, loc.latitude], zoom: Math.max(map.getZoom(), 14), duration: 700 });
    }
  }, [selectedImei, locations]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {!mapboxToken() && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 text-sm text-ink-100">
          NEXT_PUBLIC_MAPBOX_TOKEN is not configured.
        </div>
      )}
      <style jsx global>{`
        .pp-vehicle-marker {
          transition: transform 800ms ease-out;
        }
        .pp-arrow-wrapper {
          transition: transform 300ms ease-out;
        }
        .pp-marker-label {
          margin-top: 2px;
          padding: 2px 6px;
          background: rgba(10, 25, 40, 0.9);
          border-radius: 4px;
          border: 1px solid rgba(100, 116, 139, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }
        .pp-label-name {
          font-size: 11px;
          font-weight: 600;
          color: #f1f5f9;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pp-label-speed {
          font-size: 10px;
          font-weight: 500;
          color: #e8900a;
          font-family: 'JetBrains Mono', monospace;
        }
        .pp-marker-selected {
          filter: drop-shadow(0 0 6px #e8900a);
          z-index: 2;
        }
        .pp-marker-selected .pp-marker-label {
          border-color: #e8900a;
          background: rgba(232, 144, 10, 0.15);
        }
      `}</style>
    </div>
  );
}
