"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { subscribeBatchLocations } from "@/lib/ws";
import type { LocationView } from "@/types/domain";

/** Animation interval in milliseconds (matches backend batch interval). */
const BATCH_INTERVAL_MS = 10_000;

/** A waypoint in the animation queue. */
interface Waypoint {
  latitude: number;
  longitude: number;
  ts: string;
  speed: number;
  course: number;
}

/**
 * Extended location view with animation state for smooth marker movement.
 *
 * The map animates through the waypoint queue sequentially, showing
 * smooth movement through ALL received positions, not just jumping to the latest.
 */
export interface LiveLocationView extends LocationView {
  /** Whether this was just updated (for pulse animation). Resets after ~2 seconds. */
  justUpdated?: boolean;
  /** Queue of waypoints to animate through. Frontend pops from front as animation progresses. */
  waypointQueue?: Waypoint[];
  /** Current animation segment start position. */
  prevLatitude?: number;
  /** Current animation segment start position. */
  prevLongitude?: number;
  /** When the current animation segment started. */
  animationStartMs?: number;
  /** Duration for the current animation segment in ms. */
  animationDurationMs?: number;
  /** Target position for current segment (next waypoint). */
  targetLatitude?: number;
  /** Target position for current segment (next waypoint). */
  targetLongitude?: number;
}

/**
 * Calculate interpolated position for smooth marker animation.
 * Handles sequential waypoint animation - when one segment completes,
 * automatically moves to the next waypoint in the queue.
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
    loc.targetLatitude === undefined ||
    loc.targetLongitude === undefined ||
    loc.animationStartMs === undefined ||
    loc.animationDurationMs === undefined
  ) {
    return { lat: loc.latitude, lng: loc.longitude };
  }

  // Calculate animation progress (0 to 1)
  const elapsed = now - loc.animationStartMs;
  const progress = Math.min(elapsed / loc.animationDurationMs, 1);

  // Ease-out cubic for smooth deceleration
  const eased = 1 - Math.pow(1 - progress, 3);

  // Interpolate between previous and target position
  const lat = loc.prevLatitude + (loc.targetLatitude - loc.prevLatitude) * eased;
  const lng = loc.prevLongitude + (loc.targetLongitude - loc.prevLongitude) * eased;

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
  if (!loc.animationStartMs || !loc.animationDurationMs) return false;
  const elapsed = now - loc.animationStartMs;
  return elapsed < loc.animationDurationMs;
}

/**
 * Check if animation segment is complete and advance to next waypoint if available.
 * Returns the updated location if waypoint was advanced, or null if no change.
 */
export function advanceWaypointIfNeeded(
  loc: LiveLocationView,
  now: number = Date.now()
): LiveLocationView | null {
  if (!loc.waypointQueue || loc.waypointQueue.length === 0) {
    return null;
  }

  // Check if current animation segment is complete
  if (loc.animationStartMs && loc.animationDurationMs) {
    const elapsed = now - loc.animationStartMs;
    if (elapsed < loc.animationDurationMs) {
      return null; // Still animating current segment
    }
  }

  // Pop next waypoint from queue
  const nextWaypoint = loc.waypointQueue[0];
  const remainingQueue = loc.waypointQueue.slice(1);

  // Calculate duration for this segment
  // Divide remaining time equally among remaining waypoints
  const remainingTimeMs = Math.max(BATCH_INTERVAL_MS - 1500, 2000); // At least 2s
  const segmentDuration = remainingQueue.length > 0
    ? remainingTimeMs / (remainingQueue.length + 1)
    : remainingTimeMs;

  return {
    ...loc,
    // Update current position to previous target
    prevLatitude: loc.targetLatitude ?? loc.latitude,
    prevLongitude: loc.targetLongitude ?? loc.longitude,
    // Set new target
    targetLatitude: nextWaypoint.latitude,
    targetLongitude: nextWaypoint.longitude,
    // Update telemetry
    latitude: nextWaypoint.latitude,
    longitude: nextWaypoint.longitude,
    speed: nextWaypoint.speed,
    course: nextWaypoint.course,
    ts: nextWaypoint.ts,
    // Animation state
    animationStartMs: now,
    animationDurationMs: segmentDuration,
    waypointQueue: remainingQueue,
  };
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

  if (incoming.valid && positionChanged) {
    // Add to waypoint queue instead of immediately jumping
    const newWaypoint: Waypoint = {
      latitude: incoming.latitude,
      longitude: incoming.longitude,
      ts: incoming.ts,
      speed: incoming.speed,
      course: incoming.course,
    };

    const existingQueue = existing.waypointQueue ?? [];

    return {
      ...existing,
      // Keep current animation state, just add to queue
      waypointQueue: [...existingQueue, newWaypoint],
      justUpdated: true,
      // Update telemetry that doesn't affect position
      satellites: incoming.satellites,
      accOn: incoming.accOn,
      voltageMv: incoming.voltageMv,
      gsmSignal: incoming.gsmSignal,
      valid: incoming.valid,
    };
  }

  if (incoming.valid && !positionChanged) {
    // Valid but same position - just update telemetry
    return {
      ...existing,
      ...incoming,
      justUpdated: true,
      // Keep animation state
      waypointQueue: existing.waypointQueue,
      prevLatitude: existing.prevLatitude,
      prevLongitude: existing.prevLongitude,
      targetLatitude: existing.targetLatitude,
      targetLongitude: existing.targetLongitude,
      animationStartMs: existing.animationStartMs,
      animationDurationMs: existing.animationDurationMs,
    };
  }

  // Invalid GPS fix: position is stale, so the reported speed is also unreliable
  // (GT06 derives speed from GPS). Show 0 speed to avoid confusing "moving but stuck" display.
  return {
    ...existing,
    speed: 0,
    lastValidTs: incoming.lastValidTs ?? existing.lastValidTs ?? null,
    justUpdated: true,
    // Update telemetry
    satellites: incoming.satellites,
    accOn: incoming.accOn,
    voltageMv: incoming.voltageMv,
    gsmSignal: incoming.gsmSignal,
    ts: incoming.ts,
  };
}

