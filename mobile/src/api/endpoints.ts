import { api } from "./client";
import type {
  AlarmView,
  CommandResponse,
  DeviceView,
  KpiSnapshot,
  LocationView,
  LoginResponse,
  TripView,
} from "@/types";

// ----- Auth -----
export async function login(email: string, password: string): Promise<LoginResponse> {
  const r = await api.post<LoginResponse>("/auth/login", { email, password });
  return r.data;
}

// ----- Devices -----
export async function listDevices(status?: string): Promise<DeviceView[]> {
  const r = await api.get<DeviceView[]>("/devices", {
    params: status ? { status } : undefined,
  });
  return r.data;
}

export async function getDevice(imei: string): Promise<DeviceView> {
  const r = await api.get<DeviceView>(`/devices/${imei}`);
  return r.data;
}

/** Last-known position for a single device (may 404 if never reported). */
export async function deviceLastLocation(imei: string): Promise<LocationView | null> {
  try {
    const r = await api.get<LocationView>(`/devices/${imei}/locations/last`);
    return r.data;
  } catch {
    return null;
  }
}

// ----- Engine lock commands (GT06 DYD / HFYD, CLAUDE.md §7.5) -----
export async function cutFuel(imei: string, devicePassword?: string): Promise<CommandResponse> {
  const r = await api.post<CommandResponse>(`/devices/${imei}/commands/cut-fuel`, { devicePassword });
  return r.data;
}

export async function restoreFuel(imei: string, devicePassword?: string): Promise<CommandResponse> {
  const r = await api.post<CommandResponse>(`/devices/${imei}/commands/restore-fuel`, { devicePassword });
  return r.data;
}

// ----- Dashboard KPIs -----
export async function getKpis(): Promise<KpiSnapshot> {
  const r = await api.get<KpiSnapshot>("/dashboard/kpis");
  return r.data;
}

// ----- Locations -----
/** All last-known positions for the org — dashboard/map bootstrap. */
export async function lastKnownAll(): Promise<LocationView[]> {
  const r = await api.get<LocationView[]>("/devices/locations/last");
  return r.data;
}

/** Historical points for one device in a time range — trip playback. */
export async function locationHistory(
  imei: string,
  fromIso: string,
  toIso: string,
  limit = 5000,
): Promise<LocationView[]> {
  const r = await api.get<LocationView[]>(`/devices/${imei}/locations`, {
    params: { from: fromIso, to: toIso, limit },
  });
  return r.data;
}

// ----- Trips (moving history) -----
export async function tripsForDevice(
  imei: string,
  fromIso: string,
  toIso: string,
): Promise<TripView[]> {
  const r = await api.get<TripView[]>(`/trips/device/${imei}`, {
    params: { from: fromIso, to: toIso },
  });
  return r.data;
}

// ----- Push notifications -----
export async function registerPushToken(
  token: string,
  platform: "ANDROID" | "IOS",
): Promise<void> {
  await api.post("/users/me/push-tokens", { token, platform });
}

/** Token goes in the query string — Expo tokens contain reserved chars like [ ]. */
export async function unregisterPushToken(token: string): Promise<void> {
  await api.delete("/users/me/push-tokens", { params: { token } });
}

// ----- Alarms -----
export async function listAlarms(onlyUnacked = false, limit = 100): Promise<AlarmView[]> {
  const r = await api.get<AlarmView[]>("/alarms", {
    params: { unacked: onlyUnacked || undefined, limit },
  });
  return r.data;
}

export async function acknowledgeAlarm(id: string): Promise<AlarmView> {
  const r = await api.post<AlarmView>(`/alarms/${id}/acknowledge`);
  return r.data;
}
