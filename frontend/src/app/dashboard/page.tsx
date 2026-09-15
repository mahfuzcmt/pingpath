"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDevices } from "@/hooks/useDevices";
import { useLiveLocations } from "@/hooks/useLiveLocations";
import { useSession } from "@/lib/session-context";
import { useLocale } from "@/lib/i18n";
import { DeviceList } from "@/components/device/DeviceList";
import { DeviceBottomPanel } from "@/components/device/DeviceBottomPanel";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
// Inline SVG icons for collapse/expand (no external dependencies)

// Dynamic import for route history to avoid SSR issues
const RouteHistoryPanel = dynamic(
  () => import("@/components/device/RouteHistoryPanel").then((m) => m.RouteHistoryPanel),
  { ssr: false }
);

// Dynamic import for live tracking panel
const LiveTrackingPanel = dynamic(
  () => import("@/components/map/LiveTrackingPanel").then((m) => m.LiveTrackingPanel),
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
  const { locations, error, refresh, lastRefreshAt, advanceAnimations } = useLiveLocations(orgId);
  const [selectedImei, setSelectedImei] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);

  // Deep-link from the Vehicles screen: /dashboard?focus={imei} preselects it.
  useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus) setSelectedImei(focus);
  }, []);

  // Listen for live tracking open events from the popup button
  const handleOpenLiveTracking = useCallback((e: Event) => {
    const imei = (e as CustomEvent).detail;
    if (imei) {
      setSelectedImei(imei);
      setShowLiveTracking(true);
      setShowHistory(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("openLiveTracking", handleOpenLiveTracking);
    return () => {
      window.removeEventListener("openLiveTracking", handleOpenLiveTracking);
    };
  }, [handleOpenLiveTracking]);

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
      <aside
        className={`hidden h-full shrink-0 md:block transition-all duration-300 ease-in-out ${
          listCollapsed ? "w-0" : "w-[320px]"
        }`}
      >
        {!listCollapsed && (
          <DeviceList
            devices={devices}
            locations={locations}
            selectedImei={selectedImei}
            onSelect={setSelectedImei}
            onViewHistory={() => setShowHistory(true)}
          />
        )}
      </aside>

      {/* Collapse/Expand toggle button */}
      <button
        onClick={() => setListCollapsed(!listCollapsed)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 h-12 w-6 items-center justify-center rounded-r-lg bg-ink-900/90 hover:bg-ink-800 text-ink-100 shadow-lg border border-l-0 border-ink-700/50 transition-all duration-300"
        style={{ left: listCollapsed ? 0 : 320 }}
        title={listCollapsed ? "Expand vehicle list" : "Collapse vehicle list"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {listCollapsed ? (
            <polyline points="9 18 15 12 9 6" />
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </button>

      <div className="relative flex-1 min-w-0 h-full">
        <FleetMap
          devices={devices}
          locations={locations}
          selectedImei={selectedImei}
          onSelect={setSelectedImei}
          onRefresh={refresh}
          lastRefreshAt={lastRefreshAt}
          onAdvanceAnimations={advanceAnimations}
        />

        {/* Live KPIs — floating overlay, collapsible */}
        <KpiStrip liveOnlineCount={liveOnlineCount} liveOfflineCount={liveOfflineCount} />

        {/* Bottom details panel */}
        {selectedDevice && !showHistory && !showLiveTracking && (
          <DeviceBottomPanel
            device={selectedDevice}
            location={locations.get(selectedDevice.imei)}
            onClose={() => setSelectedImei(null)}
            onViewHistory={() => setShowHistory(true)}
            onViewLiveTracking={() => setShowLiveTracking(true)}
          />
        )}

        {/* Route history overlay */}
        {selectedDevice && showHistory && (
          <RouteHistoryPanel
            device={selectedDevice}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* Live Tracking panel with speedometer */}
        {selectedDevice && showLiveTracking && (
          <LiveTrackingPanel
            device={selectedDevice}
            location={locations.get(selectedDevice.imei)}
            onClose={() => setShowLiveTracking(false)}
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
