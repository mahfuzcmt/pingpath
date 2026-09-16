import type { StringKey } from "@/lib/i18n";
import type { AlarmSeverity, AlarmType } from "@/types/domain";

/** Same order as backend AlarmType so the settings matrix reads like the enum. */
export const ALARM_TYPES: AlarmType[] = [
  "SOS",
  "POWER_CUT",
  "SHOCK",
  "OVERSPEED",
  "GEOFENCE_ENTER",
  "GEOFENCE_EXIT",
  "COLLISION",
  "ACC_ON",
  "ACC_OFF",
  "LOW_BATTERY",
  "EXTERNAL_LOW_VOLTAGE",
  "REMOVE",
  "DOOR",
  "URGENT_ACCELERATION",
  "URGENT_DECELERATION",
  "CURFEW_VIOLATION",
];

export const ALARM_SEVERITIES: AlarmSeverity[] = ["CRITICAL", "WARNING", "INFO"];

/** Human label for an alarm type; unknown/new backend types fall back to Title Case. */
export function alarmTypeLabel(type: string, t: (k: StringKey) => string): string {
  if ((ALARM_TYPES as string[]).includes(type)) return t(`alarmType.${type}` as StringKey);
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function severityLabel(sev: string, t: (k: StringKey) => string): string {
  if (sev === "CRITICAL" || sev === "WARNING" || sev === "INFO") return t(`severity.${sev}` as StringKey);
  return sev;
}
