"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "@/lib/i18n";
import { useSession } from "@/lib/session-context";
import { useAlarms } from "@/hooks/useAlarms";
import { formatDateTime } from "@/lib/format";
import type { AlarmSeverity, AlarmView } from "@/types/domain";

const SEV_COLOR: Record<AlarmSeverity, string> = {
  CRITICAL: "bg-alarm-red",
  WARNING: "bg-alarm-amber",
  INFO: "bg-brand-500",
};

const SEV_TEXT: Record<AlarmSeverity, string> = {
  CRITICAL: "text-alarm-red",
  WARNING: "text-alarm-amber",
  INFO: "text-brand-500",
};

const SEV_BG: Record<AlarmSeverity, string> = {
  CRITICAL: "bg-red-50",
  WARNING: "bg-amber-50",
  INFO: "bg-brand-50",
};

export function NotificationDropdown() {
  const { t, locale } = useLocale();
  const { orgId } = useSession();
  const { alarms, acknowledge } = useAlarms(orgId, { unackedOnly: true, limit: 25 });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unackedCount = alarms.filter((a) => !a.acknowledged).length;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  const onAck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy((b) => new Set(b).add(id));
    try {
      await acknowledge(id);
    } catch {
      // leave visible for retry
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  const onAckAll = async () => {
    const unacked = alarms.filter((a) => !a.acknowledged);
    for (const a of unacked) {
      try {
        await acknowledge(a.id);
      } catch {
        // continue with others
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 transition hover:bg-white/60 hover:text-ink-800"
        title={t("alarms.notifications")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3V8Z" />
          <path d="M10 19a2 2 0 1 0 4 0" />
        </svg>
        {unackedCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-alarm-red px-1 text-[10px] font-bold text-white">
            {unackedCount > 99 ? "99+" : unackedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[2200] mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-2.5">
            <span className="text-sm font-semibold text-ink-900">{t("alarms.notifications")}</span>
            {unackedCount > 0 && (
              <button
                type="button"
                onClick={onAckAll}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {t("alarms.ackAll")}
              </button>
            )}
          </div>

          {/* Alarm list */}
          <div className="max-h-80 overflow-y-auto">
            {alarms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-ink-500">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-ink-300">
                  <path d="M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3V8Z" />
                  <path d="M10 19a2 2 0 1 0 4 0" />
                  <path d="M2 2 22 22" />
                </svg>
                <span className="text-sm">{t("alarms.noAlarms")}</span>
              </div>
            ) : (
              alarms.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className={`border-b border-ink-100 px-4 py-3 transition last:border-b-0 ${
                    a.acknowledged ? "bg-white" : SEV_BG[a.severity]
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity indicator */}
                    <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${SEV_COLOR[a.severity]}`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${SEV_TEXT[a.severity]}`}>
                          {a.severity}
                        </span>
                        <span className="text-xs font-medium text-ink-700">{a.type}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-600">
                        <span className="font-mono">{a.deviceImei}</span>
                        <span className="mx-1.5 text-ink-400">·</span>
                        <span>{formatDateTime(a.ts, locale)}</span>
                      </div>
                    </div>

                    {/* Acknowledge button */}
                    {!a.acknowledged && (
                      <button
                        type="button"
                        onClick={(e) => onAck(a.id, e)}
                        disabled={busy.has(a.id)}
                        className="flex-shrink-0 rounded-md bg-brand-500 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                      >
                        {busy.has(a.id) ? "..." : t("common.ack")}
                      </button>
                    )}
                    {a.acknowledged && (
                      <span className="flex-shrink-0 text-[10px] text-ink-400">
                        {t("common.acknowledged")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - View all link */}
          {alarms.length > 0 && (
            <div className="border-t border-ink-100 bg-ink-50 px-4 py-2">
              <a
                href="/dashboard/alarms"
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
                onClick={() => setOpen(false)}
              >
                {t("alarms.viewAll")} →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
