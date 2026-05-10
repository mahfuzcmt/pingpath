"use client";

import { useLocale } from "@/lib/i18n";
import { formatDateTime, formatEngineHours, formatGsmSignal, formatNumber, formatVoltage } from "@/lib/format";
import type { DeviceView, LocationView } from "@/types/domain";

interface Props {
  device: DeviceView;
  location: LocationView | undefined;
  onClose: () => void;
}

export function DeviceDetailPanel({ device, location, onClose }: Props) {
  const { t, locale } = useLocale();
  const online = device.status === "ONLINE";

  return (
    <section className="absolute right-0 top-0 z-10 h-full w-[360px] border-l border-surface-300 bg-white shadow-menu">
      <header className="panel-header">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-ink-900">
            {device.name || device.vehiclePlate || device.imei}
          </div>
          <div className="font-mono text-[10px] text-ink-500">{device.imei}</div>
        </div>
        <button type="button" onClick={onClose} className="btn-icon" aria-label={t("common.close")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <dl className="overflow-y-auto" style={{ maxHeight: "calc(100% - 30px)" }}>
        <div className="data-row">
          <dt>Status</dt>
          <dd>
            <span className={online ? "status-pill status-pill-moving" : "status-pill status-pill-offline"}>
              {online
                ? t("fleet.online")
                : device.status === "OFFLINE"
                  ? t("fleet.offline")
                  : t("fleet.neverConnected")}
            </span>
          </dd>
        </div>
        <div className="data-row">
          <dt>{t("fleet.lastSeen")}</dt>
          <dd>{device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : "—"}</dd>
        </div>
        {location && (
          <>
            <div className="data-row">
              <dt>Position</dt>
              <dd className="font-mono text-[11px]">
                {formatNumber(location.latitude, "en", { maximumFractionDigits: 5 })},{" "}
                {formatNumber(location.longitude, "en", { maximumFractionDigits: 5 })}
              </dd>
            </div>
            <div className="data-row">
              <dt>{t("fleet.speed")}</dt>
              <dd>
                <span className="font-semibold">{formatNumber(location.speed, locale)}</span>{" "}
                <span className="text-ink-500">{t("fleet.kmh")}</span>
              </dd>
            </div>
            <div className="data-row">
              <dt>{t("fleet.course")}</dt>
              <dd>{formatNumber(location.course, locale)}°</dd>
            </div>
            <div className="data-row">
              <dt>{t("fleet.acc")}</dt>
              <dd>
                {location.accOn == null
                  ? "—"
                  : location.accOn
                    ? t("fleet.accOn")
                    : t("fleet.accOff")}
              </dd>
            </div>
            {location.voltageMv != null && (
              <div className="data-row">
                <dt>{t("fleet.voltage")}</dt>
                <dd>{formatVoltage(location.voltageMv, locale)}</dd>
              </div>
            )}
            {location.satellites != null && (
              <div className="data-row">
                <dt>Satellites</dt>
                <dd>{formatNumber(location.satellites, locale)}</dd>
              </div>
            )}
            {!location.valid && (
              <div className="data-row">
                <dt>{t("fleet.cellFallback")}</dt>
                <dd className="text-brand-700">●</dd>
              </div>
            )}
          </>
        )}
        {(location?.gsmSignal ?? device.lastGsmSignal) != null && (
          <div className="data-row">
            <dt>{t("fleet.gsm")}</dt>
            <dd>{formatGsmSignal(location?.gsmSignal ?? device.lastGsmSignal, locale)}</dd>
          </div>
        )}
        {(location?.engineHoursSeconds ?? device.lastEngineHoursSeconds) != null && (
          <div className="data-row">
            <dt>{t("fleet.engineHours")}</dt>
            <dd>{formatEngineHours(location?.engineHoursSeconds ?? device.lastEngineHoursSeconds, locale)}</dd>
          </div>
        )}
        {device.simMsisdn && (
          <div className="data-row">
            <dt>{t("fleet.sim")}</dt>
            <dd className="font-mono text-[11px]">{device.simMsisdn}</dd>
          </div>
        )}
        {device.vehiclePlate && (
          <div className="data-row">
            <dt>Plate</dt>
            <dd className="font-mono">{device.vehiclePlate}</dd>
          </div>
        )}
        {device.protocol && (
          <div className="data-row">
            <dt>Protocol</dt>
            <dd className="font-mono text-[11px]">
              {device.protocol}
              {device.protocolVariant ? ` ${device.protocolVariant}` : ""}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
