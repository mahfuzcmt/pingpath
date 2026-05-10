"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { useLocale, type StringKey } from "@/lib/i18n";
import { useSession } from "@/lib/session-context";
import { LanguageToggle } from "./LanguageToggle";
import type { UserView } from "@/types/domain";

interface NavItem {
  href: string;
  label: StringKey;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: <DashboardIcon /> },
  { href: "/dashboard/devices", label: "nav.devices", icon: <DeviceIcon /> },
  { href: "/dashboard/geofences", label: "nav.geofences", icon: <GeofenceIcon /> },
  { href: "/dashboard/trips", label: "nav.trips", icon: <TripsIcon /> },
  { href: "/dashboard/alarms", label: "nav.alarms", icon: <AlarmIcon /> },
  { href: "/dashboard/reports", label: "nav.reports", icon: <ReportIcon /> },
  { href: "/dashboard/audit-log", label: "nav.auditLog", icon: <AuditIcon />, adminOnly: true },
  { href: "/dashboard/settings", label: "nav.settings", icon: <SettingsIcon /> },
];

export function Topbar({ user, orgId }: { user: UserView; orgId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const { role } = useSession();
  const isAdmin = role === "ORG_ADMIN" || role === "SUPER_ADMIN";
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  async function onSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-9 shrink-0 items-stretch border-b border-surface-300 bg-white">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex h-full items-center gap-2 border-r border-surface-300 px-4 font-semibold tracking-tight text-ink-900"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
        <span className="text-sm">PingPath</span>
      </Link>

      {/* Primary nav */}
      <nav className="flex items-stretch">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "topnav-item-active" : "topnav-item"}
              title={t(item.label)}
            >
              <span className="text-ink-500">{item.icon}</span>
              <span className="hidden md:inline">{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right side: lang + user + logout */}
      <div className="ml-auto flex items-center gap-1 pr-3">
        <LanguageToggle />
        <div className="mx-2 h-5 w-px bg-surface-300" />
        <div className="text-right text-[11px] leading-tight" title={orgId}>
          <div className="font-semibold text-ink-900">{user.fullName ?? user.email}</div>
          <div className="text-ink-500">{user.role.replace("_", " ")}</div>
        </div>
        <button type="button" onClick={onSignOut} className="btn-ghost ml-2" title={t("auth.signOut")}>
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
}

/* ── Icons ─────────────────────────────────────────────────────── */
const ICON_PROPS = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function DashboardIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}
function DeviceIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="6" width="13" height="12" rx="1" />
      <path d="M16 10h3l2 2v4h-5" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}
function GeofenceIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function TripsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5 18c4-8 10-8 14 0" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  );
}
function AlarmIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3V8Z" />
      <path d="M10 19a2 2 0 1 0 4 0" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h6" />
    </svg>
  );
}
function AuditIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5 4h14v16H5z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
