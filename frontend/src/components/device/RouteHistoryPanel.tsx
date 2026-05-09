"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useLocale } from "@/lib/i18n";
import { useDeviceHistory, getDateRange } from "@/hooks/useDeviceHistory";
import { formatDateTime, formatNumber } from "@/lib/format";
import { DEFAULT_ZOOM, DHAKA_CENTER, MAPBOX_STYLE, expandBounds, mapboxToken } from "@/lib/mapbox";
import type { DeviceView, LocationView } from "@/types/domain";

interface Props {
  device: DeviceView;
  onClose: () => void;
}

type Period = "1h" | "6h" | "24h" | "7d";

const ROUTE_SOURCE = "device-route";
const ROUTE_LAYER = "device-route-line";
const POINTS_SOURCE = "device-points";
const POINTS_LAYER = "device-points-circle";

// Color based on speed (green = slow, yellow = medium, red = fast)
function speedColor(speed: number): string {
  if (speed < 20) return "#16A34A"; // green
  if (speed < 40) return "#E8900A"; // orange
  if (speed < 60) return "#F59E0B"; // amber
  return "#DC2626"; // red
}

export function RouteHistoryPanel({ device, onClose }: Props) {
  const { t, locale } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [period, setPeriod] = useState<Period>("24h");
  const [selectedPoint, setSelectedPoint] = useState<LocationView | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Memoize date range to prevent infinite re-fetching
  const dateRange = useMemo(() => getDateRange(period), [period]);

  const { history, loading, error } = useDeviceHistory({
    imei: device.imei,
    from: dateRange.from,
    to: dateRange.to,
    limit: 2000,
  });

  // Debug logging
  console.log("[RouteHistory] period:", period, "history count:", history.length, "loading:", loading, "error:", error);

  // Initialize map
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
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "bottom-right");
    mapRef.current = map;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      markerRef.current?.remove();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw route when history loads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || history.length === 0) return;

    const draw = () => {
      // Sort by timestamp
      const sorted = [...history].sort(
        (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
      );

      const coords = sorted.map((p) => [p.longitude, p.latitude] as [number, number]);

      // Route line
      const lineGeo: GeoJSON.Feature = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      };

      // Points for hover/click
      const pointsGeo: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: sorted.map((p, i) => ({
          type: "Feature",
          properties: {
            index: i,
            speed: p.speed,
            ts: p.ts,
            voltage: p.voltageMv,
            accOn: p.accOn,
          },
          geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
        })),
      };

      // Add/update sources
      if (map.getSource(ROUTE_SOURCE)) {
        (map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource).setData(lineGeo);
      } else {
        map.addSource(ROUTE_SOURCE, { type: "geojson", data: lineGeo });
        map.addLayer({
          id: ROUTE_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          paint: {
            "line-color": "#E8900A",
            "line-width": 3,
            "line-opacity": 0.8,
          },
        });
      }

      if (map.getSource(POINTS_SOURCE)) {
        (map.getSource(POINTS_SOURCE) as mapboxgl.GeoJSONSource).setData(pointsGeo);
      } else {
        map.addSource(POINTS_SOURCE, { type: "geojson", data: pointsGeo });
        map.addLayer({
          id: POINTS_LAYER,
          type: "circle",
          source: POINTS_SOURCE,
          paint: {
            "circle-radius": 5,
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "speed"],
              0, "#16A34A",
              30, "#E8900A",
              60, "#DC2626",
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#0A1928",
          },
        });

        // Click handler for points
        map.on("click", POINTS_LAYER, (e) => {
          if (e.features && e.features[0]) {
            const idx = e.features[0].properties?.index;
            if (typeof idx === "number") {
              setSelectedPoint(sorted[idx]);
            }
          }
        });

        map.on("mouseenter", POINTS_LAYER, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", POINTS_LAYER, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // Fit bounds
      const bounds = expandBounds(coords, 0.01);
      if (bounds) {
        map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 16 });
      }

      // Add start/end markers
      if (coords.length > 0) {
        // Start marker (green)
        const startEl = document.createElement("div");
        startEl.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#16A34A;border:2px solid #0A1928;"></div>`;
        new mapboxgl.Marker({ element: startEl })
          .setLngLat(coords[0])
          .addTo(map);

        // End marker (red)
        const endEl = document.createElement("div");
        endEl.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#DC2626;border:2px solid #0A1928;"></div>`;
        new mapboxgl.Marker({ element: endEl })
          .setLngLat(coords[coords.length - 1])
          .addTo(map);

        // Animated marker for playback
        if (!markerRef.current) {
          const el = document.createElement("div");
          el.style.cssText =
            "width:20px;height:20px;border-radius:50%;background:#E8900A;border:3px solid #0A1928;box-shadow:0 0 10px rgba(232,144,10,0.8);";
          markerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat(coords[0])
            .addTo(map);
        }
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [history]);

  // Playback animation
  useEffect(() => {
    if (!playing || history.length === 0) return;

    const sorted = [...history].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );

    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProgress((p) => {
        const next = p + dt / 30; // 30 seconds for full playback
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, history]);

  // Update marker position based on progress
  useEffect(() => {
    if (!markerRef.current || history.length === 0) return;

    const sorted = [...history].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );

    const idx = Math.min(sorted.length - 1, Math.floor(progress * sorted.length));
    const point = sorted[idx];
    if (point) {
      markerRef.current.setLngLat([point.longitude, point.latitude]);
      setSelectedPoint(point);
    }
  }, [progress, history]);

  // Calculate stats
  const stats = history.length > 0 ? {
    totalPoints: history.length,
    maxSpeed: Math.max(...history.map(h => h.speed)),
    avgSpeed: Math.round(history.reduce((sum, h) => sum + h.speed, 0) / history.length),
    startTime: history.reduce((min, h) => h.ts < min ? h.ts : min, history[0].ts),
    endTime: history.reduce((max, h) => h.ts > max ? h.ts : max, history[0].ts),
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink-400/15 px-4 py-3">
        <div>
          <div className="font-semibold text-base">
            {t("fleet.routeHistory")} - {device.name || device.imei}
          </div>
          <div className="font-mono text-xs text-ink-400">{device.imei}</div>
        </div>
        <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 border-b border-ink-400/15 px-4 py-2">
        <span className="text-sm text-ink-400">{t("fleet.period")}:</span>
        {(["1h", "6h", "24h", "7d"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-sm rounded ${
              period === p
                ? "bg-brand-500 text-ink-950"
                : "bg-ink-900 text-ink-100 hover:bg-ink-800"
            }`}
          >
            {p === "1h" ? "1 Hour" : p === "6h" ? "6 Hours" : p === "24h" ? "24 Hours" : "7 Days"}
          </button>
        ))}
        {loading && <span className="text-xs text-ink-400 ml-2">Loading...</span>}
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {!mapboxToken() && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 text-sm">
            NEXT_PUBLIC_MAPBOX_TOKEN is not configured.
          </div>
        )}

        {error && (
          <div className="absolute left-3 top-3 rounded bg-alarm-red/20 px-3 py-1 text-xs text-alarm-red">
            {error}
          </div>
        )}

        {history.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/50 text-ink-400">
            No location history for this period
          </div>
        )}

        {/* Stats panel */}
        {stats && (
          <div className="absolute left-3 top-3 rounded-lg bg-ink-900/90 backdrop-blur p-3 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="text-ink-400">Points:</div>
              <div className="text-ink-50 font-mono">{stats.totalPoints}</div>
              <div className="text-ink-400">Max Speed:</div>
              <div className="text-ink-50 font-mono">{stats.maxSpeed} km/h</div>
              <div className="text-ink-400">Avg Speed:</div>
              <div className="text-ink-50 font-mono">{stats.avgSpeed} km/h</div>
            </div>
          </div>
        )}

        {/* Selected point info */}
        {selectedPoint && (
          <div className="absolute right-3 top-3 rounded-lg bg-ink-900/90 backdrop-blur p-3 text-sm min-w-[200px]">
            <div className="font-semibold mb-2">{t("fleet.pointDetails")}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="text-ink-400">Time:</div>
              <div className="text-ink-50 font-mono">{formatDateTime(selectedPoint.ts, locale)}</div>
              <div className="text-ink-400">Speed:</div>
              <div className="text-ink-50 font-mono">{selectedPoint.speed} km/h</div>
              <div className="text-ink-400">Position:</div>
              <div className="text-ink-50 font-mono text-[10px]">
                {selectedPoint.latitude.toFixed(5)}, {selectedPoint.longitude.toFixed(5)}
              </div>
              {selectedPoint.voltageMv && (
                <>
                  <div className="text-ink-400">Voltage:</div>
                  <div className="text-ink-50 font-mono">{(selectedPoint.voltageMv / 1000).toFixed(1)}V</div>
                </>
              )}
              <div className="text-ink-400">ACC:</div>
              <div className={selectedPoint.accOn ? "text-alarm-green" : "text-ink-400"}>
                {selectedPoint.accOn ? "ON" : "OFF"}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute left-3 bottom-16 rounded-lg bg-ink-900/90 backdrop-blur p-2 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#16A34A]"></div>
              <span>Start / Slow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#E8900A]"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#DC2626]"></div>
              <span>End / Fast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3 border-t border-ink-400/15 px-4 py-3">
        <button
          type="button"
          className="btn-primary px-3 py-1 text-sm"
          onClick={() => {
            if (progress >= 1) setProgress(0);
            setPlaying((p) => !p);
          }}
          disabled={history.length === 0}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          className="btn-ghost px-2 py-1 text-sm"
          onClick={() => setProgress(0)}
          disabled={history.length === 0}
        >
          ⏮
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => {
            setPlaying(false);
            setProgress(Number(e.target.value) / 1000);
          }}
          className="flex-1 accent-brand-500"
          disabled={history.length === 0}
        />
        <span className="w-14 text-right font-mono text-xs text-ink-100">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
