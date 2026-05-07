"use client";

import { useState } from "react";
import { useLocale, type StringKey } from "@/lib/i18n";
import { useUsers } from "@/hooks/useUsers";
import { useSession } from "@/lib/session-context";
import { formatDateTime } from "@/lib/format";
import { extractError } from "@/lib/api";
import type { UserCreate, UserDetail, UserRole, UserUpdate } from "@/types/domain";

const ROLES: UserRole[] = ["ORG_ADMIN", "ORG_USER"];

export function UsersTab({ canManage }: { canManage: boolean }) {
  const { t, locale } = useLocale();
  const { userId: selfId } = useSession();
  const { users, loading, error, create, update, disable } = useUsers();
  const [editing, setEditing] = useState<UserDetail | "new" | null>(null);

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
            <th className="px-3 py-2">{t("users.lastLogin")}</th>
            <th className="px-3 py-2">{t("users.status")}</th>
            <th className="px-3 py-2 text-right" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const roleKey = `users.role.${u.role}` as StringKey;
            return (
              <tr key={u.id} className="border-b border-ink-400/10 hover:bg-ink-900/30">
                <td className="px-3 py-2">
                  <div className="font-medium text-ink-50">{u.email}</div>
                  {u.phone && <div className="text-xs text-ink-400">{u.phone}</div>}
                </td>
                <td className="px-3 py-2 text-ink-100">{u.fullName ?? "—"}</td>
                <td className="px-3 py-2 text-ink-100">{t(roleKey)}</td>
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
