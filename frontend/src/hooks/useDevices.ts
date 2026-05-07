"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DeviceView } from "@/types/domain";

export function useDevices() {
  const [devices, setDevices] = useState<DeviceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get<DeviceView[]>("/devices");
        if (!cancelled) setDevices(r.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load devices");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { devices, loading, error, setDevices };
}
