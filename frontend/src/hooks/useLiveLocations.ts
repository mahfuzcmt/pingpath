"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { subscribeLocations } from "@/lib/ws";
import type { LocationView } from "@/types/domain";

/** Auto-refresh interval in milliseconds (10 seconds as per requirement). */
const AUTO_REFRESH_INTERVAL_MS = 10_000;

/**
 * Extended location view with frontend update tracking.
 * `frontendUpdatedAt` tracks when the frontend received this data (for freshness UI).
 */
export interface LiveLocationView extends LocationView {
  /** Timestamp when this data was received by the frontend (not GPS time). */
  frontendUpdatedAt: number;
  /** Whether this was just updated (for pulse animation). Resets after ~2 seconds. */
  justUpdated?: boolean;
}

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
function merge(existing: LiveLocationView, incoming: LocationView): LiveLocationView {
  const now = Date.now();
  if (incoming.valid) {
    return { ...incoming, frontendUpdatedAt: now, justUpdated: true };
  }
  // Invalid GPS fix: position is stale, so the reported speed is also unreliable
  // (GT06 derives speed from GPS). Show 0 speed to avoid confusing "moving but stuck" display.
  return {
    ...incoming,
    latitude: existing.latitude,
    longitude: existing.longitude,
    speed: 0,
    course: existing.course,
    lastValidTs: incoming.lastValidTs ?? existing.lastValidTs ?? null,
    frontendUpdatedAt: now,
    justUpdated: true,
  };
}

export function useLiveLocations(orgId: string) {
  const [locations, setLocations] = useState<Map<string, LiveLocationView>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // bumpId is unused here directly but lets consumers depend on a primitive.
  const [bumpId, setBumpId] = useState(0);
  // Track last refresh time for UI countdown if needed
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const upsert = useCallback((loc: LocationView) => {
    const now = Date.now();
    setLocations((prev) => {
      const next = new Map(prev);
      const existing = next.get(loc.imei);
      if (existing && new Date(existing.ts).getTime() >= new Date(loc.ts).getTime()) {
        return prev; // ignore out-of-order
      }
      if (existing) {
        next.set(loc.imei, merge(existing, loc));
      } else {
        next.set(loc.imei, { ...loc, frontendUpdatedAt: now, justUpdated: true });
      }
      return next;
    });
    setBumpId((n) => n + 1);
  }, []);

  /** Re-pull the last-known snapshot (the map's "Refresh" control). */
  const refresh = useCallback(async () => {
    try {
      const now = Date.now();
      const r = await api.get<LocationView[]>("/devices/locations/last");
      if (!mounted.current) return;
      setLocations((prev) => {
        const next = new Map(prev);
        for (const l of r.data) {
          const existing = next.get(l.imei);
          if (!existing || new Date(l.ts).getTime() >= new Date(existing.ts).getTime()) {
            // Mark as justUpdated only if the data actually changed
            const dataChanged = !existing || existing.ts !== l.ts;
            next.set(l.imei, {
              ...l,
              frontendUpdatedAt: existing?.frontendUpdatedAt ?? now,
              justUpdated: dataChanged,
            });
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

    // Use setInterval instead of recursive setTimeout for more reliable timing
    // Mobile browsers may throttle timeouts but intervals are slightly more consistent
    const startRefreshInterval = () => {
      if (refreshIntervalId) clearInterval(refreshIntervalId);
      refreshIntervalId = setInterval(() => {
        if (mounted.current) refresh();
      }, AUTO_REFRESH_INTERVAL_MS);
    };

    // Handle visibility change - refresh immediately when tab becomes visible
    // This is critical for mobile browsers that pause JS when backgrounded
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mounted.current) {
        refresh();
        // Restart the interval to reset the 10-second timer
        startRefreshInterval();
      }
    };

    // Handle page focus - also refresh when user returns to the tab
    const handleFocus = () => {
      if (mounted.current) {
        refresh();
        startRefreshInterval();
      }
    };

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

      // Start the refresh interval
      startRefreshInterval();
    })();

    // Add visibility and focus listeners for mobile browser support
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted.current = false;
      unsub?.();
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [orgId, upsert, refresh]);

  // Clear justUpdated flag after 2 seconds for each location
  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    for (const [imei, loc] of locations) {
      if (loc.justUpdated) {
        const timeoutId = setTimeout(() => {
          setLocations((prev) => {
            const next = new Map(prev);
            const current = next.get(imei);
            if (current?.justUpdated) {
              next.set(imei, { ...current, justUpdated: false });
            }
            return next;
          });
        }, 2000);
        timeoutIds.push(timeoutId);
      }
    }
    return () => {
      for (const id of timeoutIds) clearTimeout(id);
    };
  }, [locations]);

  return { locations, loaded, error, bumpId, refresh, lastRefreshAt };
}
