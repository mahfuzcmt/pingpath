export type DeviceStatus = "ONLINE" | "OFFLINE" | "NEVER_CONNECTED";
export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "ORG_USER";

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  status: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  locale: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgUpdate {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  locale?: string;
  timezone?: string;
}

export interface UserDetail {
  id: string;
  orgId: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserCreate {
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  password: string;
}

export interface UserUpdate {
  fullName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface AuditLogEntry {
  id: number;
  orgId: string | null;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  ts: string;
}

/**
 * Mirrors backend `dto.DeviceDtos.DeviceView`. Field names are the wire
 * format — keep them aligned with the Java record.
 */
export interface DeviceView {
  id: string;
  imei: string;
  name: string | null;
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
  iconColor: string | null;
}

/**
 * Mirrors backend `dto.LocationDtos.LocationView` AND the Redis-published
 * LocationEvent shape (LocationService.toJson). Both use latitude/longitude.
 */
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
}

export interface UserView {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  locale: "en" | "bn";
}

export interface OrgView {
  id: string;
  name: string;
  plan: string;
  locale: "en" | "bn";
}

export interface AuthMeResponse {
  user: UserView;
  org: OrgView;
}

export type GeofenceType = "CIRCLE" | "POLYGON";
export type GeofenceNotifyOn = "ENTER" | "EXIT" | "BOTH";

export interface LatLng { lat: number; lng: number; }

export interface GeofenceView {
  id: string;
  name: string;
  type: GeofenceType;
  notifyOn: GeofenceNotifyOn;
  color: string;
  active: boolean;
  center: LatLng | null;
  radiusM: number | null;
  polygon: LatLng[];
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceCreate {
  name: string;
  type: GeofenceType;
  notifyOn: GeofenceNotifyOn;
  color?: string;
  center?: LatLng;
  radiusM?: number;
  polygon?: LatLng[];
  imeis?: string[];
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
  | "LOW_BATTERY";

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
