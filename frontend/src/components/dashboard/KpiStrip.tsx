"use client";

import { useState } from "react";
import { useDashboardKpis } from "@/hooks/useDashboardKpis";
import { useLocale } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import type { KpiSnapshot } from "@/types/domain";

/**
 * Floating KPI strip overlay on the live map. Polls every 30s and live-overrides
 * the online/offline counters from the WS-driven device list — keeps the device
 * counts feeling realtime even though the heavier "today" aggregates only refresh
 * on the poll cycle.
 */
interface Props {
  liveOnlineCount?: number;
  liveOfflineCount?: number;
}

export function KpiStrip({ liveOnlineCount, liveOfflineCount }: Props) {
  const { kpis, error } = useDashboardKpis();
  const { t, locale } = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  if (error || !kpis) return null;

  const online = liveOnlineCount ?? kpis.devicesOnline;
  const offline = liveOfflineCount ?? kpis.devicesOffline;
  const distanceKm = kpis.distanceTodayMeters / 1000;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex items-stretch gap-px overflow-hidden rounded-md border border-ink-400/20 bg-ink-900/90 shadow-lg backdrop-blur">
        {!collapsed && (
          <>
            <Kpi label={t("kpi.online")} value={formatNumber(online, locale)} accent="text-alarm-green" />
            <Kpi label={t("kpi.offline")} value={formatNumber(offline, locale)} accent="text-ink-400" />
            <Kpi
              label={t("kpi.alertsToday")}
              value={formatNumber(kpis.alarmsToday, locale)}
              accent={kpis.alarmsCriticalToday > 0 ? "text-alarm-red" : "text-brand-500"}
              subValue={kpis.alarmsCriticalToday > 0
                ? `${formatNumber(kpis.alarmsCriticalToday, locale)} ${t("kpi.critical")}`
                : undefined}
            />
            <Kpi
              label={t("kpi.tripsActive")}
              value={formatNumber(kpis.tripsActive, locale)}
              accent="text-ink-50"
              subValue={`${formatNumber(kpis.tripsCompletedToday, locale)} ${t("kpi.done")}`}
            />
            <Kpi
              label={t("kpi.distanceToday")}
              value={`${formatNumber(distanceKm, locale, { maximumFractionDigits: distanceKm >= 100 ? 0 : 1 })}`}
              unit={t("kpi.km")}
              accent="text-ink-50"
            />
          </>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand KPIs" : "Collapse KPIs"}
          className="flex items-center px-2 text-ink-400 transition-colors hover:bg-ink-800/60 hover:text-ink-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <path d="M9 5l7 7-7 7" />
            ) : (
              <path d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
  accent?: string;
}

function Kpi({ label, value, unit, subValue, accent = "text-ink-50" }: KpiProps) {
  return (
    <div className="flex min-w-[88px] flex-col gap-0.5 px-3 py-2 sm:px-4">
      <span className="text-[9px] font-medium uppercase tracking-wide text-ink-400">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-base font-semibold leading-none ${accent}`}>{value}</span>
        {unit && <span className="text-[10px] text-ink-400">{unit}</span>}
      </div>
      {subValue && <span className="text-[9px] text-ink-400">{subValue}</span>}
    </div>
  );
}

export type { KpiSnapshot };
