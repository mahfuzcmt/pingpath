"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import type { AlarmSeverity, AlarmView } from "@/types/domain";

interface AlarmListProps {
  alarms: AlarmView[];
  loading: boolean;
  onAcknowledge: (id: string) => Promise<unknown>;
}

const SEV_PILL: Record<AlarmSeverity, string> = {
  CRITICAL: "bg-alarm-red text-white",
  WARNING: "bg-alarm-amber text-ink-900",
  INFO: "bg-brand-500 text-white",
};

export function AlarmList({ alarms, loading, onAcknowledge }: AlarmListProps) {
  const { t, locale } = useLocale();
  const [unackedOnly, setUnackedOnly] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => (unackedOnly ? alarms.filter((a) => !a.acknowledged) : alarms),
    [alarms, unackedOnly],
  );

  const handleAck = async (id: string) => {
    setBusy((b) => new Set(b).add(id));
    try {
      await onAcknowledge(id);
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="panel-header">
        <h1 className="text-xs font-semibold text-ink-900">{t("alarms.title")}</h1>
        <label className="flex items-center gap-1.5 text-xs text-ink-700">
          <input
            type="checkbox"
            checked={unackedOnly}
            onChange={(e) => setUnackedOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          {t("alarms.unackedOnly")}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-3 py-4 text-xs text-ink-500">{t("common.loading")}</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-12 text-center text-xs text-ink-500">{t("common.empty")}</div>
        )}
        {!loading && filtered.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("alarms.severity")}</th>
                <th>{t("alarms.type")}</th>
                <th>IMEI</th>
                <th>{t("trips.startedAt")}</th>
                <th className="text-right" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={`status-pill ${SEV_PILL[a.severity]}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="font-semibold">{a.type}</td>
                  <td className="font-mono text-[11px] text-ink-700">{a.deviceImei}</td>
                  <td className="text-ink-700">{formatDateTime(a.ts, locale)}</td>
                  <td className="text-right">
                    {a.acknowledged ? (
                      <span className="text-[11px] text-ink-500">{t("common.acknowledged")}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAck(a.id)}
                        disabled={busy.has(a.id)}
                        className="btn-secondary"
                      >
                        {busy.has(a.id) ? t("common.loading") : t("common.acknowledge")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
