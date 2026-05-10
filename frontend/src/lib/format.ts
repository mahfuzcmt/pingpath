import type { Locale } from "./i18n";

const TIMEZONE = "Asia/Dhaka";

export function formatNumber(n: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  const tag = locale === "bn" ? "bn-BD" : "en-US";
  return new Intl.NumberFormat(tag, opts).format(n);
}

export function formatDateTime(iso: string | Date, locale: Locale): string {
  const tag = locale === "bn" ? "bn-BD" : "en-US";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(tag, {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelative(iso: string | null, locale: Locale): string {
  if (!iso) return locale === "bn" ? "—" : "—";
  const tag = locale === "bn" ? "bn-BD" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

export function formatBdt(amount: number, locale: Locale): string {
  if (locale === "bn") return `৳ ${formatNumber(amount, "bn")}`;
  return `BDT ${formatNumber(amount, "en", { minimumFractionDigits: 0 })}`;
}

export function formatVoltage(mv: number | null | undefined, locale: Locale): string {
  if (mv == null) return "—";
  return `${formatNumber(mv / 1000, locale, { maximumFractionDigits: 2 })} V`;
}

/**
 * GT06 reports GSM strength as 0-31 (or 0-4 on older firmware). We render as
 * percentage for compactness; callers rendering bars use {@link gsmBars} below.
 */
export function formatGsmSignal(value: number | null | undefined, locale: Locale): string {
  if (value == null) return "—";
  const pct = Math.round(Math.min(100, (value / 31) * 100));
  return `${formatNumber(pct, locale)}%`;
}

/** Map raw GSM strength (0-31) to a 0-4 bar count for icon-style indicators. */
export function gsmBars(value: number | null | undefined): number {
  if (value == null) return 0;
  if (value <= 0) return 0;
  if (value <= 7) return 1;
  if (value <= 15) return 2;
  if (value <= 23) return 3;
  return 4;
}

export function formatEngineHours(seconds: number | null | undefined, locale: Locale): string {
  if (seconds == null) return "—";
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1000) return `${formatNumber(Math.floor(hours / 100) / 10, locale, { maximumFractionDigits: 1 })}k h`;
  if (hours > 0) return `${formatNumber(hours, locale)}h ${formatNumber(minutes, locale)}m`;
  return `${formatNumber(minutes, locale)}m`;
}
