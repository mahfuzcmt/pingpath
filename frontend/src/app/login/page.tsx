"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { LanguageToggle } from "@/components/shell/LanguageToggle";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink-950">
      {/* Subtle radial gradient for the mission-control look */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,144,10,0.08),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(15,39,66,0.6),transparent_60%)]"
      />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
          MotoLink
        </div>
        <LanguageToggle />
      </header>

      <div className="relative z-0 flex min-h-screen items-center justify-center px-4">
        <div className="panel w-full max-w-md p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-semibold">{t("auth.signIn")}</h1>
          <p className="mt-1 text-sm text-ink-400">
            {t("nav.dashboard")} · {t("fleet.title")}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wide text-ink-400">
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-wide text-ink-400">
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="rounded-md border border-alarm-red/40 bg-alarm-red/10 px-3 py-2 text-sm text-alarm-red">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? t("common.loading") : t("auth.signIn")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
