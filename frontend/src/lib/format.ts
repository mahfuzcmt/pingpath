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
