"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { useDevices } from "@/hooks/useDevices";
import { formatDurationS, formatNumber } from "@/lib/format";
import type { MonthlySummary } from "@/types/domain";

function currentMonthIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }).slice(0, 7);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

async function downloadCsv(path: string, fallbackName: string) {
  const r = await api.get<Blob>(path, { responseType: "blob" });
  const cd = r.headers["content-disposition"] as string | undefined;
  const match = cd?.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] ?? fallbackName;
  const url = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Page() {
  const { t, locale } = useLocale();
  const { devices } = useDevices();
  const [from, setFrom] = useState(weekAgoIso());
  const [to, setTo] = useState(todayIso());
  const [busy, setBusy] = useState<"trips" | "alarms" | "monthly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [monthlyImei, setMonthlyImei] = useState("");
  const [month, setMonth] = useState(currentMonthIso());
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const loadMonthly = async () => {
    if (!monthlyImei || !month) return;
    setMonthlyLoading(true);
    setError(null);
    try {
      const r = await api.get<MonthlySummary>("/reports/monthly-summary", {
        params: { device: monthlyImei, month },
      });
      setMonthly(r.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
      setMonthly(null);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const onDownload = async (kind: "trips" | "alarms") => {
    setBusy(kind);
    setError(null);
    try {
      await downloadCsv(`/reports/${kind}.csv?from=${from}&to=${to}`, `${kind}_${from}_${to}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "download failed");
    } finally {
      setBusy(null);
    }
  };

  const valid = from && to && from <= to;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-400/15 px-4 py-3">
        <h1 className="font-display text-lg font-semibold">{t("reports.title")}</h1>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <div className="panel p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-ink-400">{t("common.from")}</span>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                max={to}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-ink-400">{t("common.to")}</span>
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                min={from}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="panel flex flex-col gap-3 p-4">
            <div className="font-display text-sm font-semibold">{t("reports.tripsReport")}</div>
            <button
              type="button"
              className="btn-primary"
              disabled={!valid || busy !== null}
              onClick={() => onDownload("trips")}
            >
              {busy === "trips" ? t("common.loading") : t("common.download")}
            </button>
          </div>
          <div className="panel flex flex-col gap-3 p-4">
            <div className="font-display text-sm font-semibold">{t("reports.alarmsReport")}</div>
            <button
              type="button"
              className="btn-primary"
              disabled={!valid || busy !== null}
              onClick={() => onDownload("alarms")}
            >
              {busy === "alarms" ? t("common.loading") : t("common.download")}
            </button>
          </div>
        </div>

        {/* Monthly driving & stoppage (AutoNemo parity) */}
        <div className="panel p-4">
          <div className="mb-3 font-display text-sm font-semibold">{t("reports.monthly")}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-ink-400">{t("reports.vehicle")}</span>
              <select
                className="select w-full"
                value={monthlyImei}
                onChange={(e) => setMonthlyImei(e.target.value)}
              >
                <option value="">—</option>
                {devices.map((d) => (
                  <option key={d.imei} value={d.imei}>
                    {d.name || d.vehiclePlate || d.imei}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-ink-400">{t("reports.month")}</span>
              <input
                type="month"
                className="input"
                value={month}
                max={currentMonthIso()}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={!monthlyImei || !month || monthlyLoading}
                onClick={() => void loadMonthly()}
              >
                {monthlyLoading ? t("common.loading") : t("reports.view")}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!monthlyImei || !month || busy !== null}
                onClick={async () => {
                  setBusy("monthly");
                  setError(null);
                  try {
                    await downloadCsv(
                      `/reports/monthly-summary.csv?device=${encodeURIComponent(monthlyImei)}&month=${month}`,
                      `monthly_${month}_${monthlyImei}.csv`,
                    );
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "download failed");
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === "monthly" ? t("common.loading") : t("common.download")}
              </button>
            </div>
          </div>

          {monthly && (
            <div className="mt-4 overflow-x-auto">
              {monthly.days.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-500">{t("reports.none")}</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-300 text-left text-[10px] uppercase tracking-wide text-ink-400">
                      <th className="py-1.5 pr-2">{t("reports.date")}</th>
                      <th className="py-1.5 pr-2 text-right">{t("home.trips")}</th>
                      <th className="py-1.5 pr-2 text-right">{t("kpi.km")}</th>
                      <th className="py-1.5 pr-2 text-right">{t("reports.driving")}</th>
                      <th className="py-1.5 pr-2 text-right">{t("reports.idle")}</th>
                      <th className="py-1.5 pr-2 text-right">{t("reports.stopped")}</th>
                      <th className="py-1.5 text-right">{t("trips.maxSpeed")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.days.map((d) => (
                      <tr key={d.date} className="border-b border-surface-100">
                        <td className="py-1.5 pr-2 font-mono">{d.date}</td>
                        <td className="py-1.5 pr-2 text-right">{formatNumber(d.trips, locale)}</td>
                        <td className="py-1.5 pr-2 text-right">
                          {formatNumber(d.distanceM / 1000, locale, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="py-1.5 pr-2 text-right">{formatDurationS(d.drivingS, locale)}</td>
                        <td className="py-1.5 pr-2 text-right">{formatDurationS(d.idleS, locale)}</td>
                        <td className="py-1.5 pr-2 text-right">{formatDurationS(d.stoppedS, locale)}</td>
                        <td className="py-1.5 text-right">{d.maxSpeed}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-1.5 pr-2">{t("home.total")}</td>
                      <td className="py-1.5 pr-2 text-right">{formatNumber(monthly.totals.trips, locale)}</td>
                      <td className="py-1.5 pr-2 text-right">
                        {formatNumber(monthly.totals.distanceM / 1000, locale, { maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-1.5 pr-2 text-right">{formatDurationS(monthly.totals.drivingS, locale)}</td>
                      <td className="py-1.5 pr-2 text-right">{formatDurationS(monthly.totals.idleS, locale)}</td>
                      <td className="py-1.5 pr-2 text-right">{formatDurationS(monthly.totals.stoppedS, locale)}</td>
                      <td className="py-1.5 text-right">{monthly.totals.maxSpeed}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {error && <div className="text-sm text-alarm-red">{error}</div>}
      </div>
    </div>
  );
}