/**
 * Start animation for a device that has waypoints queued.
 * Call this after adding waypoints to begin the animation sequence.
 */
function startAnimationIfNeeded(
  loc: LiveLocationView,
  now: number
): LiveLocationView {
  // If already animating or no waypoints, no change needed
  if (loc.animationStartMs || !loc.waypointQueue || loc.waypointQueue.length === 0) {
    return loc;
  }

  // Start animating to first waypoint
  const firstWaypoint = loc.waypointQueue[0];
  const remainingQueue = loc.waypointQueue.slice(1);

  // Calculate duration per segment - divide animation time by number of waypoints
  const totalWaypoints = loc.waypointQueue.length;
  const animationWindow = BATCH_INTERVAL_MS - 1500; // Leave 1.5s buffer
  const segmentDuration = Math.max(animationWindow / totalWaypoints, 500); // At least 500ms per segment

  return {
    ...loc,
    prevLatitude: loc.latitude,
    prevLongitude: loc.longitude,
    targetLatitude: firstWaypoint.latitude,
    targetLongitude: firstWaypoint.longitude,
    animationStartMs: now,
    animationDurationMs: segmentDuration,
    waypointQueue: remainingQueue,
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
 * Animation: Each location includes a waypoint queue. Use `getInterpolatedPosition()`
 * to get the current animated position, and call `advanceWaypointIfNeeded()` in
 * your animation loop to progress through waypoints.
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
   * The batch may contain multiple points per device, sorted by timestamp.
   * All points are queued for sequential animation.
   */
  const processBatch = useCallback((batch: LocationView[]) => {
    const now = Date.now();
    setLocations((prev) => {
      const next = new Map(prev);
      let changed = false;

      // Group locations by IMEI to process in order
      const byImei = new Map<string, LocationView[]>();
      for (const loc of batch) {
        const existing = byImei.get(loc.imei) ?? [];
        existing.push(loc);
        byImei.set(loc.imei, existing);
      }

      // Process each device's locations in timestamp order
      for (const [imei, locs] of byImei) {
        // Sort by timestamp (should already be sorted from backend, but ensure)
        locs.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

        let current = next.get(imei);

        for (const loc of locs) {
          if (current) {
            // Check if this is newer data
            if (new Date(loc.ts).getTime() <= new Date(current.ts).getTime()) {
              continue; // Skip out-of-order
            }
            current = merge(current, loc, now);
            changed = true;
          } else {
            // First time seeing this device
            current = { ...loc, justUpdated: true };
            changed = true;
          }
        }

        if (current) {
          // Start animation if we have waypoints queued
          current = startAnimationIfNeeded(current, now);
          next.set(imei, current);
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

            if (positionChanged && existing) {
              // Queue the new position for animation
              const newWaypoint: Waypoint = {
                latitude: l.latitude,
                longitude: l.longitude,
                ts: l.ts,
                speed: l.speed,
                course: l.course,
              };
              let updated: LiveLocationView = {
                ...existing,
                waypointQueue: [...(existing.waypointQueue ?? []), newWaypoint],
                justUpdated: dataChanged,
              };
              updated = startAnimationIfNeeded(updated, now);
              next.set(l.imei, updated);
            } else {
              next.set(l.imei, {
                ...l,
                justUpdated: dataChanged,
              });
            }
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

  /**
   * Advance waypoint animations. Call this from your animation loop (requestAnimationFrame).
   * Returns true if any location was updated.
   */
  const advanceAnimations = useCallback(() => {
    const now = Date.now();
    let anyUpdated = false;

    setLocations((prev) => {
      const next = new Map(prev);

      for (const [imei, loc] of prev) {
        const updated = advanceWaypointIfNeeded(loc, now);
        if (updated) {
          next.set(imei, updated);
          anyUpdated = true;
        }
      }

      return anyUpdated ? next : prev;
    });

    return anyUpdated;
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

  return { locations, loaded, error, bumpId, refresh, lastRefreshAt, advanceAnimations };
}
