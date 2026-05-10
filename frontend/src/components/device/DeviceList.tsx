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

type StatusFilter = "all" | "moving" | "stopped" | "idle" | "offline";

function deviceMode(d: DeviceView, live: LocationView | undefined): StatusFilter {
  if (d.status !== "ONLINE") return "offline";
  if (!live) return "idle";
  if (live.speed > 2) return "moving";
  if (live.accOn) return "idle";
  return "stopped";
}

function formatDuration(ts: string | null | undefined): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs} s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ${secs % 60} s`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ${mins % 60} min`;
  const days = Math.floor(hrs / 24);
  return `${days} d ${hrs % 24} h ${mins % 60} min`;
}

function getStatusLabel(mode: StatusFilter, ts: string | null | undefined): string {
  const duration = formatDuration(ts);
  switch (mode) {
    case "moving": return `Moving ${duration}`;
    case "stopped": return `Stopped ${duration}`;
    case "idle": return `Engine idle ${duration}`;
    case "offline": return `Offline ${duration}`;
    default: return "";
  }
}

// Vehicle icon SVG based on type
function VehicleIcon({ type, color }: { type?: string | null; color: string }) {
  // Simple truck/car icon
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="16" height="8" rx="1" fill={color} />
      <rect x="17" y="6" width="6" height="6" rx="1" fill={color} />
      <circle cx="5" cy="13" r="2" fill="#333" />
      <circle cx="14" cy="13" r="2" fill="#333" />
      <circle cx="20" cy="13" r="1.5" fill="#333" />
    </svg>
  );
}

// Signal strength icon
function SignalIcon({ strength }: { strength: number }) {
  const bars = Math.min(4, Math.max(0, Math.ceil(strength / 25)));
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 3.5}
          y={9 - i * 2.5}
          width="2.5"
          height={3 + i * 2.5}
          rx="0.5"
          fill={i < bars ? "#4DA74D" : "#DDD"}
        />
      ))}
    </svg>
  );
}

// Battery icon
function BatteryIcon({ level }: { level?: number }) {
  const pct = level ?? 100;
  const color = pct > 50 ? "#4DA74D" : pct > 20 ? "#EDC240" : "#CB4B4B";
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
      <rect x="0.5" y="0.5" width="13" height="9" rx="1" stroke="#999" />
      <rect x="14" y="3" width="2" height="4" rx="0.5" fill="#999" />
      <rect x="1.5" y="1.5" width={Math.max(0, (pct / 100) * 11)} height="7" rx="0.5" fill={color} />
    </svg>
  );
}

export function DeviceList({ devices, locations, selectedImei, onSelect }: DeviceListProps) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [checkedDevices, setCheckedDevices] = useState<Set<string>>(new Set());

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
    const c: Record<StatusFilter, number> = { all: devices.length, moving: 0, stopped: 0, idle: 0, offline: 0 };
    for (const d of devices) c[deviceMode(d, locations.get(d.imei))]++;
    return c;
  }, [devices, locations]);

  const toggleCheck = (imei: string) => {
    setCheckedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(imei)) next.delete(imei);
      else next.add(imei);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedDevices.size === sorted.length) {
      setCheckedDevices(new Set());
    } else {
      setCheckedDevices(new Set(sorted.map((d) => d.imei)));
    }
  };

  const FILTERS: { id: StatusFilter; label: string; color: string }[] = [
    { id: "all", label: "All", color: "" },
    { id: "moving", label: "Moving", color: "text-status-moving" },
    { id: "stopped", label: "Stopped", color: "text-status-stopped" },
    { id: "idle", label: "Idle", color: "text-status-idle" },
    { id: "offline", label: "Offline", color: "text-ink-400" },
  ];

  return (
    <div className="flex h-full min-h-0 w-[320px] flex-col border-r border-surface-300 bg-white">
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

      {/* Status filter tabs */}
      <div className="flex items-center border-b border-surface-300 bg-white">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition ${
              filter === f.id
                ? "border-b-2 border-brand-500 text-ink-900"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <span className={f.color}>{f.label}</span>
            <span className="text-[10px] text-ink-400">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 border-b border-surface-300 bg-surface-50 px-2 py-1">
        <button type="button" className="btn-icon" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
        <button type="button" className="btn-icon" title="List view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button type="button" className="btn-icon" title="Share">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        <button type="button" className="btn-icon" title="Export">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-surface-300 bg-surface-100 px-2 py-1">
        <button type="button" className="btn-icon" title="Toggle visibility">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <input
          type="checkbox"
          checked={checkedDevices.size === sorted.length && sorted.length > 0}
          onChange={toggleAll}
          className="h-3.5 w-3.5 rounded border-surface-300"
        />
        <span className="flex-1 text-xs font-semibold text-ink-700">Object</span>
        <span className="text-[10px] text-ink-500">Ungrouped ({sorted.length})</span>
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
          const checked = checkedDevices.has(d.imei);
          const mode = deviceMode(d, live);

          const statusColor =
            mode === "moving" ? "#4DA74D" :
            mode === "idle" ? "#9440ED" :
            mode === "stopped" ? "#CB4B4B" :
            "#AFD8F8";

          const statusTextColor =
            mode === "moving" ? "text-status-moving" :
            mode === "idle" ? "text-status-idle" :
            mode === "stopped" ? "text-status-stopped" :
            "text-ink-400";

          return (
            <li
              key={d.imei}
              className={`border-b border-surface-100 ${idx % 2 === 0 ? "bg-white" : "bg-surface-50"} ${
                selected ? "!bg-brand-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCheck(d.imei)}
                  className="h-3.5 w-3.5 rounded border-surface-300"
                />
                <button
                  type="button"
                  onClick={() => onSelect(selected ? null : d.imei)}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <VehicleIcon type={d.vehicleType} color={statusColor} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-ink-900">
                      {d.name || d.vehiclePlate || d.imei.slice(-8)}
                    </div>
                    <div className={`text-[10px] ${statusTextColor}`}>
                      {getStatusLabel(mode, ts)}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <span className="min-w-[40px] text-right text-xs font-semibold text-ink-900">
                    {live?.speed ?? 0} kph
                  </span>
                  <SignalIcon strength={80} />
                  <BatteryIcon level={live?.voltageMv ? Math.min(100, Math.round((live.voltageMv - 10000) / 50)) : undefined} />
                  <button type="button" className="text-ink-400 hover:text-ink-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
