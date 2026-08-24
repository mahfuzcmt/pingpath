"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, type StringKey } from "@/lib/i18n";
import { filterSpeed, formatSince, formatVoltage, gsmBars, vehicleState, VEHICLE_STATE_COLOR, type VehicleState } from "@/lib/format";
import { useSpeedLimits } from "@/hooks/useSpeedLimits";
import { useTicker } from "@/hooks/useTicker";
import type { DeviceView, LocationView } from "@/types/domain";
import type { LiveLocationView } from "@/hooks/useLiveLocations";

const OVERSPEED_COLOR = "#DC2626";

/** Freshness thresholds in milliseconds for UI feedback */
const FRESHNESS_LIVE_MS = 30 * 1000;    // 🟢 Live: < 30 seconds
const FRESHNESS_STALE_MS = 60 * 1000;   // 🟡 Stale: 30-60 seconds

type FreshnessStatus = "live" | "stale" | "no-signal";

function getFreshnessStatus(location: LocationView | LiveLocationView | undefined): FreshnessStatus {
  if (!location) return "no-signal";
  // Use the actual GPS timestamp to calculate real data age
  const gpsTime = new Date(location.ts).getTime();
  const age = Date.now() - gpsTime;
  if (age < FRESHNESS_LIVE_MS) return "live";
  if (age < FRESHNESS_STALE_MS) return "stale";
  return "no-signal";
}

function getSecondsSinceUpdate(location: LocationView | LiveLocationView | undefined): number {
  if (!location) return 999;
  // Use the actual GPS timestamp to show real data age
  const gpsTime = new Date(location.ts).getTime();
  return Math.floor((Date.now() - gpsTime) / 1000);
}

const FRESHNESS_CONFIG = {
  live: { label: "Live", color: "#16A34A", icon: "🟢" },
  stale: { label: "Stale", color: "#F59E0B", icon: "🟡" },
  "no-signal": { label: "No Signal", color: "#DC2626", icon: "🔴" },
} as const;

interface DeviceListProps {
  devices: DeviceView[];
  locations: Map<string, LocationView | LiveLocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
  onViewHistory?: (imei: string) => void;
}

// 3-dot action menu dropdown
function DeviceActionsMenu({
  imei,
  onEdit,
  onViewHistory,
}: {
  imei: string;
  onEdit: () => void;
  onViewHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex h-5 w-5 items-center justify-center rounded text-ink-400 transition hover:bg-white/60 hover:text-ink-700"
        title="More actions"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-white/30 bg-white/95 py-1 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink-700 transition hover:bg-brand-50/50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onViewHistory();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink-700 transition hover:bg-brand-50/50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Route History
          </button>
        </div>
      )}
    </div>
  );
}

// Sidebar now uses the shared vehicleState() model (same as the Vehicles
// screen and the map markers) instead of a private 4-state helper.
type ChipId = VehicleState | "all";

const STATE_LABEL: Record<VehicleState, StringKey> = {
  moving: "veh.moving",
  idle: "veh.idle",
  stopped: "veh.stopped",
  offline: "veh.offline",
  expired: "veh.expired",
  nodata: "veh.nodata",
};

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

// Freshness indicator showing data recency
function FreshnessIndicator({ location }: { location: LocationView | LiveLocationView | undefined }) {
  const freshness = getFreshnessStatus(location);
  const config = FRESHNESS_CONFIG[freshness];
  const secondsAgo = getSecondsSinceUpdate(location);

  const text = secondsAgo < 60
    ? `${secondsAgo}s`
    : secondsAgo < 3600
      ? `${Math.floor(secondsAgo / 60)}m`
      : "—";

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
      title={`${config.label} - Updated ${text} ago`}
    >
      <span className="text-[8px]">{config.icon}</span>
      <span>{text}</span>
    </span>
  );
}

