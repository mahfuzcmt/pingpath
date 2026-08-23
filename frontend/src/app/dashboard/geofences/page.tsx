"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useGeofences } from "@/hooks/useGeofences";
import { useDevices } from "@/hooks/useDevices";
import { GeofenceEditor } from "@/components/geofence/GeofenceEditor";
import { formatDateTime } from "@/lib/format";

interface GeofenceWithDevices {
  id: string;
  assignedCount: number;
}

export default function Page() {
  const { t, locale } = useLocale();
  const { geofences, loading, error, create, remove, getAssignedDevices, assignDevices } = useGeofences();
  const { devices } = useDevices();
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigningGeofence, setAssigningGeofence] = useState<{ id: string; name: string } | null>(null);
  const [assignedImeis, setAssignedImeis] = useState<string[]>([]);
  const [selectedImeis, setSelectedImeis] = useState<Set<string>>(new Set());
  const [assignLoading, setAssignLoading] = useState(false);
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});

  // Load device counts for all geofences
  useEffect(() => {
    async function loadCounts() {
      const counts: Record<string, number> = {};
      for (const g of geofences) {
        try {
          const imeis = await getAssignedDevices(g.id);
          counts[g.id] = imeis.length;
        } catch {
          counts[g.id] = 0;
        }
      }
      setDeviceCounts(counts);
    }
    if (geofences.length > 0) {
      loadCounts();
    }
  }, [geofences, getAssignedDevices]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t("common.delete")} "${name}"?`)) return;
    setBusyId(id);
    try {
      await remove(id);
    } finally {
      setBusyId(null);
    }
  };

  const openAssignDialog = async (geofence: { id: string; name: string }) => {
    setAssigningGeofence(geofence);
    setAssignLoading(true);
    try {
      const imeis = await getAssignedDevices(geofence.id);
      setAssignedImeis(imeis);
      setSelectedImeis(new Set(imeis));
    } catch {
      setAssignedImeis([]);
      setSelectedImeis(new Set());
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleDevice = (imei: string) => {
    setSelectedImeis((prev) => {
      const next = new Set(prev);
      if (next.has(imei)) {
        next.delete(imei);
      } else {
        next.add(imei);
      }
      return next;
    });
  };

  const handleSaveAssignment = async () => {
    if (!assigningGeofence) return;
    setAssignLoading(true);
    try {
      await assignDevices(assigningGeofence.id, Array.from(selectedImeis));
      setDeviceCounts((prev) => ({ ...prev, [assigningGeofence.id]: selectedImeis.size }));
      setAssigningGeofence(null);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-400/15 px-4 py-3">
        <h1 className="font-display text-lg font-semibold">{t("geo.title")}</h1>
        <button type="button" className="btn-primary text-sm" onClick={() => setEditing(true)}>
          {t("geo.new")}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && <div className="px-4 py-6 text-sm text-ink-400">{t("common.loading")}</div>}
        {error && <div className="px-4 py-6 text-sm text-alarm-red">{error}</div>}
        {!loading && geofences.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-ink-400">{t("common.empty")}</div>
        )}

        {geofences.length > 0 && (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 z-10 bg-ink-950 text-left text-xs uppercase text-ink-400">
              <tr>
                <th className="px-4 py-2">{t("geo.name")}</th>
                <th className="px-4 py-2">{t("geo.shape")}</th>
                <th className="px-4 py-2">{t("geo.notifyOn")}</th>
                <th className="px-4 py-2">{t("geo.radius")}</th>
                <th className="px-4 py-2">{t("geo.vehicles") || "Vehicles"}</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {geofences.map((g) => (
                <tr key={g.id} className="border-b border-ink-400/10 hover:bg-ink-900/30">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="font-medium text-ink-50">{g.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-100">
                    {g.type === "CIRCLE" ? t("geo.circle") : t("geo.polygon")}
                  </td>
                  <td className="px-4 py-2 text-ink-100">{g.notifyOn}</td>
                  <td className="px-4 py-2 text-ink-100">
                    {g.radiusM ? `${g.radiusM} m` : `${g.polygon.length} pts`}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded bg-ink-900 px-2 py-1 text-xs text-ink-100 hover:bg-ink-800"
                      onClick={() => openAssignDialog({ id: g.id, name: g.name })}
                    >
                      <span>{deviceCounts[g.id] ?? 0} vehicles</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-2 text-ink-100">{formatDateTime(g.createdAt, locale)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1 text-xs"
                      disabled={busyId === g.id}
                      onClick={() => handleDelete(g.id, g.name)}
                    >
                      {busyId === g.id ? t("common.loading") : t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <GeofenceEditor
          onCancel={() => setEditing(false)}
          onSubmit={async (req) => {
            await create(req);
            setEditing(false);
          }}
        />
      )}

      {/* Device Assignment Dialog */}
      {assigningGeofence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg bg-ink-950 p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-ink-50">
              {t("geo.assignVehicles") || "Assign Vehicles"}
            </h2>
            <p className="mb-4 text-sm text-ink-400">
              {assigningGeofence.name}
            </p>

            {assignLoading ? (
              <div className="py-8 text-center text-sm text-ink-400">{t("common.loading")}</div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded border border-ink-400/20 bg-ink-900/50">
                {devices.length === 0 ? (
                  <div className="py-6 text-center text-sm text-ink-400">
                    {t("common.empty")}
                  </div>
                ) : (
                  <ul className="divide-y divide-ink-400/10">
                    {devices.map((d) => (
                      <li
                        key={d.imei}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-ink-800/50"
                        onClick={() => toggleDevice(d.imei)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedImeis.has(d.imei)}
                          onChange={() => toggleDevice(d.imei)}
                          className="h-4 w-4 rounded border-ink-400 bg-ink-900 text-brand-500 focus:ring-brand-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-ink-50">
                            {d.name || d.vehiclePlate || d.imei}
                          </div>
                          <div className="truncate text-xs text-ink-400">
                            {d.vehiclePlate && d.name ? d.vehiclePlate : d.imei}
                          </div>
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            d.status === "ONLINE" ? "bg-alarm-green" : "bg-ink-400"
                          }`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-ink-400">
                {selectedImeis.size} {t("geo.selected") || "selected"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost px-4 py-2 text-sm"
                  onClick={() => setAssigningGeofence(null)}
                  disabled={assignLoading}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="btn-primary px-4 py-2 text-sm"
                  onClick={handleSaveAssignment}
                  disabled={assignLoading}
                >
                  {assignLoading ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
