"use client";

import { useEffect, useState } from "react";
import { useLocale, type StringKey } from "@/lib/i18n";
import { useUsers, useOrgDevices } from "@/hooks/useUsers";
import { useSession } from "@/lib/session-context";
import { formatDateTime } from "@/lib/format";
import { extractError } from "@/lib/api";
import type { DeviceView, UserCreate, UserDetail, UserRole, UserUpdate } from "@/types/domain";

const ROLES: UserRole[] = ["ORG_ADMIN", "ORG_USER"];

export function UsersTab({ canManage }: { canManage: boolean }) {
  const { t, locale } = useLocale();
  const { userId: selfId } = useSession();
  const { users, loading, error, create, update, disable, getUserDevices, setUserDevices, updateSeeAllDevices } = useUsers();
  const [editing, setEditing] = useState<UserDetail | "new" | null>(null);
  const [managingDevices, setManagingDevices] = useState<UserDetail | null>(null);

  if (loading) return <div className="text-sm text-ink-400">{t("common.loading")}</div>;
  if (error) return <div className="text-sm text-alarm-red">{error}</div>;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-ink-400">
          {users.length} {users.length === 1 ? "user" : "users"}
        </div>
        {canManage && (
          <button type="button" className="btn-primary text-sm" onClick={() => setEditing("new")}>
            {t("users.add")}
          </button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-ink-400">
          <tr>
            <th className="px-3 py-2">{t("users.email")}</th>
            <th className="px-3 py-2">{t("users.fullName")}</th>
            <th className="px-3 py-2">{t("users.role")}</th>
            <th className="px-3 py-2">{t("users.devices")}</th>
            <th className="px-3 py-2">{t("users.lastLogin")}</th>
            <th className="px-3 py-2">{t("users.status")}</th>
            <th className="px-3 py-2 text-right" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const roleKey = `users.role.${u.role}` as StringKey;
            const isAdminRole = u.role === "SUPER_ADMIN" || u.role === "ORG_ADMIN";
            return (
              <tr key={u.id} className="border-b border-ink-400/10 hover:bg-ink-900/30">
                <td className="px-3 py-2">
                  <div className="font-medium text-ink-50">{u.email}</div>
                  {u.phone && <div className="text-xs text-ink-400">{u.phone}</div>}
                </td>
                <td className="px-3 py-2 text-ink-100">{u.fullName ?? "—"}</td>
                <td className="px-3 py-2 text-ink-100">{t(roleKey)}</td>
                <td className="px-3 py-2">
                  {isAdminRole || u.seeAllDevices ? (
                    <span className="text-xs text-ink-400">All</span>
                  ) : (
                    <span className="text-ink-100">{u.assignedDeviceCount}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-100">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt, locale) : "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${
                      u.isActive
                        ? "bg-brand-500/15 text-brand-500"
                        : "bg-ink-400/15 text-ink-400"
                    }`}
                  >
                    {u.isActive ? t("users.active") : t("users.inactive")}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {canManage && (
                    <div className="flex justify-end gap-2">
                      {u.role === "ORG_USER" && (
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1 text-xs"
                          onClick={() => setManagingDevices(u)}
                        >
                          {t("users.manageDevices")}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-xs"
                        onClick={() => setEditing(u)}
                      >
                        {t("users.edit")}
                      </button>
                      {u.isActive && u.id !== selfId && (
                        <button
                          type="button"
                          className="btn-ghost px-2 py-1 text-xs text-alarm-red"
                          onClick={async () => {
                            if (!confirm(`${t("users.disable")} ${u.email}?`)) return;
                            try {
                              await disable(u.id);
                            } catch (err) {
                              alert(extractError(err).message);
                            }
                          }}
                        >
                          {t("users.disable")}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editing && (
        <UserDialog
          user={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onCreate={async (req) => {
            await create(req);
            setEditing(null);
          }}
          onUpdate={async (id, patch) => {
            await update(id, patch);
            setEditing(null);
          }}
        />
      )}

      {managingDevices && (
        <DeviceAssignmentDialog
          user={managingDevices}
          onClose={() => setManagingDevices(null)}
          getUserDevices={getUserDevices}
          setUserDevices={setUserDevices}
          updateSeeAllDevices={updateSeeAllDevices}
        />
      )}
    </div>
  );
}

function UserDialog({
  user,
  onCancel,
  onCreate,
  onUpdate,
}: {
  user: UserDetail | null;
  onCancel: () => void;
  onCreate: (req: UserCreate) => Promise<void>;
  onUpdate: (id: string, patch: UserUpdate) => Promise<void>;
}) {
  const { t } = useLocale();
  const isNew = user === null;

  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "ORG_USER");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isNew) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        await onCreate({
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          role,
          password,
        });
      } else {
        const patch: UserUpdate = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          role,
          isActive,
        };
        if (password.trim()) patch.password = password;
        await onUpdate(user!.id, patch);
      }
    } catch (err) {
      setError(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-3 rounded-lg border border-ink-400/15 bg-ink-950 p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="font-display text-base font-semibold">
            {isNew ? t("users.add") : t("users.edit")}
          </div>
          <button
            type="button"
            className="text-ink-400 hover:text-ink-50"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <Field label={t("users.email")}>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isNew}
            required
          />
        </Field>

        <Field label={t("users.fullName")}>
          <input
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>

        <Field label={t("users.phone")}>
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <Field label={t("users.role")}>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`users.role.${r}` as StringKey)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("users.password")}>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isNew ? "" : (t("users.passwordHint") as string)}
            required={isNew}
            minLength={isNew ? 8 : undefined}
          />
        </Field>

        {!isNew && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {t("users.active")}
          </label>
        )}

        {error && <div className="text-xs text-alarm-red">{error}</div>}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {busy ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wide text-ink-400">{label}</span>
      {children}
    </label>
  );
}

function DeviceAssignmentDialog({
  user,
  onClose,
  getUserDevices,
  setUserDevices,
  updateSeeAllDevices,
}: {
  user: UserDetail;
  onClose: () => void;
  getUserDevices: (userId: string) => Promise<string[]>;
  setUserDevices: (userId: string, imeis: string[]) => Promise<string[]>;
  updateSeeAllDevices: (userId: string, seeAll: boolean) => Promise<UserDetail>;
}) {
  const { t } = useLocale();
  const { devices, loading: devicesLoading } = useOrgDevices();
  const [assignedImeis, setAssignedImeis] = useState<Set<string>>(new Set());
  const [seeAll, setSeeAll] = useState(user.seeAllDevices);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUserDevices(user.id)
      .then((imeis) => setAssignedImeis(new Set(imeis)))
      .catch((err) => setError(extractError(err).message))
      .finally(() => setLoading(false));
  }, [user.id, getUserDevices]);

  // Filter devices based on search
  const filteredDevices = devices.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.imei.toLowerCase().includes(q) ||
      (d.name?.toLowerCase().includes(q)) ||
      (d.vehiclePlate?.toLowerCase().includes(q))
    );
  });

  const toggleDevice = (imei: string) => {
    setAssignedImeis((prev) => {
      const next = new Set(prev);
      if (next.has(imei)) {
        next.delete(imei);
      } else {
        next.add(imei);
      }
      return next;
    });
  };

  const selectAll = () => {
    setAssignedImeis(new Set(devices.map((d) => d.imei)));
  };

  const deselectAll = () => {
    setAssignedImeis(new Set());
  };

  const allSelected = devices.length > 0 && assignedImeis.size === devices.length;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Update seeAllDevices if changed
      if (seeAll !== user.seeAllDevices) {
        await updateSeeAllDevices(user.id, seeAll);
      }
      // Update device assignments
      await setUserDevices(user.id, Array.from(assignedImeis));
      onClose();
    } catch (err) {
      setError(extractError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-ink-400/15 bg-ink-950 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display text-base font-semibold">
              {t("users.manageDevices")}
            </div>
            <div className="text-xs text-ink-400">{user.email}</div>
          </div>
          <button
            type="button"
            className="text-ink-400 hover:text-ink-50"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* See All Devices Toggle */}
        <label className="flex items-center gap-2 text-sm mb-4 p-2 rounded bg-ink-900/30">
          <input
            type="checkbox"
            checked={seeAll}
            onChange={(e) => setSeeAll(e.target.checked)}
          />
          <div>
            <div className="text-ink-100">{t("users.seeAllDevices")}</div>
            <div className="text-xs text-ink-400">{t("users.seeAllDevicesHint")}</div>
          </div>
        </label>

        {/* Device List */}
        {!seeAll && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wide text-ink-400">
                {t("users.selectDevices")}
              </div>
              {!loading && !devicesLoading && devices.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-brand-500 hover:text-brand-400"
                  onClick={allSelected ? deselectAll : selectAll}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {/* Search Box */}
            {!loading && !devicesLoading && devices.length > 0 && (
              <input
                type="text"
                className="input mb-2 text-sm"
                placeholder="Search by name, plate, or IMEI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}

            {loading || devicesLoading ? (
              <div className="text-sm text-ink-400 py-4 text-center">{t("common.loading")}</div>
            ) : devices.length === 0 ? (
              <div className="text-sm text-ink-400 py-4 text-center">{t("fleet.noDevices")}</div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-sm text-ink-400 py-4 text-center">No devices match your search</div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 border border-ink-400/10 rounded p-2">
                {filteredDevices.map((d) => (
                  <label
                    key={d.imei}
                    className="flex items-center gap-3 p-2 rounded hover:bg-ink-900/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignedImeis.has(d.imei)}
                      onChange={() => toggleDevice(d.imei)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-50 truncate">
                        {d.name || d.vehiclePlate || d.imei}
                      </div>
                      <div className="text-xs text-ink-400 truncate">
                        {d.vehiclePlate && <span className="mr-2">{d.vehiclePlate}</span>}
                        <span className="font-mono">{d.imei}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        d.status === "ONLINE"
                          ? "bg-alarm-green/20 text-alarm-green"
                          : "bg-ink-400/20 text-ink-400"
                      }`}
                    >
                      {d.status}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="text-xs text-ink-400 mt-2">
              {assignedImeis.size} / {devices.length} {t("users.deviceCount")}
            </div>
          </div>
        )}

        {error && <div className="text-xs text-alarm-red mb-3">{error}</div>}

        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
