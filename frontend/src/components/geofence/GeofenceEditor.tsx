"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_ZOOM, DHAKA_CENTER, createBaseLayer } from "@/lib/leaflet";
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

export function GeofenceEditor({ onSubmit, onCancel }: Props) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);

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
    return hasName && (type === "CIRCLE" ? circleOk : polygonOk);
  }, [name, type, center, radiusM, polygon]);

  // Init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: DHAKA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    createBaseLayer("street").then((layer) => {
      if (mapRef.current === map) layer.addTo(map);
    });

    map.zoomControl.setPosition('bottomright');
    mapRef.current = map;

    return () => {
      centerMarkerRef.current?.remove();
      centerMarkerRef.current = null;
      for (const m of vertexMarkersRef.current) m.remove();
      vertexMarkersRef.current = [];
      circleRef.current?.remove();
      polygonRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Click handler — depends on current type
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: L.LeafletMouseEvent) => {
      const ll = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (type === "CIRCLE") {
        setCenter(ll);
      } else {
        setPolygon((prev) => [...prev, ll]);
      }
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
    };
  }, [type]);

  // Render circle preview
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old circle
    circleRef.current?.remove();
    centerMarkerRef.current?.remove();

    if (type === "CIRCLE" && center) {
      // Draw circle
      const circle = L.circle([center.lat, center.lng], {
        radius: radiusM,
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      // Center marker
      const centerIcon = L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #0A1928;"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      centerMarkerRef.current = L.marker([center.lat, center.lng], { icon: centerIcon }).addTo(map);
    }
  }, [type, center, radiusM, color]);

  // Render polygon preview + vertex markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old polygon and markers
    polygonRef.current?.remove();
    for (const m of vertexMarkersRef.current) m.remove();
    vertexMarkersRef.current = [];

    if (type === "POLYGON" && polygon.length > 0) {
      const coords = polygon.map((p) => [p.lat, p.lng] as [number, number]);

      if (polygon.length >= 3) {
        // Draw polygon
        const poly = L.polygon(coords, {
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);
        polygonRef.current = poly;
      } else {
        // Draw polyline for incomplete polygon
        const line = L.polyline(coords, {
          color: color,
          weight: 2,
        }).addTo(map);
        polygonRef.current = line as unknown as L.Polygon;
      }

      // Vertex markers
      polygon.forEach((p) => {
        const vertexIcon = L.divIcon({
          html: `<div style="width:8px;height:8px;border-radius:50%;background:${color};border:1.5px solid #0A1928;"></div>`,
          className: '',
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });
        const m = L.marker([p.lat, p.lng], { icon: vertexIcon }).addTo(map);
        vertexMarkersRef.current.push(m);
      });
    }
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

      <div className="relative flex-1 bg-ink-900" style={{ minHeight: "400px" }}>
        <div ref={containerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
