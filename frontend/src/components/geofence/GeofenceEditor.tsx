"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_ZOOM, DHAKA_CENTER, MAPBOX_STYLE, mapboxToken } from "@/lib/mapbox";
import { useLocale } from "@/lib/i18n";
import type {
  GeofenceCreate,
  GeofenceNotifyOn,
  GeofenceType,
  LatLng,
} from "@/types/domain";

interface Props {
  onSubmit: (req: GeofenceCreate) => Promise<unknown>;
  onCancel: () => void;
}

const CIRCLE_SOURCE = "geo-edit-circle";
const POLY_SOURCE = "geo-edit-polygon";

function circlePolygon(center: LatLng, radiusM: number): GeoJSON.Feature<GeoJSON.Polygon> {
  // Approx geodesic circle as 64-vertex polygon. Good enough for visual edit;
  // backend uses ST_Buffer over GEOGRAPHY for the canonical shape.
  const points: [number, number][] = [];
  const km = radiusM / 1000;
  const earthKm = 6371;
  const lat = (center.lat * Math.PI) / 180;
  for (let i = 0; i <= 64; i++) {
    const theta = (i * 2 * Math.PI) / 64;
    const dLat = (km / earthKm) * Math.cos(theta);
    const dLng = ((km / earthKm) * Math.sin(theta)) / Math.cos(lat);
    points.push([
      center.lng + (dLng * 180) / Math.PI,
      center.lat + (dLat * 180) / Math.PI,
    ]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [points] },
  };
}

