"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { subscribeBatchLocations } from "@/lib/ws";
import type { LocationView } from "@/types/domain";

/** Animation interval in milliseconds (matches backend batch interval). */
const BATCH_INTERVAL_MS = 10_000;

/**
 * Extended location view with animation state for smooth marker movement.
 *
 * The map uses `prevLatitude`/`prevLongitude` as the animation start point
 * and interpolates toward `latitude`/`longitude` over the batch interval.
 */
export interface LiveLocationView extends LocationView {
  /** Whether this was just updated (for pulse animation). Resets after ~2 seconds. */
  justUpdated?: boolean;
  /** Previous latitude for animation interpolation. */
  prevLatitude?: number;
  /** Previous longitude for animation interpolation. */
  prevLongitude?: number;
  /** Timestamp when the batch update arrived (for animation progress calculation). */
  animationStartMs?: number;
}

/**
 * Calculate interpolated position for smooth marker animation.
 *
 * @param loc Location with animation state
 * @param now Current timestamp (defaults to Date.now())
 * @returns Interpolated {lat, lng} position
 */
export function getInterpolatedPosition(
  loc: LiveLocationView,
  now: number = Date.now()
): { lat: number; lng: number } {
  // If no animation state, return current position
  if (
    loc.prevLatitude === undefined ||
    loc.prevLongitude === undefined ||
    loc.animationStartMs === undefined
  ) {
    return { lat: loc.latitude, lng: loc.longitude };
  }

  // Calculate animation progress (0 to 1 over BATCH_INTERVAL_MS, clamped)
  const elapsed = now - loc.animationStartMs;
  // Use 9 seconds for animation (leaving 1 second buffer before next batch)
  const animationDuration = BATCH_INTERVAL_MS - 1000;
  const progress = Math.min(elapsed / animationDuration, 1);

  // Ease-out cubic for smooth deceleration
  const eased = 1 - Math.pow(1 - progress, 3);

  // Interpolate between previous and current position
  const lat = loc.prevLatitude + (loc.latitude - loc.prevLatitude) * eased;
  const lng = loc.prevLongitude + (loc.longitude - loc.prevLongitude) * eased;

  return { lat, lng };
}

/**
 * Check if a location is currently animating (not yet reached target position).
 *
 * @param loc Location with animation state
 * @param now Current timestamp
 * @returns true if animation is in progress
 */
export function isAnimating(loc: LiveLocationView, now: number = Date.now()): boolean {
  if (!loc.animationStartMs) return false;
  const elapsed = now - loc.animationStartMs;
  return elapsed < BATCH_INTERVAL_MS - 1000;
}

/**
 * Fold an incoming packet into what we already hold for the device.
 *
 * A packet with no GPS fix still tells us the device is alive and carries fresh
 * telemetry, but its coordinates are meaningless — a GT06 repeats its last fix,
 * and some firmware sends zeros or a cell-tower estimate. So we take everything
 * except position from the new packet and leave the marker where the last
 * confirmed fix put it. This mirrors the backend rule in LocationService.
 */
function merge(
  existing: LiveLocationView,
  incoming: LocationView,
  now: number
): LiveLocationView {
  // Check if this is actually new data (newer timestamp)
  const isNewData = new Date(incoming.ts).getTime() > new Date(existing.ts).getTime();

  if (!isNewData) {
    return existing;
  }

  // Calculate if position actually changed (for animation)
  const positionChanged =
    incoming.valid &&
    (existing.latitude !== incoming.latitude || existing.longitude !== incoming.longitude);

  if (incoming.valid) {
    return {
      ...incoming,
      justUpdated: true,
      // Store previous position for animation
      prevLatitude: positionChanged ? existing.latitude : undefined,
      prevLongitude: positionChanged ? existing.longitude : undefined,
      animationStartMs: positionChanged ? now : undefined,
    };
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
    justUpdated: true,
    // Clear animation state since position didn't change
    prevLatitude: undefined,
    prevLongitude: undefined,
    animationStartMs: undefined,
  };
}

/**
 * Holds the current last-known position per IMEI for the org. On mount:
 * 1. REST GET /devices/locations/all-last for the bootstrap snapshot
 * 2. STOMP subscribe /topic/org/{orgId}/locations/batch for batched updates (every 10s)
 * 3. On visibility change, refresh from REST API
 *
 * Returns a map keyed by IMEI plus a `bumpId` that increments on every
 * mutation so consumers (the map) can re-render markers cheaply.
 *
 * Animation: Each location includes `prevLatitude`, `prevLongitude`, and
 * `animationStartMs` for smooth marker interpolation. Use `getInterpolatedPosition()`
 * to get the current animated position.
 */
export function useLiveLocations(orgId: string) {
  const [locations, setLocations] = useState<Map<string, LiveLocationView>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // bumpId is unused here directly but lets consumers depend on a primitive.
  const [bumpId, setBumpId] = useState(0);
  // Track last refresh time for UI countdown if needed
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  /**
   * Process a batch of location updates from WebSocket.
   * Updates multiple devices atomically with animation state.
   */
  const processBatch = useCallback((batch: LocationView[]) => {
    const now = Date.now();
    setLocations((prev) => {
      const next = new Map(prev);
      let changed = false;

      for (const loc of batch) {
        const existing = next.get(loc.imei);
        if (existing && new Date(existing.ts).getTime() >= new Date(loc.ts).getTime()) {
          continue; // ignore out-of-order
        }
        changed = true;

        if (existing) {
          next.set(loc.imei, merge(existing, loc, now));
        } else {
          // First time seeing this device - no animation, just set position
          next.set(loc.imei, { ...loc, justUpdated: true });
        }
      }

      return changed ? next : prev;
    });
    setBumpId((n) => n + 1);
    setLastRefreshAt(new Date());
  }, []);

  /** Re-pull the last-known snapshot (the map's "Refresh" control). */
  const refresh = useCallback(async () => {
    try {
      const r = await api.get<LocationView[]>("/devices/locations/last");
      if (!mounted.current) return;

      const now = Date.now();
      setLocations((prev) => {
        const next = new Map(prev);
        for (const l of r.data) {
          const existing = next.get(l.imei);
          if (!existing || new Date(l.ts).getTime() >= new Date(existing.ts).getTime()) {
            // Only mark as justUpdated if data actually changed (newer timestamp)
            const dataChanged = existing && existing.ts !== l.ts;
            const positionChanged =
              existing &&
              l.valid &&
              (existing.latitude !== l.latitude || existing.longitude !== l.longitude);

            next.set(l.imei, {
              ...l,
              justUpdated: dataChanged,
              // Set up animation if position changed
              prevLatitude: positionChanged ? existing.latitude : undefined,
              prevLongitude: positionChanged ? existing.longitude : undefined,
              animationStartMs: positionChanged ? now : undefined,
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

    // Handle visibility change - refresh immediately when tab becomes visible
    // This is critical for mobile browsers that pause JS when backgrounded
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mounted.current) {
        refresh();
      }
    };

    // Handle page focus - also refresh when user returns to the tab
    const handleFocus = () => {
      if (mounted.current) {
        refresh();
      }
    };

    (async () => {
      await refresh();

      try {
        // Subscribe to batched updates (every 10 seconds)
        unsub = await subscribeBatchLocations(orgId, (batch) => {
          if (mounted.current) processBatch(batch);
        });
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : "WS subscribe failed");
        }
      }
    })();

    // Add visibility and focus listeners for mobile browser support
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted.current = false;
      unsub?.();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [orgId, processBatch, refresh]);

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
