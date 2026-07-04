import { api } from "@/lib/api";

/** Mirrors backend dto.CommandDtos.CommandResponse. */
export interface CommandResponse {
  ok: boolean;
  reply: string | null;
  error: string | null;
}

/** Cut the engine (GT06 DYD). Backend defaults the device password to 123456. */
export async function cutFuel(imei: string, devicePassword?: string): Promise<CommandResponse> {
  const r = await api.post<CommandResponse>(`/devices/${encodeURIComponent(imei)}/commands/cut-fuel`, {
    devicePassword,
  });
  return r.data;
}

/** Restore the engine (GT06 HFYD). */
export async function restoreFuel(imei: string, devicePassword?: string): Promise<CommandResponse> {
  const r = await api.post<CommandResponse>(`/devices/${encodeURIComponent(imei)}/commands/restore-fuel`, {
    devicePassword,
  });
  return r.data;
}
