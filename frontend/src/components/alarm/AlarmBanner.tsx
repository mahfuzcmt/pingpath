"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useSession } from "@/lib/session-context";
import { useAlarms } from "@/hooks/useAlarms";
import { formatDateTime } from "@/lib/format";
import type { AlarmSeverity, AlarmView } from "@/types/domain";

const SEV_ACCENT: Record<AlarmSeverity, string> = {
  CRITICAL: "border-l-alarm-red",
  WARNING: "border-l-alarm-amber",
  INFO: "border-l-brand-500",
};

const SEV_LABEL: Record<AlarmSeverity, string> = {
  CRITICAL: "text-alarm-red",
  WARNING: "text-alarm-amber",
  INFO: "text-brand-500",
};

/**
 * Floats a banner in the top-right whenever a new unacknowledged alarm
 * arrives. Auto-dismisses INFO alarms after 8s; CRITICAL/WARNING stick
 * until the user acknowledges or closes.
 */
export function AlarmBanner() {
  const { t, locale } = useLocale();
  const { orgId } = useSession();
  const { alarms, acknowledge } = useAlarms(orgId, { unackedOnly: true, limit: 25 });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const visible: AlarmView[] = alarms
    .filter((a) => !a.acknowledged && !dismissed.has(a.id))
    .slice(0, 3);

  useEffect(() => {
    const infoIds = visible.filter((a) => a.severity === "INFO").map((a) => a.id);
    if (infoIds.length === 0) return;
    const handle = setTimeout(() => {
      setDismissed((prev) => {
        const next = new Set(prev);
        for (const id of infoIds) next.add(id);
        return next;
      });
    }, 8000);
    return () => clearTimeout(handle);
  }, [visible]);

  if (visible.length === 0) return null;

  const onAck = async (id: string) => {
    setBusy((b) => new Set(b).add(id));
    try {
      await acknowledge(id);
    } catch {
      // leave the banner visible — user can retry
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="pointer-events-none fixed top-3 right-3 z-50 flex w-[340px] max-w-[90vw] flex-col gap-2">
      {visible.map((a) => (
        <div
          key={a.id}
          className={`pointer-events-auto rounded-sm border border-surface-300 border-l-[3px] bg-white p-3 shadow-menu ${SEV_ACCENT[a.severity]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-ink-900">
                <span className={SEV_LABEL[a.severity]}>{a.severity}</span>
                <span className="mx-1.5 text-ink-300">·</span>
                <span>{a.type}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-ink-700">
                <span className="font-mono">{a.deviceImei}</span>
                <span className="mx-1 text-ink-400">·</span>
                <span>{formatDateTime(a.ts, locale)}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="dismiss"
              className="btn-icon"
              onClick={() => setDismissed((prev) => new Set(prev).add(a.id))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={busy.has(a.id)}
              onClick={() => onAck(a.id)}
            >
              {busy.has(a.id) ? t("common.loading") : t("common.acknowledge")}
            </button>
            <span className="text-[10px] uppercase tracking-wide text-ink-500">
              {t("alarms.banner")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
