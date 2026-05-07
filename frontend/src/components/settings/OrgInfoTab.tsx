"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useOrg } from "@/hooks/useOrg";
import { extractError } from "@/lib/api";
import type { OrgUpdate } from "@/types/domain";

const TIMEZONES = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Singapore",
  "UTC",
];

export function OrgInfoTab({ readOnly }: { readOnly: boolean }) {
  const { t } = useLocale();
  const { org, loading, error, update } = useOrg();

  const [form, setForm] = useState<OrgUpdate>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!org) return;
    setForm({
      name: org.name,
      contactEmail: org.contactEmail ?? "",
      contactPhone: org.contactPhone ?? "",
      address: org.address ?? "",
      locale: org.locale,
      timezone: org.timezone,
    });
  }, [org]);

  if (loading) return <div className="text-sm text-ink-400">{t("common.loading")}</div>;
  if (error) return <div className="text-sm text-alarm-red">{error}</div>;
  if (!org) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      await update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const setField = <K extends keyof OrgUpdate>(k: K, v: OrgUpdate[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded border border-ink-400/15 bg-ink-900/40 p-3 text-xs text-ink-400">
        <div>
          <div className="uppercase">{t("settings.org.plan")}</div>
          <div className="mt-0.5 text-ink-50">{org.planTier}</div>
        </div>
        <div>
          <div className="uppercase">Slug</div>
          <div className="mt-0.5 font-mono text-ink-50">{org.slug}</div>
        </div>
      </div>

      <Field label={t("settings.org.name")}>
        <input
          type="text"
          className="input"
          value={form.name ?? ""}
          onChange={(e) => setField("name", e.target.value)}
          disabled={readOnly}
        />
      </Field>

      <Field label={t("settings.org.contactEmail")}>
        <input
          type="email"
          className="input"
          value={form.contactEmail ?? ""}
          onChange={(e) => setField("contactEmail", e.target.value)}
          disabled={readOnly}
        />
      </Field>

      <Field label={t("settings.org.contactPhone")}>
        <input
          type="tel"
          className="input"
          value={form.contactPhone ?? ""}
          onChange={(e) => setField("contactPhone", e.target.value)}
          disabled={readOnly}
        />
      </Field>

      <Field label={t("settings.org.address")}>
        <textarea
          className="input min-h-[80px]"
          value={form.address ?? ""}
          onChange={(e) => setField("address", e.target.value)}
          disabled={readOnly}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("settings.org.locale")}>
          <select
            className="input"
            value={form.locale ?? "en"}
            onChange={(e) => setField("locale", e.target.value)}
            disabled={readOnly}
          >
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
          </select>
        </Field>

        <Field label={t("settings.org.timezone")}>
          <select
            className="input"
            value={form.timezone ?? "Asia/Dhaka"}
            onChange={(e) => setField("timezone", e.target.value)}
            disabled={readOnly}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {saveError && <div className="text-xs text-alarm-red">{saveError}</div>}

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? t("common.loading") : t("common.save")}
          </button>
          {saved && <span className="text-xs text-brand-500">{t("settings.org.saved")}</span>}
        </div>
      )}
    </form>
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
