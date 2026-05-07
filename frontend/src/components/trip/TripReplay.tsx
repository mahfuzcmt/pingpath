"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api";
import { DEFAULT_ZOOM, DHAKA_CENTER, MAPBOX_STYLE, expandBounds, mapboxToken } from "@/lib/mapbox";
import { useLocale } from "@/lib/i18n";
import type { LocationView, TripView } from "@/types/domain";

interface Props {
  trip: TripView;
  onClose: () => void;
}

const ROUTE_SOURCE = "trip-route";
const ROUTE_LAYER = "trip-route-line";
const ROUTE_DONE_LAYER = "trip-route-done";

/**
 * Loads the device's locations bounded by the trip's start/end timestamps
 * and animates a marker along the recorded path. The "completed" portion
 * of the polyline is drawn in brand colour; the remainder in muted ink.
 */
export function TripReplay({ trip, onClose }: Props) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const rafRef = useRef<number | null>(null);

  const [path, setPath] = useState<LocationView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [playing, setPlaying] = useState(false);

  // Fetch path for the trip window
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params: Record<string, string | number> = {
          from: trip.startedAt,
          to: trip.endedAt ?? new Date().toISOString(),
          limit: 5000,
        };
        const r = await api.get<LocationView[]>(
          `/devices/${encodeURIComponent(trip.deviceImei)}/locations`,
          { params },
        );
        if (!cancelled) setPath(r.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trip.deviceImei, trip.startedAt, trip.endedAt]);

  // Init map
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
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw the route once both map + path are ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || path.length === 0) return;

    const draw = () => {
      const coords = path.map((p) => [p.longitude, p.latitude] as [number, number]);
      const lineGeo = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: coords },
      };

      if (map.getSource(ROUTE_SOURCE)) {
        (map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource).setData(lineGeo);
      } else {
        map.addSource(ROUTE_SOURCE, { type: "geojson", data: lineGeo });
        map.addLayer({
          id: ROUTE_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          paint: { "line-color": "#64748B", "line-width": 3, "line-opacity": 0.6 },
        });
        map.addSource("trip-route-done", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        });
        map.addLayer({
          id: ROUTE_DONE_LAYER,
          type: "line",
          source: "trip-route-done",
          paint: { "line-color": "#E8900A", "line-width": 4 },
        });
      }

      const bounds = expandBounds(coords, 0.005);
      if (bounds) map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 15 });

      if (!markerRef.current) {
        const el = document.createElement("div");
        el.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#E8900A;border:2px solid #0A1928;box-shadow:0 0 8px rgba(232,144,10,0.6);";
        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(coords[0])
          .addTo(map);
      } else {
        markerRef.current.setLngLat(coords[0]);
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [path]);

  // Animate marker according to progress
  useEffect(() => {
    const map = mapRef.current;
    if (!map || path.length === 0) return;
    const idx = Math.min(path.length - 1, Math.floor(progress * (path.length - 1)));
    const point = path[idx];
    if (markerRef.current) {
      markerRef.current.setLngLat([point.longitude, point.latitude]);
    }
    const doneSource = map.getSource("trip-route-done") as mapboxgl.GeoJSONSource | undefined;
    if (doneSource) {
      const done = path.slice(0, idx + 1).map((p) => [p.longitude, p.latitude] as [number, number]);
      doneSource.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: done },
      });
    }
  }, [progress, path]);

  // Playback loop
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProgress((p) => {
        const next = p + dt / 20; // 20s full pass
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
  }, [playing]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ink-950">
      <div className="flex items-center justify-between border-b border-ink-400/15 px-4 py-3">
        <div>
          <div className="font-display text-sm font-semibold">{t("trips.replay")}</div>
          <div className="font-mono text-xs text-ink-400">{trip.deviceImei}</div>
        </div>
        <button type="button" className="btn-ghost px-3 py-1 text-sm" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>

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
      </div>

      <div className="flex items-center gap-3 border-t border-ink-400/15 px-4 py-3">
        <button
          type="button"
          className="btn-primary px-3 py-1 text-sm"
          onClick={() => {
            if (progress >= 1) setProgress(0);
            setPlaying((p) => !p);
          }}
          disabled={path.length === 0}
        >
          {playing ? "❚❚" : "▶"}
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
        />
        <span className="w-12 text-right font-mono text-xs text-ink-100">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
