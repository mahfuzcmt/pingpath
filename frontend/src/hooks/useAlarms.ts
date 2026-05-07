"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { subscribeAlarms } from "@/lib/ws";
import type { AlarmView } from "@/types/domain";

interface Options {
  unackedOnly?: boolean;
  limit?: number;
}

/**
 * Loads recent alarms via REST then merges live STOMP pushes.
 * Newest alarms appear first; the live stream prepends new entries and
 * upserts when an existing alarm is acknowledged.
 */
export function useAlarms(orgId: string, opts: Options = {}) {
  const { unackedOnly = false, limit = 100 } = opts;
  const [alarms, setAlarms] = useState<AlarmView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const upsert = useCallback((a: AlarmView) => {
    setAlarms((prev) => {
      const i = prev.findIndex((x) => x.id === a.id);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = a;
        return next;
      }
      return [a, ...prev];
    });
  }, []);

  const acknowledge = useCallback(async (id: string) => {
    const r = await api.post<AlarmView>(`/alarms/${id}/acknowledge`);
    upsert(r.data);
    return r.data;
  }, [upsert]);

  useEffect(() => {
    mounted.current = true;
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const params: Record<string, string | number> = { limit };
        if (unackedOnly) params.unacked = "true";
        const r = await api.get<AlarmView[]>("/alarms", { params });
        if (mounted.current) setAlarms(r.data);
      } catch (err) {
        if (mounted.current) setError(err instanceof Error ? err.message : "Failed to load alarms");
      } finally {
        if (mounted.current) setLoading(false);
      }

      try {
        unsub = await subscribeAlarms(orgId, (a) => {
          if (mounted.current) upsert(a);
        });
      } catch (err) {
        if (mounted.current) setError(err instanceof Error ? err.message : "WS subscribe failed");
      }
    })();

    return () => {
      mounted.current = false;
      unsub?.();
    };
  }, [orgId, unackedOnly, limit, upsert]);

  return { alarms, loading, error, acknowledge };
}
