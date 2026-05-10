"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { formatRelative } from "@/lib/format";
import type { DeviceView, LocationView } from "@/types/domain";

interface DeviceListProps {
  devices: DeviceView[];
  locations: Map<string, LocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
}

type StatusFilter = "all" | "moving" | "stopped" | "offline";

const FILTERS: { id: StatusFilter; label: string; cls: string }[] = [
  { id: "all", label: "All", cls: "" },
  { id: "moving", label: "Moving", cls: "text-status-moving" },
  { id: "stopped", label: "Stopped", cls: "text-status-stopped" },
  { id: "offline", label: "Offline", cls: "text-ink-500" },
];

function deviceMode(d: DeviceView, live: LocationView | undefined): StatusFilter {
  if (d.status !== "ONLINE") return "offline";
  if (live && live.speed > 5) return "moving";
  return "stopped";
}

export function DeviceList({ devices, locations, selectedImei, onSelect }: DeviceListProps) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices
      .filter((d) => {
        if (q) {
          const hit =
            d.imei.includes(q) ||
            (d.name?.toLowerCase().includes(q) ?? false) ||
            (d.vehiclePlate?.toLowerCase().includes(q) ?? false);
          if (!hit) return false;
        }
        if (filter === "all") return true;
        return deviceMode(d, locations.get(d.imei)) === filter;
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "ONLINE") return -1;
          if (b.status === "ONLINE") return 1;
        }
        const at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bt - at;
      });
  }, [devices, locations, query, filter]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: devices.length, moving: 0, stopped: 0, offline: 0 };
    for (const d of devices) c[deviceMode(d, locations.get(d.imei))]++;
    return c;
  }, [devices, locations]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      {/* Search */}
      <div className="border-b border-surface-300 px-2 py-2">
        <input
          type="search"
          className="input-search"
          placeholder={t("fleet.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-1 border-b border-surface-300 bg-surface-100 px-2 py-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={filter === f.id ? "filter-chip-active" : "filter-chip"}
          >
            <span className={f.cls}>{f.label}</span>
            <span className="text-[10px] text-ink-500">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Object list */}
      <ul className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <li className="px-3 py-8 text-center text-xs text-ink-500">{t("fleet.noDevices")}</li>
        )}
        {sorted.map((d, idx) => {
          const live = locations.get(d.imei);
          const ts = live?.ts ?? d.lastSeenAt;
          const selected = d.imei === selectedImei;
          const mode = deviceMode(d, live);
          const dotClass =
            mode === "moving"
              ? "status-dot-online"
              : mode === "stopped"
                ? "status-dot-stopped"
                : "status-dot-offline";

          return (
            <li
              key={d.imei}
              className={`border-b border-surface-100 ${idx % 2 === 0 ? "bg-white" : "bg-surface-50"}`}
            >
              <button
                type="button"
                onClick={() => onSelect(selected ? null : d.imei)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-surface-100 ${
                  selected ? "!bg-brand-50 ring-1 ring-inset ring-brand-100" : ""
                }`}
              >
                <span className={dotClass} title={d.status} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-ink-900">
                    {d.name || d.vehiclePlate || (
                      <span className="font-mono">{d.imei}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-500">
                    <span className="font-mono">{d.imei.slice(-6)}</span>
                    <span>·</span>
                    <span>{formatRelative(ts, locale)}</span>
                  </div>
                </div>
                {live && (
                  <div className="text-right">
                    <div className="text-xs font-semibold text-ink-900">{live.speed}</div>
                    <div className="text-[10px] text-ink-500">{t("fleet.kmh")}</div>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