// GSM signal strength icon — `bars` is 0-4 from gsmBars(device.lastGsmSignal).
function SignalIcon({ bars, title }: { bars: number; title?: string }) {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      {title != null && <title>{title}</title>}
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

export function DeviceList({ devices, locations, selectedImei, onSelect, onViewHistory }: DeviceListProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ChipId>("all");
  const [checkedDevices, setCheckedDevices] = useState<Set<string>>(new Set());
  const speedLimits = useSpeedLimits();
  // Force re-render every second to keep "since" times fresh
  useTicker(1000);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const over = (d: DeviceView) =>
      speedLimits.isOverspeed(d.imei, locations.get(d.imei)?.speed ?? d.lastSpeed);
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
        return vehicleState(d, locations.get(d.imei)) === filter;
      })
      .sort((a, b) => {
        // Overspeeding vehicles surface at the top of the list.
        const ao = over(a);
        const bo = over(b);
        if (ao !== bo) return ao ? -1 : 1;
        if (a.status !== b.status) {
          if (a.status === "ONLINE") return -1;
          if (b.status === "ONLINE") return 1;
        }
        const at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bt - at;
      });
  }, [devices, locations, query, filter, speedLimits]);

  const counts = useMemo(() => {
    const c: Record<ChipId, number> = {
      all: devices.length, moving: 0, idle: 0, stopped: 0, offline: 0, expired: 0, nodata: 0,
    };
    for (const d of devices) c[vehicleState(d, locations.get(d.imei))]++;
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

  const FILTERS: { id: ChipId; label: StringKey }[] = [
    { id: "all", label: "veh.all" },
    { id: "moving", label: "veh.moving" },
    { id: "idle", label: "veh.idle" },
    { id: "stopped", label: "veh.stopped" },
    { id: "expired", label: "veh.expired" },
    { id: "offline", label: "veh.offline" },
    { id: "nodata", label: "veh.nodata" },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-r border-white/20 bg-white/92 backdrop-blur-xl">
      {/* Search */}
      <div className="border-b border-white/20 px-2 py-2">
        <input
          type="search"
          className="w-full rounded-mkt border border-white/30 bg-white/60 px-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 shadow-glass-inset backdrop-blur-sm transition focus:border-brand-400/50 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          placeholder={t("fleet.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Status filter chips — shared 6-state model (matches Vehicles screen) */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/20 bg-white/50 px-1.5 py-1.5 backdrop-blur-sm">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
              filter === f.id
                ? "border border-brand-400/50 bg-brand-50/80 text-brand-700 shadow-sm backdrop-blur-sm"
                : "border border-white/30 bg-white/60 text-ink-600 hover:bg-white/80 hover:border-white/50 backdrop-blur-sm"
            }`}
          >
            {f.id !== "all" && (
              <span className="status-dot" style={{ backgroundColor: VEHICLE_STATE_COLOR[f.id] }} />
            )}
            <span>{t(f.label)}</span>
            <span className="text-ink-400">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 border-b border-white/20 bg-white/40 px-2 py-1.5 backdrop-blur-sm">
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 bg-white/60 text-ink-600 shadow-sm backdrop-blur-sm transition hover:bg-white/80 hover:border-white/50 hover:text-ink-800" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 bg-white/60 text-ink-600 shadow-sm backdrop-blur-sm transition hover:bg-white/80 hover:border-white/50 hover:text-ink-800" title="List view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 bg-white/60 text-ink-600 shadow-sm backdrop-blur-sm transition hover:bg-white/80 hover:border-white/50 hover:text-ink-800" title="Share">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 bg-white/60 text-ink-600 shadow-sm backdrop-blur-sm transition hover:bg-white/80 hover:border-white/50 hover:text-ink-800" title="Export">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-white/20 bg-white/60 px-2 py-1.5 backdrop-blur-sm">
        <button type="button" className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 transition hover:bg-white/60 hover:text-ink-700" title="Toggle visibility">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <input
          type="checkbox"
          checked={checkedDevices.size === sorted.length && sorted.length > 0}
          onChange={toggleAll}
          className="h-3.5 w-3.5 rounded border-white/40 bg-white/60"
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
          const state = vehicleState(d, live);
          const overspeed = speedLimits.isOverspeed(d.imei, live?.speed ?? d.lastSpeed);
          const statusColor = overspeed ? OVERSPEED_COLOR : VEHICLE_STATE_COLOR[state];
          // Different "since" times per state:
          // - moving/idle: last update time
          // - stopped: parking duration (trip end time)
          // - offline/expired/nodata: last seen time (how long disconnected)
          const sinceTs = state === "stopped" ? (d.parkedSince ?? ts) : ts;

          return (
            <li
              key={d.imei}
              className={`border-b border-white/10 transition ${idx % 2 === 0 ? "bg-white/40" : "bg-white/20"} ${
                selected ? "!bg-brand-50/70 backdrop-blur-sm" : "hover:bg-white/60"
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
                  <span className={overspeed ? "animate-pulse" : undefined}>
                    <VehicleIcon type={d.vehicleType} color={statusColor} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-xs font-semibold ${overspeed ? "" : "text-ink-900"}`}
                      style={{ color: overspeed ? OVERSPEED_COLOR : undefined }}
                    >
                      {d.name || d.vehiclePlate || d.imei.slice(-8)}
                    </div>
                    <div className="text-[10px]" style={{ color: statusColor }}>
                      {overspeed ? "Overspeed" : t(STATE_LABEL[state])} {formatSince(sinceTs)}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  {/* Freshness indicator */}
                  <FreshnessIndicator location={live} />
                  {/* Speed with kph unit */}
                  <span
                    className={`min-w-[40px] text-right text-[10px] font-semibold ${overspeed ? "animate-pulse" : "text-ink-900"}`}
                    style={{ color: overspeed ? OVERSPEED_COLOR : undefined }}
                    title="Current speed"
                  >
                    {filterSpeed(live?.speed, live?.valid)} <span className="text-[8px] font-normal text-ink-500">kph</span>
                  </span>
                  {/* GSM signal - use live data if available, fallback to device data */}
                  <SignalIcon
                    bars={gsmBars(live?.gsmSignal ?? d.lastGsmSignal)}
                    title={`GSM ${live?.gsmSignal ?? d.lastGsmSignal ?? 0}/31`}
                  />
                  <span className="min-w-[28px] text-right font-mono text-[9px] text-ink-500" title="External voltage">
                    {formatVoltage(live?.voltageMv ?? d.lastVoltageMv, locale)}
                  </span>
                  <DeviceActionsMenu
                    imei={d.imei}
                    onEdit={() => router.push(`/dashboard/devices/${d.imei}`)}
                    onViewHistory={() => {
                      onSelect(d.imei);
                      if (onViewHistory) onViewHistory(d.imei);
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
