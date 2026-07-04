/**
 * Wire types mirroring the backend DTOs. Kept in sync with
 * frontend/src/types/domain.ts and the Java records. Only the subset the
 * mobile app uses is included.
 */

export type DeviceStatus = "ONLINE" | "OFFLINE" | "NEVER_CONNECTED";
export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "ORG_USER";

/** Derived motion state for the UI (backend only knows ONLINE/OFFLINE). */
export type MotionStatus = "MOVING" | "IDLE" | "STOPPED" | "OFFLINE";

export interface CommandResponse {
  ok: boolean;
  reply: string | null;
  error: string | null;
}

/** Fleet-level KPIs — mirrors backend dto.DashboardDtos.KpiSnapshot. */
export interface KpiSnapshot {
  devicesTotal: number;
  devicesOnline: number;
  devicesOffline: number;
  devicesNeverConnected: number;
  alarmsToday: number;
  alarmsCriticalToday: number;
  alarmsUnacknowledged: number;
  tripsActive: number;
  tripsCompletedToday: number;
  distanceTodayMeters: number;
  generatedAt: string;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  orgId: string;
}

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  locale: string;
  timezone: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
  org: OrgSummary;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Mirrors backend dto.DeviceDtos.DeviceView. */
export interface DeviceView {
  id: string;
  imei: string;
  name: string | null;
  simMsisdn: string | null;
  vehiclePlate: string | null;
  vehicleType: string | null;
  protocol: string | null;
  protocolVariant: string | null;
  model: string | null;
  status: DeviceStatus;
  lastSeenAt: string | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastSpeed: number | null;
  lastCourse: number | null;
  lastVoltageMv: number | null;
  lastGsmSignal: number | null;
  lastEngineHoursSeconds: number | null;
  iconColor: string | null;
  /** Last engine cut/restore state recorded after a DYD/HFYD command. */
  engineLocked: boolean;
  /** Current subscription status (ACTIVE, GRACE, SUSPENDED, …) or null if none. */
  subscriptionStatus: string | null;
  /** Subscription next-due date (ISO yyyy-MM-dd) or null if none. */
  subscriptionExpiresAt: string | null;
}

/** Mirrors backend dto.LocationDtos.LocationView and the WS LocationEvent. */
export interface LocationView {
  imei: string;
  ts: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  valid: boolean;
  satellites?: number | null;
  accOn?: boolean | null;
  voltageMv?: number | null;
  mileageMeters?: number | null;
  altitude?: number | null;
  gsmSignal?: number | null;
  engineHoursSeconds?: number | null;
}

export type AlarmType =
  | "SOS"
  | "POWER_CUT"
  | "SHOCK"
  | "OVERSPEED"
  | "GEOFENCE_ENTER"
  | "GEOFENCE_EXIT"
  | "COLLISION"
  | "ACC_ON"
  | "ACC_OFF"
  | "LOW_BATTERY"
  | "CURFEW_VIOLATION";

export type AlarmSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AlarmView {
  id: string;
  deviceImei: string;
  type: AlarmType;
  severity: AlarmSeverity;
  ts: string;
  latitude: number | null;
  longitude: number | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  metadata: Record<string, unknown>;
}

export type TripStatus = "IN_PROGRESS" | "COMPLETED";

/** Mirrors backend dto.TripDtos.TripView — the "moving history" record. */
export interface TripView {
  id: string;
  deviceImei: string;
  startedAt: string;
  endedAt: string | null;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  distanceM: number;
  durationS: number | null;
  maxSpeed: number;
  avgSpeed: number;
  idleTimeS: number;
  status: TripStatus;
}
