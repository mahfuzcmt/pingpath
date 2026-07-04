import type { Locale } from "./i18n";
import type { DeviceView, LocationView } from "@/types/domain";

const TIMEZONE = "Asia/Dhaka";

/**
 * AutoNemo-style single-bucket vehicle state (matches the filter chips on the
 * Vehicles screen). Mirrors the 4-state motion model in the mobile app, plus
 * the subscription "expired" and "no data" buckets AutoNemo distinguishes.
 */
export type VehicleState = "moving" | "idle" | "stopped" | "offline" | "expired" | "nodata";

/** True if the device's subscription has lapsed (suspended/cancelled or past due). */
export function isSubscriptionExpired(d: DeviceView): boolean {
  if (d.subscriptionStatus === "SUSPENDED" || d.subscriptionStatus === "CANCELLED") return true;
  if (d.subscriptionExpiresAt) {
    // Compare Dhaka calendar dates; expiry is a yyyy-MM-dd date string.
    const todayDhaka = new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
    return d.subscriptionExpiresAt < todayDhaka;
  }
  return false;
}

/**
 * Derive the vehicle's state. Precedence: no-data > expired > offline >
 * motion (moving / idle / stopped). Buckets are mutually exclusive so the
 * filter-chip counts sum to the fleet total.
 */
export function vehicleState(d: DeviceView, live?: LocationView | null): VehicleState {
  if (d.status === "NEVER_CONNECTED" || !d.lastSeenAt) return "nodata";
  if (isSubscriptionExpired(d)) return "expired";
  if (d.status !== "ONLINE") return "offline";
  const speed = live?.speed ?? d.lastSpeed ?? 0;
  if (speed > 2) return "moving";
  if (live?.accOn) return "idle";
  return "stopped";
}

/** Hex color per state — for map/SVG fills that can't use CSS classes. */
export const VEHICLE_STATE_COLOR: Record<VehicleState, string> = {
  moving: "#4DA74D",
  idle: "#9440ED",
  stopped: "#CB4B4B",
  offline: "#AFD8F8",
  expired: "#6B7280",
  nodata: "#EDC240",
};

/** Compact elapsed time "0h 18m" / "18m 2s" since a timestamp (AutoNemo "since"). */
export function formatSince(ts: string | null | undefined): string {
  if (!ts) return "—";
  const secs = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Date-only in Asia/Dhaka — for subscription "Expires on". Accepts yyyy-MM-dd or ISO. */
export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const tag = locale === "bn" ? "bn-BD" : "en-US";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00+06:00` : iso);
  return new Intl.DateTimeFormat(tag, {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

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
