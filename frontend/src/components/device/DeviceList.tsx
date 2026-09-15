"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, type StringKey } from "@/lib/i18n";
import { filterSpeed, formatSince, formatStopDuration, vehicleState, VEHICLE_STATE_COLOR, type VehicleState } from "@/lib/format";
import { buildVehicleSvg } from "@/lib/vehicleIcons";
import { useSpeedLimits } from "@/hooks/useSpeedLimits";
import { useTicker } from "@/hooks/useTicker";
import type { DeviceView, LocationView } from "@/types/domain";
import type { LiveLocationView } from "@/hooks/useLiveLocations";

const OVERSPEED_COLOR = "#DC2626";

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
          e.preventDefault();
          setOpen(!open);
        }}
        className="flex h-6 w-6 items-center justify-center rounded text-[#7E8792] transition hover:bg-[#f0f0f0] hover:text-[#3D4353]"
        title="More actions"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-1 min-w-[140px] rounded border border-[#dddddd] bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#3D4353] transition hover:bg-[#f5f5f5]"
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
              e.preventDefault();
              setOpen(false);
              onViewHistory();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#3D4353] transition hover:bg-[#f5f5f5]"
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

type ChipId = VehicleState | "all";

const STATE_LABEL: Record<VehicleState, StringKey> = {
  moving: "veh.moving",
  idle: "veh.idle",
  stopped: "veh.stopped",
  offline: "veh.offline",
  expired: "veh.expired",
  nodata: "veh.nodata",
};

// Small vehicle icon for list (ADL style - small colored icon)
function SmallVehicleIcon({ type, color }: { type?: string | null; color: string }) {
  const svg = buildVehicleSvg(type, color, 0, 20);
  return <span dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'inline-flex' }} />;
}

interface DeviceListProps {
  devices: DeviceView[];
  locations: Map<string, LocationView | LiveLocationView>;
  selectedImei: string | null;
  onSelect: (imei: string | null) => void;
  onViewHistory?: (imei: string) => void;
}

export function DeviceList({ devices, locations, selectedImei, onSelect, onViewHistory }: DeviceListProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ChipId>("all");
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const speedLimits = useSpeedLimits();
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

  // Online count (moving + idle + stopped)
  const onlineCount = counts.moving + counts.idle + counts.stopped;
  const offlineCount = counts.offline + counts.expired + counts.nodata;

  const toggleSelectAll = () => {
    if (selectedDevices.size === sorted.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(sorted.map(d => d.imei)));
    }
  };

  const toggleDevice = (imei: string) => {
    const next = new Set(selectedDevices);
    if (next.has(imei)) {
      next.delete(imei);
    } else {
      next.add(imei);
    }
    setSelectedDevices(next);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white border-r border-[#dddddd]">
      {/* Search */}
      <div className="border-b border-[#dddddd] px-2 py-2">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888888]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          <input
            type="search"
            className="w-full rounded border border-[#dddddd] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[#3D4353] placeholder:text-[#888888] focus:border-[#0421bc] focus:outline-none"
            placeholder="IMEI/Device Name/SIM CardNo."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Status filter tabs - ADL style */}
      <div className="flex items-center border-b border-[#dddddd] px-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-2 text-[13px] font-medium border-b-2 transition ${
            filter === "all"
              ? "border-[#0421bc] text-[#0421bc]"
              : "border-transparent text-[#7E8792] hover:text-[#3D4353]"
          }`}
        >
          All({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilter("moving")}
          className={`px-3 py-2 text-[13px] font-medium border-b-2 transition ${
            filter === "moving"
              ? "border-[#0421bc] text-[#0421bc]"
              : "border-transparent text-[#7E8792] hover:text-[#3D4353]"
          }`}
        >
          Online({onlineCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("offline")}
          className={`px-3 py-2 text-[13px] font-medium border-b-2 transition ${
            filter === "offline"
              ? "border-[#0421bc] text-[#0421bc]"
              : "border-transparent text-[#7E8792] hover:text-[#3D4353]"
          }`}
        >
          Offline({offlineCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("stopped")}
          className={`px-3 py-2 text-[13px] font-medium border-b-2 transition ${
            filter === "stopped"
              ? "border-[#0421bc] text-[#0421bc]"
              : "border-transparent text-[#7E8792] hover:text-[#3D4353]"
          }`}
        >
          Inactive({counts.stopped})
        </button>
      </div>

      {/* Speed filter + Select all */}
      <div className="flex items-center justify-between border-b border-[#dddddd] px-3 py-2 bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <select className="rounded border border-[#dddddd] bg-white px-2 py-1 text-[12px] text-[#3D4353] focus:border-[#0421bc] focus:outline-none">
            <option value="">Speed</option>
            <option value="0">0 km/h</option>
            <option value="10">{">"} 10 km/h</option>
            <option value="50">{">"} 50 km/h</option>
            <option value="80">{">"} 80 km/h</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedDevices.size === sorted.length && sorted.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-[#dddddd] text-[#0421bc] focus:ring-[#0421bc] cursor-pointer"
          />
          <span className="text-[12px] text-[#7E8792]">Select All</span>
        </label>
      </div>

      {/* Vehicle list */}
      <ul className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-[#7E8792]">{t("fleet.noDevices")}</li>
        )}
        {sorted.map((d) => {
          const live = locations.get(d.imei);
          const selected = d.imei === selectedImei;
          const checked = selectedDevices.has(d.imei);
          const state = vehicleState(d, live);
          const overspeed = speedLimits.isOverspeed(d.imei, live?.speed ?? d.lastSpeed);
          const statusColor = overspeed ? OVERSPEED_COLOR : VEHICLE_STATE_COLOR[state];
          const speed = live?.speed ?? d.lastSpeed ?? 0;
          const isOnline = state === "moving" || state === "idle" || state === "stopped";

          return (
            <li
              key={d.imei}
              className={`border-b border-[#eeeeee] transition cursor-pointer ${
                selected
                  ? "bg-[#e8ebff]"
                  : "bg-white hover:bg-[#f5f5f5]"
              }`}
              onClick={() => onSelect(selected ? null : d.imei)}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleDevice(d.imei);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-[#dddddd] text-[#0421bc] focus:ring-[#0421bc] cursor-pointer shrink-0"
                />

                {/* Vehicle name (blue link style) */}
                <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[#0066cc] hover:underline">
                  {d.name || d.vehiclePlate || d.imei.slice(-8)}
                </span>

                {/* Speed */}
                <span
                  className={`text-[12px] font-medium shrink-0 ${overspeed ? "text-red-600" : "text-[#3D4353]"}`}
                >
                  {speed > 0 ? `${speed}km/h` : "0km/h"}
                </span>

                {/* Small vehicle icon */}
                <div className="shrink-0">
                  <SmallVehicleIcon type={d.vehicleType} color={statusColor} />
                </div>

                {/* Status dot */}
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: isOnline ? "#52c41a" : "#8c8c8c" }}
                  title={isOnline ? "Online" : "Offline"}
                />

                {/* Actions */}
                <DeviceActionsMenu
                  imei={d.imei}
                  onEdit={() => router.push(`/dashboard/devices/${d.imei}`)}
                  onViewHistory={() => {
                    onSelect(d.imei);
                    if (onViewHistory) onViewHistory(d.imei);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
