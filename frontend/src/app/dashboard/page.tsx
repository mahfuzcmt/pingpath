"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useDevices } from "@/hooks/useDevices";
import { useLiveLocations } from "@/hooks/useLiveLocations";
import { useSession } from "@/lib/session-context";
import { useLocale } from "@/lib/i18n";
import { DeviceList } from "@/components/device/DeviceList";
import { DeviceDetailPanel } from "@/components/device/DeviceDetailPanel";

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

  const selectedDevice = selectedImei
    ? devices.find((d) => d.imei === selectedImei) ?? null
    : null;

  return (
    <div className="flex h-full w-full">
      <DeviceList
        devices={devices}
        locations={locations}
        selectedImei={selectedImei}
        onSelect={setSelectedImei}
      />

      <div className="relative flex-1 min-w-0">
        <FleetMap
          devices={devices}
          locations={locations}
          selectedImei={selectedImei}
          onSelect={setSelectedImei}
        />

        {selectedDevice && (
          <DeviceDetailPanel
            device={selectedDevice}
            location={locations.get(selectedDevice.imei)}
            onClose={() => setSelectedImei(null)}
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
