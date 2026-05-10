"use client";

import { useState } from "react";
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
  const { locations, error } = useLiveLocations(orgId);
  const [selectedImei, setSelectedImei] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const selectedDevice = selectedImei
    ? devices.find((d) => d.imei === selectedImei) ?? null
    : null;

  // Live online/offline counts override the polled KPI values so the strip
  // feels reactive — counts shift the moment a device goes online via WS.
  const liveOnlineCount = devices.filter((d) => d.status === "ONLINE").length;
  const liveOfflineCount = devices.filter((d) => d.status === "OFFLINE").length;

  return (
    <div className="flex h-full w-full">
      <DeviceList
        devices={devices}
        locations={locations}
        selectedImei={selectedImei}
        onSelect={setSelectedImei}
      />

      <div className="relative flex-1 min-w-0 h-full">
        <FleetMap
          devices={devices}
          locations={locations}
          selectedImei={selectedImei}
          onSelect={setSelectedImei}
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
          <div className="absolute left-4 top-4 z-20 rounded-md border border-alarm-red/40 bg-alarm-red/10 px-3 py-1 text-xs text-alarm-red">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
