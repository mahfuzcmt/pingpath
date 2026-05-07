"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import type { UserView } from "@/types/domain";

export function Topbar({ user, orgId }: { user: UserView; orgId: string }) {
  const router = useRouter();
  const { t } = useLocale();

  async function onSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-400/15 bg-ink-900/40 px-4">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-base font-semibold tracking-tight">{t("fleet.title")}</h1>
        <span className="font-mono text-[11px] text-ink-400" title={orgId}>
          {orgId.slice(0, 8)}…
        </span>
      </div>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <div className="text-right text-xs leading-tight">
          <div className="text-ink-50">{user.fullName ?? user.email}</div>
          <div className="text-ink-400">{user.role}</div>
        </div>
        <button type="button" onClick={onSignOut} className="btn-ghost text-xs">
          {t("auth.signOut")}
        </button>
      </div>
    </header>
  );
}
