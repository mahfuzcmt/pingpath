"use client";

import { useMemo } from "react";
import { useLiveLocations } from "@/hooks/useLiveLocations";
import { useTrips } from "@/hooks/useTrips";
import { useLocale } from "@/lib/i18n";
import {
  dhakaTodayStartIso,
  formatDate,
  formatDurationS,
  formatEngineHours,
  formatNumber,
  formatRelative,
  formatVoltage,
} from "@/lib/format";
import type { DeviceView } from "@/types/domain";

export default function StatisticsTab({ device, orgId }: { device: DeviceView; orgId: string }) {
  const { t, locale } = useLocale();
  const { locations } = useLiveLocations(orgId);
  const live = locations.get(device.imei);

  const range = useMemo(() => ({ from: dhakaTodayStartIso(), to: new Date().toISOString() }), []);
  const { trips } = useTrips({ imei: device.imei, fromIso: range.from, toIso: range.to });

  const stats = useMemo(() => {
    const distanceM = trips.reduce((s, tr) => s + tr.distanceM, 0);
    const durationS = trips.reduce((s, tr) => s + (tr.durationS ?? 0), 0);
    const idleS = trips.reduce((s, tr) => s + tr.idleTimeS, 0);
    const maxSpeed = trips.reduce((m, tr) => Math.max(m, tr.maxSpeed), 0);
    const avgSpeed = durationS > 0 ? Math.round(distanceM / 1000 / (durationS / 3600)) : 0;
    const elapsedS = Math.max(0, (Date.now() - new Date(range.from).getTime()) / 1000);
    return { distanceM, moveS: Math.max(0, durationS - idleS), idleS, stopS: Math.max(0, elapsedS - durationS), maxSpeed, avgSpeed, trips: trips.length };
  }, [trips, range.from]);

  const serverTime = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="h-full overflow-y-auto bg-surface-50 p-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <Section title={t("home.today")}>
          <M label={t("home.routeLength")} value={`${formatNumber(stats.distanceM / 1000, locale, { maximumFractionDigits: 1 })} ${t("kpi.km")}`} />
          <M label={t("home.trips")} value={formatNumber(stats.trips, locale)} />
          <M label={t("trips.maxSpeed")} value={`${stats.maxSpeed} ${t("fleet.kmh")}`} />
          <M label={t("trips.avgSpeed")} value={`${stats.avgSpeed} ${t("fleet.kmh")}`} />
          <M label={t("home.moveDuration")} value={formatDurationS(stats.moveS, locale)} />
          <M label={t("home.idleDuration")} value={formatDurationS(stats.idleS, locale)} />
          <M label={t("home.stopDuration")} value={formatDurationS(stats.stopS, locale)} />
        </Section>

        <Section title={t("fleet.title")}>
          <M label={t("fleet.speed")} value={`${live?.speed ?? device.lastSpeed ?? 0} ${t("fleet.kmh")}`} />
          <M label="Odometer" value={live?.mileageMeters != null ? `${formatNumber(live.mileageMeters / 1000, locale, { maximumFractionDigits: 0 })} ${t("kpi.km")}` : "—"} />
          <M label={t("fleet.engineHours")} value={formatEngineHours(device.lastEngineHoursSeconds, locale)} />
          <M label={t("fleet.lastSeen")} value={formatRelative(live?.ts ?? device.lastSeenAt, locale)} />
        </Section>

        <Section title="Health">
          <M label={t("fleet.voltage")} value={formatVoltage(live?.voltageMv ?? device.lastVoltageMv, locale)} />
          <M label={t("fleet.gsm")} value={device.lastGsmSignal != null ? String(device.lastGsmSignal) : "—"} />
          <M label="GPS sats" value={live?.satellites != null ? String(live.satellites) : "—"} />
          <M label={t("veh.locked")} value={device.engineLocked ? "Yes" : "No"} />
        </Section>

        <Section title="Subscription">
          <M label="Status" value={device.subscriptionStatus ?? "—"} />
          <M label={t("veh.expiresOn")} value={formatDate(device.subscriptionExpiresAt, locale)} />
        </Section>

        <p className="text-[10px] text-ink-400">Server time · {serverTime}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-header"><span className="text-xs font-semibold text-ink-900">{title}</span></div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

function M({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-surface-200 bg-surface-50 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-ink-900">{value}</div>
    </div>
  );
}
