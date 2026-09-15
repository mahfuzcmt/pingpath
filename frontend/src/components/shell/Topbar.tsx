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
    <header className="z-[2100] flex h-[50px] shrink-0 items-center border-b border-gray-200 bg-white px-4">
      {/* Search bar (ADL style) */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <input
            type="search"
            placeholder={t("common.searchPlaceholder") || "IMEI/Device Name/SIM CardNo."}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#0421bc] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0421bc]/30"
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
      <div className="flex items-center gap-2">
        {/* Refresh countdown placeholder - can be implemented later */}
        <div className="hidden items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Refresh in <span className="font-semibold text-gray-700">9</span> seconds</span>
        </div>

        <div className="mx-2 hidden h-5 w-px bg-gray-200 sm:block" />

        <NotificationDropdown />
        <LanguageToggle />

        <div className="mx-2 hidden h-5 w-px bg-gray-200 sm:block" />

        {/* User info */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0421bc] text-xs font-semibold text-white">
            {(user.fullName ?? user.email).charAt(0).toUpperCase()}
          </div>
          <div className="text-right text-[12px] leading-tight" title={orgId}>
            <div className="font-semibold text-gray-800">{user.fullName ?? user.email}</div>
            <div className="text-gray-500">{user.role.replace("_", " ")}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onSignOut}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
