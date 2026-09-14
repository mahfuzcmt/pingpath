"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SharedHistoryPoint } from "@/types/domain";

// Initialize Google Mutant if available
let GoogleMutant: typeof import("leaflet.gridlayer.googlemutant") | null = null;
if (typeof window !== "undefined") {
  // Dynamic import for Google Mutant
  import("leaflet.gridlayer.googlemutant").then(m => {
    GoogleMutant = m;
  }).catch(() => {
    console.log("Google Maps layer not available, using OSM fallback");
  });
}

interface SharedMapProps {
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  isOnline: boolean;
  history: SharedHistoryPoint[];
  showHistory: boolean;
}

// Vehicle marker SVG
function createVehicleIcon(course: number, isOnline: boolean): L.DivIcon {
  const color = isOnline ? "#22C55E" : "#6B7280";
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${course}, 16, 16)">
        <path d="M16 4 L24 28 L16 22 L8 28 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      </g>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "vehicle-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function SharedMap({
  latitude,
  longitude,
  speed,
  course,
  isOnline,
  history,
  showHistory,
}: SharedMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
    });

    // Try Google Maps first, fall back to OSM
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleApiKey && GoogleMutant) {
      try {
        const googleLayer = (L as unknown as { gridLayer: { googleMutant: (opts: object) => L.Layer } })
          .gridLayer.googleMutant({
            type: "roadmap",
            styles: [
              { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#8b8b9e" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
            ],
          });
        googleLayer.addTo(map);
      } catch {
        // Fall back to OSM
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
      }
    } else {
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
    }

    // Add vehicle marker
    const marker = L.marker([latitude, longitude], {
      icon: createVehicleIcon(course, isOnline),
    }).addTo(map);

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position and icon
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;

    const newLatLng = L.latLng(latitude, longitude);
    markerRef.current.setLatLng(newLatLng);
    markerRef.current.setIcon(createVehicleIcon(course, isOnline));
    mapRef.current.panTo(newLatLng);
  }, [latitude, longitude, course, isOnline]);

  // Update history polyline
  useEffect(() => {
    if (!mapRef.current || !showHistory) return;

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (history.length > 0) {
      const points: L.LatLngExpression[] = history.map(p => [p.latitude, p.longitude]);
      const polyline = L.polyline(points, {
        color: "#E8900A",
        weight: 3,
        opacity: 0.7,
      }).addTo(mapRef.current);

      polylineRef.current = polyline;
    }
  }, [history, showHistory]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
