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

export function DeviceList({ devices, locations, selectedImei, onSelect }: DeviceListProps) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices
      .filter((d) => {
        if (!q) return true;
        return (
          d.imei.includes(q) ||
          (d.name?.toLowerCase().includes(q) ?? false) ||
          (d.vehiclePlate?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        // ONLINE first, then by last-seen desc
        if (a.status !== b.status) {
          if (a.status === "ONLINE") return -1;
          if (b.status === "ONLINE") return 1;
        }
        const at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return bt - at;
      });
  }, [devices, query]);

  const onlineCount = devices.filter((d) => d.status === "ONLINE").length;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-ink-400/15 bg-ink-900/40">
      <div className="border-b border-ink-400/15 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-sm font-semibold">{t("nav.devices")}</span>
          <span className="text-xs text-ink-400">
            <span className="text-alarm-green">{onlineCount}</span> / {devices.length}
          </span>
        </div>
        <input
          type="search"
          className="input"
          placeholder={t("fleet.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-ink-400">{t("fleet.noDevices")}</li>
        )}
        {sorted.map((d) => {
          const live = locations.get(d.imei);
          const ts = live?.ts ?? d.lastSeenAt;
          const selected = d.imei === selectedImei;
          return (
            <li key={d.imei}>
              <button
                type="button"
                onClick={() => onSelect(selected ? null : d.imei)}
                className={`flex w-full items-center gap-3 border-b border-ink-400/10 px-3 py-2 text-left transition ${
                  selected ? "bg-brand-500/10" : "hover:bg-ink-900/60"
                }`}
              >
                <span
                  className={
                    d.status === "ONLINE" ? "status-dot-online" : "status-dot-offline"
                  }
                  title={d.status}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink-50">
                    {d.name || d.vehiclePlate || (
                      <span className="font-mono text-xs">{d.imei}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-ink-400">
                    <span className="font-mono">{d.imei}</span>
                    <span>·</span>
                    <span>{formatRelative(ts, locale)}</span>
                  </div>
                </div>
                {live && (
                  <span className="font-mono text-[11px] text-ink-100">
                    {live.speed} {t("fleet.kmh")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
