"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { subscribeLocations } from "@/lib/ws";
import type { LocationView } from "@/types/domain";

/** Auto-refresh interval in milliseconds (10 seconds as per requirement). */
const AUTO_REFRESH_INTERVAL_MS = 10_000;

/**
 * Holds the current last-known position per IMEI for the org. On mount:
 * 1. REST GET /devices/locations/all-last for the bootstrap snapshot
 * 2. STOMP subscribe /topic/org/{orgId}/locations for live updates
 * 3. Auto-refresh every 10 seconds for reliable position updates
 *
 * Returns a map keyed by IMEI plus a `bumpId` that increments on every
 * mutation so consumers (the map) can re-render markers cheaply.
 */
/**
 * Fold an incoming packet into what we already hold for the device.
 *
 * A packet with no GPS fix still tells us the device is alive and carries fresh
 * telemetry, but its coordinates are meaningless — a GT06 repeats its last fix,
 * and some firmware sends zeros or a cell-tower estimate. So we take everything
 * except position from the new packet and leave the marker where the last
 * confirmed fix put it. This mirrors the backend rule in LocationService.
 */
function merge(existing: LocationView, incoming: LocationView): LocationView {
  if (incoming.valid) return incoming;
  return {
    ...incoming,
    latitude: existing.latitude,
    longitude: existing.longitude,
    speed: existing.speed,
    course: existing.course,
    lastValidTs: incoming.lastValidTs ?? existing.lastValidTs ?? null,
  };
}

export function useLiveLocations(orgId: string) {
  const [locations, setLocations] = useState<Map<string, LocationView>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // bumpId is unused here directly but lets consumers depend on a primitive.
  const [bumpId, setBumpId] = useState(0);
  // Track last refresh time for UI countdown if needed
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const upsert = useCallback((loc: LocationView) => {
    setLocations((prev) => {
      const next = new Map(prev);
      const existing = next.get(loc.imei);
      if (existing && new Date(existing.ts).getTime() >= new Date(loc.ts).getTime()) {
        return prev; // ignore out-of-order
      }
      next.set(loc.imei, existing ? merge(existing, loc) : loc);
      return next;
    });
    setBumpId((n) => n + 1);
  }, []);

  /** Re-pull the last-known snapshot (the map's "Refresh" control). */
  const refresh = useCallback(async () => {
    try {
      const r = await api.get<LocationView[]>("/devices/locations/last");
      if (!mounted.current) return;
      setLocations((prev) => {
        const next = new Map(prev);
        for (const l of r.data) {
          const existing = next.get(l.imei);
          if (!existing || new Date(l.ts).getTime() >= new Date(existing.ts).getTime()) {
            next.set(l.imei, l);
          }
        }
        return next;
      });
      setBumpId((n) => n + 1);
      setLastRefreshAt(new Date());
      setLoaded(true);
      setError(null);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : "snapshot failed");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let unsub: (() => void) | null = null;
    let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

    (async () => {
      await refresh();

      try {
        unsub = await subscribeLocations(orgId, (loc) => {
          if (mounted.current) upsert(loc);
        });
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : "WS subscribe failed");
        }
      }

      // Auto-refresh every 10 seconds for reliable updates
      // This ensures positions update even if WebSocket misses events
      refreshIntervalId = setInterval(() => {
        if (mounted.current) {
          void refresh();
        }
      }, AUTO_REFRESH_INTERVAL_MS);
    })();

    return () => {
      mounted.current = false;
      unsub?.();
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, [orgId, upsert, refresh]);

  return { locations, loaded, error, bumpId, refresh, lastRefreshAt };
}
