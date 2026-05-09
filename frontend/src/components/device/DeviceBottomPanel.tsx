"use client";

import { useLocale } from "@/lib/i18n";
import { formatDateTime, formatNumber, formatVoltage } from "@/lib/format";
import type { DeviceView, LocationView } from "@/types/domain";

interface Props {
  device: DeviceView;
  location: LocationView | undefined;
  onClose: () => void;
  onViewHistory: () => void;
}

type DeviceState = "moving" | "stopped" | "idle" | "offline";

function getDeviceState(device: DeviceView, location?: LocationView): DeviceState {
  if (device.status !== "ONLINE") return "offline";
  if (!location) return "idle";
  if (location.speed > 2) return "moving";
  if (location.accOn) return "idle";
  return "stopped";
}

function formatOdometer(meters: number | undefined | null): string {
  if (meters == null) return "—";
  const km = meters / 1000;
  if (km >= 1000) {
    return `${(km / 1000).toFixed(1)}k km`;
  }
  return `${km.toFixed(1)} km`;
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
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function DeviceBottomPanel({ device, location, onClose, onViewHistory }: Props) {
  const { t, locale } = useLocale();
  const state = getDeviceState(device, location);
  const speed = location?.speed ?? 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-ink-400/20 bg-ink-900/95 backdrop-blur-md">
      {/* Header row with name and status */}
      <div className="flex items-center justify-between border-b border-ink-400/10 px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Vehicle icon */}
          <div className={`w-10 h-8 flex items-center justify-center rounded ${
            state === "moving" ? "bg-alarm-green/20 text-alarm-green" :
            state === "idle" ? "bg-brand-500/20 text-brand-500" :
            state === "stopped" ? "bg-alarm-red/20 text-alarm-red" :
            "bg-ink-700/50 text-ink-400"
          }`}>
            <svg className="w-6 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-ink-50">
                {device.name || device.vehiclePlate || device.imei.slice(-8)}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                state === "moving" ? "bg-alarm-green/20 text-alarm-green" :
                state === "idle" ? "bg-brand-500/20 text-brand-500" :
                state === "stopped" ? "bg-alarm-red/20 text-alarm-red" :
                "bg-ink-700/50 text-ink-400"
              }`}>
                {state === "moving" ? "Moving" :
                 state === "idle" ? "Idle" :
                 state === "stopped" ? "Stopped" :
                 "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-400">
              <span className="font-mono">{device.imei}</span>
              {device.vehiclePlate && (
                <>
                  <span>•</span>
                  <span>{device.vehiclePlate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewHistory}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            {t("fleet.viewHistory")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-2 py-1.5 text-xs text-ink-400 hover:text-ink-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-stretch divide-x divide-ink-400/10">
        {/* Speed */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          label="Speed"
          value={`${speed}`}
          unit="kph"
          color={speed > 60 ? "text-alarm-red" : speed > 30 ? "text-brand-500" : speed > 0 ? "text-alarm-green" : "text-ink-400"}
        />

        {/* Odometer */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label="Odometer"
          value={formatOdometer(location?.mileageMeters)}
          color="text-ink-50"
        />

        {/* Battery/Voltage */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          label="Battery"
          value={location?.voltageMv ? formatVoltage(location.voltageMv, locale) : "—"}
          color={location?.voltageMv && location.voltageMv < 11000 ? "text-alarm-red" : "text-alarm-green"}
        />

        {/* Position */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="Position"
          value={location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "—"}
          color="text-ink-50"
          mono
        />

        {/* ACC Status */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
          label="Ignition"
          value={location?.accOn == null ? "—" : location.accOn ? "ON" : "OFF"}
          color={location?.accOn ? "text-alarm-green" : "text-ink-400"}
        />

        {/* GPS Signal */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          }
          label="GPS"
          value={location?.valid ? "Valid" : "No Fix"}
          subValue={location?.satellites != null ? `${location.satellites} sats` : undefined}
          color={location?.valid ? "text-alarm-green" : "text-alarm-red"}
        />

        {/* Last Update */}
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Last Update"
          value={location?.ts ? formatDuration(location.ts) + " ago" : device.lastSeenAt ? formatDuration(device.lastSeenAt) + " ago" : "—"}
          color="text-ink-50"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
  color?: string;
  mono?: boolean;
}

function StatCard({ icon, label, value, unit, subValue, color = "text-ink-50", mono }: StatCardProps) {
  return (
    <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
      <div className="text-ink-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-ink-400 mb-0.5">{label}</div>
        <div className={`flex items-baseline gap-1 ${mono ? "font-mono" : ""}`}>
          <span className={`text-sm font-semibold truncate ${color}`}>{value}</span>
          {unit && <span className="text-[10px] text-ink-400">{unit}</span>}
        </div>
        {subValue && <div className="text-[10px] text-ink-400">{subValue}</div>}
      </div>
    </div>
  );
}
