"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useSession } from "@/lib/session-context";
import { OrgInfoTab } from "@/components/settings/OrgInfoTab";
import { UsersTab } from "@/components/settings/UsersTab";

type Tab = "org" | "users";

export default function Page() {
  const { t } = useLocale();
  const { role } = useSession();
  const isAdmin = role === "ORG_ADMIN" || role === "SUPER_ADMIN";
  const [tab, setTab] = useState<Tab>("org");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-ink-400/15 px-4 py-3">
        <h1 className="font-display text-lg font-semibold">{t("settings.title")}</h1>
        <div className="ml-auto flex gap-1 rounded-md border border-ink-400/20 p-0.5 text-sm">
          <TabButton active={tab === "org"} onClick={() => setTab("org")}>
            {t("settings.tab.org")}
          </TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>
            {t("settings.tab.users")}
          </TabButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "org" && <OrgInfoTab readOnly={!isAdmin} />}
        {tab === "users" && <UsersTab canManage={isAdmin} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1 transition ${
        active
          ? "bg-brand-500/15 text-brand-500"
          : "text-ink-400 hover:text-ink-50"
      }`}
    >
      {children}
    </button>
  );
}
