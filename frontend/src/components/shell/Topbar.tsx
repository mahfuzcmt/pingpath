"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import type { UserView } from "@/types/domain";

/**
 * ADL-style minimal top bar
 * Contains: Search, Notifications, Language, User info, Logout
 */
export function Topbar({ user, orgId }: { user: UserView; orgId: string }) {
  const router = useRouter();
  const { t } = useLocale();

  async function onSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="z-[2100] flex h-[52px] shrink-0 items-center border-b border-gray-200/80 bg-white px-4 shadow-sm">
      {/* Search bar (ADL style) */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-sm">
          <input
            type="search"
            placeholder={t("common.searchPlaceholder") || "IMEI/Device Name/SIM CardNo."}
            className="h-9 w-full rounded-md border border-gray-200 bg-gray-50/80 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#22c55e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22c55e]/20"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1.5">
        {/* Live status indicator */}
        <div className="hidden items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-medium">Live</span>
        </div>

        <div className="mx-1.5 hidden h-5 w-px bg-gray-200 sm:block" />

        <NotificationDropdown />
        <LanguageToggle />

        <div className="mx-1.5 hidden h-5 w-px bg-gray-200 sm:block" />

        {/* User info */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-xs font-semibold text-white shadow-sm">
            {(user.fullName ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="text-right text-[12px] leading-tight" title={orgId}>
            <div className="font-semibold text-gray-800">{user.fullName ?? user.email}</div>
            <div className="text-gray-500 capitalize">{user.role.replace("_", " ").toLowerCase()}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onSignOut}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title={t("auth.signOut")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
