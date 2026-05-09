"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "@/lib/i18n";
import { formatDateTime, formatNumber, formatVoltage } from "@/lib/format";
import type { DeviceView, LocationView } from "@/types/domain";

// Dynamic import to avoid SSR issues with mapbox
const RouteHistoryPanel = dynamic(
  () => import("./RouteHistoryPanel").then((m) => m.RouteHistoryPanel),
  { ssr: false }
);

interface Props {
  device: DeviceView;
  location: LocationView | undefined;
  onClose: () => void;
}

export function DeviceDetailPanel({ device, location, onClose }: Props) {
  const { t, locale } = useLocale();
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return <RouteHistoryPanel device={device} onClose={() => setShowHistory(false)} />;
  }

  return (
    <section className="absolute right-0 top-0 z-10 h-full w-96 border-l border-ink-400/15 bg-ink-900/85 backdrop-blur-md">
      <header className="flex items-start justify-between border-b border-ink-400/15 p-4">
        <div className="min-w-0">
          <div className="truncate font-display text-base font-semibold">
            {device.name || device.vehiclePlate || device.imei}
          </div>
          <div className="font-mono text-[11px] text-ink-400">{device.imei}</div>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost px-2 py-1 text-xs">
          {t("common.close")}
        </button>
      </header>

      <dl className="space-y-3 p-4 text-sm">
        <Row label="Status">
          <span className={device.status === "ONLINE" ? "text-alarm-green" : "text-ink-400"}>
            {device.status === "ONLINE"
              ? t("fleet.online")
              : device.status === "OFFLINE"
                ? t("fleet.offline")
                : t("fleet.neverConnected")}
          </span>
        </Row>
        <Row label={t("fleet.lastSeen")}>
          <span>
            {device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : "—"}
          </span>
        </Row>
        {location && (
          <>
            <Row label="Position">
              <span className="font-mono text-xs">
                {formatNumber(location.latitude, "en", { maximumFractionDigits: 5 })},{" "}
                {formatNumber(location.longitude, "en", { maximumFractionDigits: 5 })}
              </span>
            </Row>
            <Row label={t("fleet.speed")}>
              <span>
                {formatNumber(location.speed, locale)} {t("fleet.kmh")}
              </span>
            </Row>
            <Row label={t("fleet.course")}>
              <span>{formatNumber(location.course, locale)}°</span>
            </Row>
            <Row label={t("fleet.acc")}>
              <span>
                {location.accOn == null
                  ? "—"
                  : location.accOn
                    ? t("fleet.accOn")
                    : t("fleet.accOff")}
              </span>
            </Row>
            {location.voltageMv != null && (
              <Row label={t("fleet.voltage")}>
                <span>{formatVoltage(location.voltageMv, locale)}</span>
              </Row>
            )}
            {location.satellites != null && (
              <Row label="Satellites">
                <span>{formatNumber(location.satellites, locale)}</span>
              </Row>
            )}
          </>
        )}
        {device.vehiclePlate && (
          <Row label="Plate">
            <span className="font-mono">{device.vehiclePlate}</span>
          </Row>
        )}
        {device.protocol && (
          <Row label="Protocol">
            <span className="font-mono text-xs">
              {device.protocol}
              {device.protocolVariant ? ` ${device.protocolVariant}` : ""}
            </span>
          </Row>
        )}
      </dl>

      {/* Action buttons */}
      <div className="border-t border-ink-400/15 p-4 space-y-2">
        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="btn-primary w-full py-2 text-sm"
        >
          {t("fleet.viewHistory")}
        </button>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[11px] uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-right text-ink-50">{children}</dd>
    </div>
  );
}
