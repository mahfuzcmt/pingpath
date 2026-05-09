"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { DeviceView, LocationView } from "@/types/domain";

interface DeviceListProps {
  devices: DeviceView[];
  locations: Map<string, LocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
}

type StatusFilter = "all" | "moving" | "stopped" | "idle" | "offline";
type DeviceState = "moving" | "stopped" | "idle" | "offline";

function getDeviceState(device: DeviceView, location?: LocationView): DeviceState {
  if (device.status !== "ONLINE") return "offline";
  if (!location) return "idle";
  if (location.speed > 2) return "moving";
  if (location.accOn) return "idle";
  return "stopped";
}

function formatDuration(lastSeenAt: string | null | undefined): string {
  if (!lastSeenAt) return "";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function DeviceList({ devices, locations, selectedImei, onSelect }: DeviceListProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [collapsed, setCollapsed] = useState(false);

  // Count devices by status
  const counts = useMemo(() => {
    const c = { all: devices.length, moving: 0, stopped: 0, idle: 0, offline: 0 };
    devices.forEach((d) => {
      const state = getDeviceState(d, locations.get(d.imei));
      c[state]++;
    });
    return c;
  }, [devices, locations]);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices
      .filter((d) => {
        if (q) {
          const matches = d.imei.includes(q) ||
            (d.name?.toLowerCase().includes(q) ?? false) ||
            (d.vehiclePlate?.toLowerCase().includes(q) ?? false);
          if (!matches) return false;
        }
        if (filter === "all") return true;
        const state = getDeviceState(d, locations.get(d.imei));
        return state === filter;
      })
      .sort((a, b) => {
        const aState = getDeviceState(a, locations.get(a.imei));
        const bState = getDeviceState(b, locations.get(b.imei));
        const stateOrder: Record<DeviceState, number> = { moving: 0, idle: 1, stopped: 2, offline: 3 };
        if (aState !== bState) return stateOrder[aState] - stateOrder[bState];

        const aSpeed = locations.get(a.imei)?.speed ?? 0;
        const bSpeed = locations.get(b.imei)?.speed ?? 0;
        if (aSpeed !== bSpeed) return bSpeed - aSpeed;

        const at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bt - at;
      });
  }, [devices, locations, query, filter]);

  // Mobile collapsed view - just a toggle button
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="absolute left-2 top-2 z-30 lg:hidden flex items-center gap-2 bg-ink-900/90 backdrop-blur border border-ink-400/20 rounded-lg px-3 py-2 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span className="text-sm font-medium">{counts.all} Devices</span>
        <span className="flex items-center gap-1 text-xs">
          <span className="w-2 h-2 rounded-full bg-alarm-green" />
          {counts.moving}
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="lg:hidden fixed inset-0 z-20 bg-ink-950/60"
        onClick={() => setCollapsed(true)}
      />

      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-30
        flex h-full w-[85vw] sm:w-80 shrink-0 flex-col
        border-r border-ink-400/15 bg-ink-900
        lg:translate-x-0
      `}>
        {/* Header with collapse button */}
        <div className="flex items-center justify-between border-b border-ink-400/15 px-3 py-2 lg:hidden">
          <span className="font-semibold text-sm">{t("nav.devices")}</span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-ink-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex border-b border-ink-400/15 text-xs overflow-x-auto">
          {(["all", "moving", "stopped", "idle", "offline"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 min-w-[60px] py-2 px-1 transition-colors whitespace-nowrap ${
                filter === f
                  ? "bg-brand-500/20 text-brand-500 border-b-2 border-brand-500"
                  : "text-ink-400 hover:text-ink-100 hover:bg-ink-800/50"
              }`}
            >
              <span className="capitalize">{f}</span>
              <span className={`ml-1 ${filter === f ? "text-brand-500" : "text-ink-500"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-2 border-b border-ink-400/15">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              className="input pl-8 py-1.5 text-sm"
              placeholder={t("fleet.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Device list */}
        <ul className="flex-1 overflow-y-auto">
          {sorted.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-ink-400">{t("fleet.noDevices")}</li>
          )}
          {sorted.map((d) => {
            const live = locations.get(d.imei);
            const state = getDeviceState(d, live);
            const selected = d.imei === selectedImei;
            const speed = live?.speed ?? 0;

            return (
              <li key={d.imei}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(selected ? null : d.imei);
                    // Collapse on mobile when selecting
                    if (window.innerWidth < 1024) {
                      setCollapsed(true);
                    }
                  }}
                  className={`flex w-full items-center gap-2 border-b border-ink-400/10 px-2 py-2 text-left transition ${
                    selected ? "bg-brand-500/15 border-l-2 border-l-brand-500" : "hover:bg-ink-800/50"
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-ink-400/30 bg-ink-800 text-brand-500 focus:ring-brand-500/50"
                  />

                  {/* Vehicle icon */}
                  <div className={`w-8 h-6 flex items-center justify-center rounded ${
                    state === "moving" ? "bg-alarm-green/20 text-alarm-green" :
                    state === "idle" ? "bg-brand-500/20 text-brand-500" :
                    state === "stopped" ? "bg-alarm-red/20 text-alarm-red" :
                    "bg-ink-700/50 text-ink-400"
                  }`}>
                    <svg className="w-5 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                  </div>

                  {/* Device info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className={`truncate text-sm font-medium ${
                        state === "moving" ? "text-alarm-green" :
                        state === "offline" ? "text-ink-400" :
                        "text-ink-50"
                      }`}>
                        {d.name || d.vehiclePlate || d.imei.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className={`capitalize ${
                        state === "moving" ? "text-alarm-green" :
                        state === "idle" ? "text-brand-500" :
                        state === "stopped" ? "text-alarm-red" :
                        "text-ink-400"
                      }`}>
                        {state === "moving" ? `Moving ${formatDuration(live?.ts)}` :
                         state === "stopped" ? `Stopped ${formatDuration(live?.ts)}` :
                         state === "idle" ? `Idle ${formatDuration(live?.ts)}` :
                         `Offline ${formatDuration(d.lastSeenAt)}`}
                      </span>
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="text-right">
                    <div className={`font-mono text-sm font-semibold ${
                      speed > 60 ? "text-alarm-red" :
                      speed > 30 ? "text-brand-500" :
                      speed > 0 ? "text-alarm-green" :
                      "text-ink-400"
                    }`}>
                      {speed} kph
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex flex-col gap-0.5 items-center">
                    <svg className={`w-4 h-4 ${live?.valid ? "text-alarm-green" : "text-ink-500"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                    </svg>
                    <svg className={`w-4 h-4 ${d.status === "ONLINE" ? "text-alarm-green" : "text-ink-500"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                    </svg>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
