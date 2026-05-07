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
  CRITICAL: "bg-alarm-red/20 text-alarm-red",
  WARNING: "bg-alarm-amber/20 text-alarm-amber",
  INFO: "bg-brand-500/20 text-brand-500",
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-400/15 px-4 py-3">
        <h1 className="font-display text-lg font-semibold">{t("alarms.title")}</h1>
        <label className="flex items-center gap-2 text-xs text-ink-100">
          <input
            type="checkbox"
            checked={unackedOnly}
            onChange={(e) => setUnackedOnly(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          {t("alarms.unackedOnly")}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-4 py-6 text-sm text-ink-400">{t("common.loading")}</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-ink-400">{t("common.empty")}</div>
        )}
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-ink-950 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">{t("alarms.severity")}</th>
              <th className="px-4 py-2">{t("alarms.type")}</th>
              <th className="px-4 py-2">IMEI</th>
              <th className="px-4 py-2">{t("trips.startedAt")}</th>
              <th className="px-4 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-ink-400/10 hover:bg-ink-900/30">
                <td className="px-4 py-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${SEV_PILL[a.severity]}`}>
                    {a.severity}
                  </span>
                </td>
                <td className="px-4 py-2 font-medium text-ink-50">{a.type}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-100">{a.deviceImei}</td>
                <td className="px-4 py-2 text-ink-100">{formatDateTime(a.ts, locale)}</td>
                <td className="px-4 py-2 text-right">
                  {a.acknowledged ? (
                    <span className="text-xs text-ink-400">{t("common.acknowledged")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAck(a.id)}
                      disabled={busy.has(a.id)}
                      className="btn-ghost px-3 py-1 text-xs"
                    >
                      {busy.has(a.id) ? t("common.loading") : t("common.acknowledge")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