export function GeofenceEditor({ onSubmit, onCancel }: Props) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const centerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const vertexMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [name, setName] = useState("");
  const [type, setType] = useState<GeofenceType>("CIRCLE");
  const [notifyOn, setNotifyOn] = useState<GeofenceNotifyOn>("BOTH");
  const [color, setColor] = useState("#E8900A");
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radiusM, setRadiusM] = useState<number>(200);
  const [polygon, setPolygon] = useState<LatLng[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    const hasName = !!name.trim();
    const circleOk = type === "CIRCLE" ? (center !== null && radiusM > 0) : true;
    const polygonOk = type === "POLYGON" ? (polygon.length >= 3) : true;
    const result = hasName && (type === "CIRCLE" ? circleOk : polygonOk);
    console.log("[GeofenceEditor] canSave:", result, { hasName, type, center, radiusM, polygonLength: polygon.length });
    return result;
  }, [name, type, center, radiusM, polygon]);

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
      centerMarkerRef.current?.remove();
      centerMarkerRef.current = null;
      for (const m of vertexMarkersRef.current) m.remove();
      vertexMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Click handler — depends on current type
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      console.log("[GeofenceEditor] Map not ready for click handler");
      return;
    }
    const onClick = (e: mapboxgl.MapMouseEvent) => {
      const ll = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      console.log("[GeofenceEditor] Map clicked:", ll, "type:", type);
      if (type === "CIRCLE") {
        setCenter(ll);
      } else {
        setPolygon((prev) => [...prev, ll]);
      }
    };

    // Ensure map is loaded before adding click handler
    const addClickHandler = () => {
      console.log("[GeofenceEditor] Adding click handler");
      map.on("click", onClick);
    };

    if (map.loaded()) {
      addClickHandler();
    } else {
      map.once("load", addClickHandler);
    }

    return () => {
      map.off("click", onClick);
    };
  }, [type]);

  // Render circle preview
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const data: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.FeatureCollection =
        type === "CIRCLE" && center
          ? circlePolygon(center, radiusM)
          : { type: "FeatureCollection", features: [] };
      if (map.getSource(CIRCLE_SOURCE)) {
        (map.getSource(CIRCLE_SOURCE) as mapboxgl.GeoJSONSource).setData(data);
      } else {
        map.addSource(CIRCLE_SOURCE, { type: "geojson", data });
        map.addLayer({
          id: `${CIRCLE_SOURCE}-fill`,
          type: "fill",
          source: CIRCLE_SOURCE,
          paint: { "fill-color": color, "fill-opacity": 0.2 },
        });
        map.addLayer({
          id: `${CIRCLE_SOURCE}-line`,
          type: "line",
          source: CIRCLE_SOURCE,
          paint: { "line-color": color, "line-width": 2 },
        });
      }

      // Center marker
      if (type === "CIRCLE" && center) {
        if (!centerMarkerRef.current) {
          const el = document.createElement("div");
          el.style.cssText =
            "width:12px;height:12px;border-radius:50%;background:#E8900A;border:2px solid #0A1928;";
          centerMarkerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([center.lng, center.lat])
            .addTo(map);
        } else {
          centerMarkerRef.current.setLngLat([center.lng, center.lat]);
        }
      } else if (centerMarkerRef.current) {
        centerMarkerRef.current.remove();
        centerMarkerRef.current = null;
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [type, center, radiusM, color]);

  // Render polygon preview + vertex markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const coords = polygon.map((p) => [p.lng, p.lat] as [number, number]);
      const closed = coords.length >= 3 ? [...coords, coords[0]] : coords;
      const data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection =
        type === "POLYGON" && coords.length > 0
          ? coords.length >= 3
            ? {
                type: "Feature",
                properties: {},
                geometry: { type: "Polygon", coordinates: [closed] },
              }
            : {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: closed },
              }
          : { type: "FeatureCollection", features: [] };

      if (map.getSource(POLY_SOURCE)) {
        (map.getSource(POLY_SOURCE) as mapboxgl.GeoJSONSource).setData(data);
      } else {
        map.addSource(POLY_SOURCE, { type: "geojson", data });
        map.addLayer({
          id: `${POLY_SOURCE}-fill`,
          type: "fill",
          source: POLY_SOURCE,
          paint: { "fill-color": color, "fill-opacity": 0.2 },
          filter: ["==", ["geometry-type"], "Polygon"],
        });
        map.addLayer({
          id: `${POLY_SOURCE}-line`,
          type: "line",
          source: POLY_SOURCE,
          paint: { "line-color": color, "line-width": 2 },
        });
      }

      // Vertex markers
      for (const m of vertexMarkersRef.current) m.remove();
      vertexMarkersRef.current = [];
      if (type === "POLYGON") {
        polygon.forEach((p) => {
          const el = document.createElement("div");
          el.style.cssText =
            "width:8px;height:8px;border-radius:50%;background:#E8900A;border:1.5px solid #0A1928;";
          const m = new mapboxgl.Marker({ element: el })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
          vertexMarkersRef.current.push(m);
        });
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [type, polygon, color]);

  const handleSubmit = async () => {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const req: GeofenceCreate = {
        name: name.trim(),
        type,
        notifyOn,
        color,
        ...(type === "CIRCLE"
          ? { center: center!, radiusM }
          : { polygon }),
      };
      await onSubmit(req);
    } catch (err) {
      setError(err instanceof Error ? err.message : "save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex bg-ink-950">
      <div className="flex w-80 shrink-0 flex-col gap-3 border-r border-ink-400/15 p-4">
        <div className="flex items-center justify-between">
          <div className="font-display text-sm font-semibold">{t("geo.new")}</div>
          <button type="button" className="text-ink-400 hover:text-ink-50" onClick={onCancel}>
            ×
          </button>
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-400">{t("geo.name")}</span>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-400">{t("geo.shape")}</span>
          <select
            className="input"
            value={type}
            onChange={(e) => {
              const next = e.target.value as GeofenceType;
              setType(next);
              if (next === "CIRCLE") setPolygon([]);
              else setCenter(null);
            }}
          >
            <option value="CIRCLE">{t("geo.circle")}</option>
            <option value="POLYGON">{t("geo.polygon")}</option>
          </select>
        </label>

        {type === "CIRCLE" && (
          <label className="text-sm">
            <span className="mb-1 block text-xs text-ink-400">{t("geo.radius")}</span>
            <input
              type="number"
              className="input"
              min={10}
              step={10}
              value={radiusM}
              onChange={(e) => setRadiusM(Math.max(10, Number(e.target.value) || 0))}
            />
          </label>
        )}

        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-400">{t("geo.notifyOn")}</span>
          <select
            className="input"
            value={notifyOn}
            onChange={(e) => setNotifyOn(e.target.value as GeofenceNotifyOn)}
          >
            <option value="ENTER">{t("geo.notifyEnter")}</option>
            <option value="EXIT">{t("geo.notifyExit")}</option>
            <option value="BOTH">{t("geo.notifyBoth")}</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs text-ink-400">Color</span>
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded border border-ink-400/30 bg-ink-900/40"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        <div className="rounded border border-dashed border-ink-400/30 p-2 text-xs text-ink-400">
          {type === "CIRCLE" ? t("geo.clickToSetCenter") : t("geo.clickToAddVertex")}
        </div>

        {/* Debug: Show what's needed for save */}
        <div className="text-xs text-ink-400 space-y-1">
          <div className={name.trim() ? "text-alarm-green" : "text-alarm-red"}>
            {name.trim() ? "✓" : "✗"} Name: {name.trim() || "(empty)"}
          </div>
          {type === "CIRCLE" && (
            <div className={center ? "text-alarm-green" : "text-alarm-red"}>
              {center ? "✓" : "✗"} Center: {center ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : "(click map)"}
            </div>
          )}
          {type === "POLYGON" && (
            <div className={polygon.length >= 3 ? "text-alarm-green" : "text-alarm-red"}>
              {polygon.length >= 3 ? "✓" : "✗"} Vertices: {polygon.length}/3 minimum
            </div>
          )}
        </div>

        {type === "POLYGON" && polygon.length > 0 && (
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => setPolygon((prev) => prev.slice(0, -1))}
          >
            Undo last vertex ({polygon.length})
          </button>
        )}

        {error && <div className="text-xs text-alarm-red">{error}</div>}

        <div className="mt-auto flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={!canSave || busy}
            onClick={handleSubmit}
          >
            {busy ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        {!mapboxToken() && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 text-sm">
            NEXT_PUBLIC_MAPBOX_TOKEN is not configured.
          </div>
        )}
      </div>
    </div>
  );
}
