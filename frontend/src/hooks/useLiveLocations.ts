"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { subscribeLocations } from "@/lib/ws";
import type { LocationView } from "@/types/domain";

/**
 * Holds the current last-known position per IMEI for the org. On mount:
 * 1. REST GET /devices/locations/all-last for the bootstrap snapshot
 * 2. STOMP subscribe /topic/org/{orgId}/locations for live updates
 *
 * Returns a map keyed by IMEI plus a `bumpId` that increments on every
 * mutation so consumers (the map) can re-render markers cheaply.
 */
export function useLiveLocations(orgId: string) {
  const [locations, setLocations] = useState<Map<string, LocationView>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // bumpId is unused here directly but lets consumers depend on a primitive.
  const [bumpId, setBumpId] = useState(0);
  const mounted = useRef(true);

  const upsert = useCallback((loc: LocationView) => {
    setLocations((prev) => {
      const next = new Map(prev);
      const existing = next.get(loc.imei);
      if (existing && new Date(existing.ts).getTime() >= new Date(loc.ts).getTime()) {
        return prev; // ignore out-of-order
      }
      next.set(loc.imei, loc);
      return next;
    });
    setBumpId((n) => n + 1);
  }, []);

  useEffect(() => {
    mounted.current = true;
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const r = await api.get<LocationView[]>("/devices/locations/last");
        if (!mounted.current) return;
        const m = new Map<string, LocationView>();
        for (const l of r.data) m.set(l.imei, l);
        setLocations(m);
        setLoaded(true);
      } catch (err) {
        if (mounted.current) setError(err instanceof Error ? err.message : "snapshot failed");
        setLoaded(true);
      }

      try {
        unsub = await subscribeLocations(orgId, (loc) => {
          if (mounted.current) upsert(loc);
        });
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : "WS subscribe failed");
        }
      }
    })();

    return () => {
      mounted.current = false;
      unsub?.();
    };
  }, [orgId, upsert]);

  return { locations, loaded, error, bumpId };
}
