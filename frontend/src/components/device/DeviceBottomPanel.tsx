"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { formatVoltage } from "@/lib/format";
import type { DeviceView, LocationView } from "@/types/domain";

interface Props {
  device: DeviceView;
  location: LocationView | undefined;
  onClose: () => void;
  onViewHistory: () => void;
}

type TabId = "data" | "graph" | "messages";

function formatDateTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const date = new Date(ts);
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).replace(",", "");
}

function formatOdometer(meters: number | undefined | null): string {
  if (meters == null) return "—";
  return `${(meters / 1000).toFixed(0)} km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} h ${m} min`;
}

export function DeviceBottomPanel({ device, location, onClose, onViewHistory }: Props) {
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<TabId>("data");

  const isMoving = location && location.speed > 2;
  const isOnline = device.status === "ONLINE";
  const status = !isOnline ? "Offline" : isMoving ? "Moving" : location?.accOn ? "Idle" : "Stopped";

  const tabs: { id: TabId; label: string }[] = [
    { id: "data", label: "Data" },
    { id: "graph", label: "Graph" },
    { id: "messages", label: "Messages" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-surface-300 bg-white shadow-lg">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-surface-300 bg-surface-100">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-brand-500 bg-white text-ink-900"
                  : "text-ink-500 hover:bg-white hover:text-ink-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-2">
          <button
            type="button"
            onClick={onViewHistory}
            className="btn-secondary text-xs"
          >
            View History
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon text-ink-500 hover:text-ink-900"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "data" && (
        <div className="flex divide-x divide-surface-200">
          {/* Left data columns */}
          <div className="flex-1 grid grid-cols-2 gap-x-8 p-3">
            <DataRow icon="001" label="Odometer" value={formatOdometer(location?.mileageMeters)} />
            <DataRow icon="📱" label="SIM card num..." value={device.simMsisdn || "—"} mono />
            <DataRow icon="📶" label="Status" value={status} valueColor={isMoving ? "text-status-moving" : !isOnline ? "text-ink-400" : "text-status-stopped"} />
            <DataRow icon="⛰" label="Altitude" value={location?.altitude != null ? `${location.altitude} m` : "0 m"} />
            <DataRow icon="🧭" label="Angle" value={location?.course != null ? `${location.course} °` : "— °"} />
            <DataRow icon="📍" label="Position" value={location ? `${location.latitude.toFixed(6)} °, ${location.longitude.toFixed(6)} °` : "—"} link />
            <DataRow icon="🚗" label="Speed" value={`${location?.speed ?? 0} kph`} />
          </div>

          {/* Middle data columns */}
          <div className="flex-1 grid grid-cols-2 gap-x-8 p-3">
            <DataRow icon="🕐" label="Time (position)" value={formatDateTime(location?.ts)} />
            <DataRow icon="🕐" label="Time (server)" value={formatDateTime(location?.ts)} />
            <DataRow icon="🔋" label="Battery Level" value={location?.voltageMv ? `${Math.min(100, Math.max(0, Math.round((location.voltageMv - 10000) / 50)))} %` : "— %"} />
            <DataRow icon="🔑" label="Engine ACC" value={location?.accOn == null ? "—" : location.accOn ? "ON" : "OFF"} valueColor={location?.accOn ? "text-status-moving" : "text-ink-500"} />
            <DataRow icon="⚡" label="External Power" value={location?.voltageMv ? "ON" : "—"} valueColor={location?.voltageMv ? "text-status-moving" : "text-ink-500"} />
          </div>

          {/* Object control */}
          <div className="w-48 p-3 border-r border-surface-200">
            <div className="text-xs font-semibold text-ink-700 mb-2">Object control</div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-ink-500">Template</label>
                <select className="select w-full mt-0.5">
                  <option>Custom</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-ink-500">Command</label>
                <div className="flex gap-1 mt-0.5">
                  <input type="text" className="input flex-1" placeholder="" />
                  <button type="button" className="btn-icon border border-surface-300">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Daily statistics */}
          <div className="w-56 p-3">
            <div className="text-xs font-semibold text-ink-700 mb-2">Daily statistics</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-ink-500">Route length</span>
              <span className="text-ink-900 font-medium text-right">316.84 km</span>
              <span className="text-ink-500">Move duration</span>
              <span className="text-ink-900 font-medium text-right">7 h 27 min</span>
              <span className="text-ink-500">Stop duration</span>
              <span className="text-ink-900 font-medium text-right">4 h 57 min</span>
              <span className="text-ink-500">Top speed</span>
              <span className="text-ink-900 font-medium text-right">114 kph</span>
              <span className="text-ink-500">Average speed</span>
              <span className="text-ink-900 font-medium text-right">42 kph</span>
              <span className="text-ink-500">Fuel consumption</span>
              <span className="text-ink-900 font-medium text-right">— liters</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "graph" && (
        <div className="p-4 text-center text-ink-500 text-sm">
          Speed and sensor graphs will appear here
        </div>
      )}

      {activeTab === "messages" && (
        <div className="p-4 text-center text-ink-500 text-sm">
          Device messages and commands log will appear here
        </div>
      )}
    </div>
  );
}

interface DataRowProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
  link?: boolean;
}

function DataRow({ icon, label, value, valueColor = "text-ink-900", mono, link }: DataRowProps) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] w-5 text-center">{icon}</span>
      <span className="text-[11px] text-ink-500 w-24 truncate">{label}</span>
      <span className={`text-[11px] font-medium ${valueColor} ${mono ? "font-mono" : ""} ${link ? "text-brand-500 underline cursor-pointer" : ""}`}>
        {value}
      </span>
    </div>
  );
}
