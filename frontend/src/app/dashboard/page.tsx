"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDevices } from "@/hooks/useDevices";
import { useLiveLocations } from "@/hooks/useLiveLocations";
import { useSession } from "@/lib/session-context";
import { useLocale } from "@/lib/i18n";
import { DeviceList } from "@/components/device/DeviceList";
import { DeviceBottomPanel } from "@/components/device/DeviceBottomPanel";
import { KpiStrip } from "@/components/dashboard/KpiStrip";

// Dynamic import for route history to avoid SSR issues
const RouteHistoryPanel = dynamic(
  () => import("@/components/device/RouteHistoryPanel").then((m) => m.RouteHistoryPanel),
  { ssr: false }
);

// mapbox-gl pulls window/document at import time → client-only.
const FleetMap = dynamic(
  () => import("@/components/map/FleetMap").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-ink-950" /> },
);

export default function DashboardPage() {
  const { orgId } = useSession();
  const { t } = useLocale();
  const { devices, loading } = useDevices();
  const { locations, error, refresh } = useLiveLocations(orgId);
  const [selectedImei, setSelectedImei] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [listOpen, setListOpen] = useState(false); // mobile vehicle-list drawer

  // Deep-link from the Vehicles screen: /dashboard?focus={imei} preselects it.
  useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus) setSelectedImei(focus);
  }, []);

  const selectedDevice = selectedImei
    ? devices.find((d) => d.imei === selectedImei) ?? null
    : null;

  // Live online/offline counts override the polled KPI values so the strip
  // feels reactive — counts shift the moment a device goes online via WS.
  const liveOnlineCount = devices.filter((d) => d.status === "ONLINE").length;
  const liveOfflineCount = devices.filter((d) => d.status === "OFFLINE").length;

  return (
    <div className="relative flex h-full w-full">
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[320px] shrink-0 md:block">
        <DeviceList
          devices={devices}
          locations={locations}
          selectedImei={selectedImei}
          onSelect={setSelectedImei}
        />
      </aside>

      {/* Mobile: vehicle list as a slide-over drawer */}
      {listOpen && (
        <div className="absolute inset-0 z-[1200] flex md:hidden">
          <div className="h-full w-[85%] max-w-[320px] shadow-xl">
            <DeviceList
              devices={devices}
              locations={locations}
              selectedImei={selectedImei}
              onSelect={(imei) => {
                setSelectedImei(imei);
                setListOpen(false);
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Close vehicle list"
            className="flex-1 bg-ink-950/40"
            onClick={() => setListOpen(false)}
          />
        </div>
      )}

      <div className="relative flex-1 min-w-0 h-full">
        {/* Mobile: open the vehicle list */}
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-md border border-surface-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 shadow md:hidden"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {t("nav.vehicles")} ({devices.length})
        </button>

        <FleetMap
          devices={devices}
          locations={locations}
          selectedImei={selectedImei}
          onSelect={setSelectedImei}
          onRefresh={refresh}
        />

        {/* Live KPIs — floating overlay, collapsible */}
        <KpiStrip liveOnlineCount={liveOnlineCount} liveOfflineCount={liveOfflineCount} />

        {/* Bottom details panel */}
        {selectedDevice && !showHistory && (
          <DeviceBottomPanel
            device={selectedDevice}
            location={locations.get(selectedDevice.imei)}
            onClose={() => setSelectedImei(null)}
            onViewHistory={() => setShowHistory(true)}
          />
        )}

        {/* Route history overlay */}
        {selectedDevice && showHistory && (
          <RouteHistoryPanel
            device={selectedDevice}
            onClose={() => setShowHistory(false)}
          />
        )}

        {loading && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-ink-900/80 px-3 py-1 text-xs text-ink-100 shadow">
            {t("common.loading")}
          </div>
        )}
        {error && (
          <div className="absolute left-4 top-14 z-20 rounded-md border border-alarm-red/40 bg-alarm-red/10 px-3 py-1 text-xs text-alarm-red md:top-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
