"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useGeofences } from "@/hooks/useGeofences";
import { GeofenceEditor } from "@/components/geofence/GeofenceEditor";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  const { t, locale } = useLocale();
  const { geofences, loading, error, create, remove } = useGeofences();
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t("common.delete")} "${name}"?`)) return;
    setBusyId(id);
    try {
      await remove(id);
    } finally {
      setBusyId(null);
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
    </div>
  );
}
