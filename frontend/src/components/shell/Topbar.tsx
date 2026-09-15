"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/i18n";
import { vehicleState, VEHICLE_STATE_COLOR } from "@/lib/format";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import type { DeviceView, UserView } from "@/types/domain";

/**
 * ADL-style top bar: global vehicle search on the left, brand + live pill in
 * the centre, notifications / language / user / settings on the right.
 */
export function Topbar({ user }: { user: UserView; orgId: string }) {
  const router = useRouter();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  async function onSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="z-[2100] flex h-[52px] shrink-0 items-center border-b border-gray-200 bg-white px-4">
      {/* Left: global vehicle search */}
      <div className="flex flex-1 items-center">
        <VehicleSearch />
      </div>

      {/* Center: brand + live status */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="hidden text-lg font-bold text-gray-800 md:block">
            <span className="text-[#22c55e]">Moto</span>Link
          </span>
        </Link>
        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium">Live</span>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <NotificationDropdown />
        <LanguageToggle />

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#17a2b8] to-[#117a8b] text-xs font-semibold text-white">
            {(user.fullName ?? user.email).charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 lg:block">
            {user.fullName ?? user.email.split("@")[0]}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Account menu"
            aria-expanded={showSettingsMenu}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {showSettingsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                  </svg>
                  System Configuration
                </Link>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5M21 12H9" />
                  </svg>
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Global vehicle search ─────────────────────────────────────────── */

const CACHE_TTL_MS = 60_000;
const MAX_RESULTS = 8;

function VehicleSearch() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<DeviceView[]>([]);
  const [active, setActive] = useState(0);
  const fetchedAt = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const ensureDevices = async () => {
    if (Date.now() - fetchedAt.current < CACHE_TTL_MS) return;
    fetchedAt.current = Date.now();
    try {
      const r = await api.get<DeviceView[]>("/devices");
      setDevices(r.data);
    } catch {
      fetchedAt.current = 0;
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return devices
      .filter(
        (d) =>
          d.imei.includes(needle) ||
          (d.name?.toLowerCase().includes(needle) ?? false) ||
          (d.vehiclePlate?.toLowerCase().includes(needle) ?? false) ||
          (d.simMsisdn?.includes(needle) ?? false),
      )
      .slice(0, MAX_RESULTS);
  }, [devices, q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const pick = (d: DeviceView) => {
    setOpen(false);
    setQ("");
    if (pathname === "/dashboard") {
      window.dispatchEvent(new CustomEvent("focusVehicle", { detail: d.imei }));
    } else {
      router.push(`/dashboard?focus=${encodeURIComponent(d.imei)}`);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={q}
        placeholder={t("topbar.searchVehicles")}
        onFocus={() => { setOpen(true); void ensureDevices(); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); void ensureDevices(); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" && results[active]) { e.preventDefault(); pick(results[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#17a2b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#17a2b8]/40"
        role="combobox"
        aria-expanded={open && q.trim() !== ""}
        aria-controls="topbar-vehicle-results"
        aria-autocomplete="list"
      />
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      {open && q.trim() !== "" && (
        <ul
          id="topbar-vehicle-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">{t("topbar.noResults")}</li>
          )}
          {results.map((d, i) => {
            const color = VEHICLE_STATE_COLOR[vehicleState(d)];
            return (
              <li key={d.imei} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(d)}
                  className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left ${i === active ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">
                      {d.name || d.vehiclePlate || d.imei}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-gray-500">
                      {d.vehiclePlate ? `${d.vehiclePlate} · ` : ""}{d.imei}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
