"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, type StringKey } from "@/lib/i18n";
import { useSession } from "@/lib/session-context";

/**
 * ADL-style two-panel sidebar navigation
 * Left: Thin colored icon strip
 * Right: White content panel with navigation items
 */

interface NavSection {
  id: string;
  label: StringKey;
  icon: React.ReactNode;
  href?: string;
  color: string;        // Icon strip background color
  activeColor: string;  // Active state color
  children?: NavItem[];
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

interface NavItem {
  href: string;
  label: StringKey;
  icon: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "monitor",
    label: "nav.monitor",
    icon: <MonitorIcon />,
    href: "/dashboard",
    color: "#17a2b8",      // ADL teal - consistent across all
    activeColor: "#138496",
  },
  {
    id: "statistics",
    label: "nav.statistics",
    icon: <StatisticsIcon />,
    color: "#17a2b8",      // ADL teal - consistent across all
    activeColor: "#138496",
    children: [
      { href: "/dashboard/home", label: "nav.home", icon: <HomeIcon /> },
      { href: "/dashboard/reports", label: "nav.reports", icon: <ReportIcon /> },
      { href: "/dashboard/trips", label: "nav.trips", icon: <TripsIcon /> },
    ],
  },
  {
    id: "manage",
    label: "nav.manage",
    icon: <ManageIcon />,
    color: "#17a2b8",      // ADL teal - consistent across all
    activeColor: "#138496",
    children: [
      { href: "/dashboard/devices", label: "nav.vehicles", icon: <DeviceIcon /> },
      { href: "/dashboard/drivers", label: "nav.drivers", icon: <DriverIcon /> },
      { href: "/dashboard/geofences", label: "nav.geofences", icon: <GeofenceIcon /> },
      { href: "/dashboard/alarms", label: "nav.alarms", icon: <AlarmIcon /> },
      { href: "/dashboard/rules", label: "nav.rules", icon: <RulesIcon /> },
      { href: "/dashboard/scheduled", label: "nav.scheduled", icon: <ScheduledIcon /> },
      { href: "/dashboard/settings", label: "nav.settings", icon: <SettingsIcon /> },
      { href: "/dashboard/audit-log", label: "nav.auditLog", icon: <AuditIcon />, adminOnly: true },
    ],
  },
  {
    id: "customer",
    label: "nav.customer",
    icon: <CustomerIcon />,
    href: "/dashboard/admin",
    color: "#17a2b8",      // ADL teal - consistent across all
    activeColor: "#138496",
    superAdminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { role } = useSession();
  const isAdmin = role === "ORG_ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  // Which section is selected in the icon strip
  const [activeSection, setActiveSection] = useState<string>("monitor");
  // Track expanded sections in the content panel
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["monitor"]));
  // Collapsed state (icon-only mode)
  const [collapsed, setCollapsed] = useState(false);

  // Auto-select section based on active route
  useEffect(() => {
    for (const section of NAV_SECTIONS) {
      if (section.href && isActive(section.href)) {
        setActiveSection(section.id);
        break;
      }
      if (section.children) {
        const hasActiveChild = section.children.some((item) =>
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
        );
        if (hasActiveChild) {
          setActiveSection(section.id);
          setExpandedSections((prev) => new Set([...prev, section.id]));
          break;
        }
      }
    }
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const filterItems = (items: NavItem[] | undefined) =>
    items?.filter((item) => {
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (item.adminOnly && !isAdmin) return false;
      return true;
    }) ?? [];

  const filterSections = (sections: NavSection[]) =>
    sections.filter((section) => {
      if (section.superAdminOnly && !isSuperAdmin) return false;
      if (section.adminOnly && !isAdmin) return false;
      return true;
    });

  const currentSection = NAV_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="relative z-[2000] flex h-full">
      {/* Left Icon Strip - ADL style colored icons */}
      <div className="flex w-[52px] flex-col bg-white border-r border-gray-200 shadow-sm">
        {/* Logo */}
        <div className="flex h-[56px] items-center justify-center border-b border-gray-100">
          <Link href="/dashboard">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        </div>

        {/* Icon Navigation */}
        <nav className="flex-1 flex flex-col items-center py-2 gap-1">
          {filterSections(NAV_SECTIONS).map((section) => {
            const isCurrentSection = activeSection === section.id;
            const hasActiveRoute = section.href
              ? isActive(section.href)
              : section.children?.some((c) => isActive(c.href));

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id);
                  if (section.href) {
                    window.location.href = section.href;
                  }
                }}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                  isCurrentSection || hasActiveRoute
                    ? "text-white shadow-md"
                    : "text-[#17a2b8] hover:bg-[#17a2b8]/10"
                }`}
                style={{
                  backgroundColor: isCurrentSection || hasActiveRoute ? section.color : undefined,
                }}
                title={t(section.label)}
              >
                <span className={isCurrentSection || hasActiveRoute ? "text-white" : ""}>
                  {section.icon}
                </span>
                {/* Tooltip */}
                <span className="absolute left-full ml-2 hidden whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                  {t(section.label)}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-gray-100 p-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#17a2b8] hover:bg-[#17a2b8]/10 hover:text-[#138496] mx-auto"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            >
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Content Panel - White with navigation items */}
      {!collapsed && (
        <div className="w-[180px] flex flex-col bg-white border-r border-gray-200 shadow-sm">
          {/* Section Header */}
          <div
            className="flex h-[56px] items-center px-4 border-b border-gray-100"
            style={{
              background: `linear-gradient(135deg, ${currentSection?.color}15 0%, ${currentSection?.color}05 100%)`,
            }}
          >
            <span
              className="text-[14px] font-semibold"
              style={{ color: currentSection?.color }}
            >
              {currentSection ? t(currentSection.label) : ""}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-2">
            {currentSection?.href ? (
              // Direct link section
              <Link
                href={currentSection.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${
                  isActive(currentSection.href)
                    ? "text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                style={{
                  backgroundColor: isActive(currentSection.href) ? currentSection.color : undefined,
                }}
              >
                <span>{currentSection.icon}</span>
                <span>{t(currentSection.label)}</span>
              </Link>
            ) : (
              // Section with children
              <div className="space-y-1">
                {filterItems(currentSection?.children).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all ${
                      isActive(item.href)
                        ? "font-medium text-white shadow-sm"
                        : "text-[#17a2b8] hover:bg-[#17a2b8]/10 hover:text-[#138496]"
                    }`}
                    style={{
                      backgroundColor: isActive(item.href) ? currentSection?.color : undefined,
                    }}
                  >
                    <span className={isActive(item.href) ? "text-white" : "text-[#17a2b8]/70"}>
                      {item.icon}
                    </span>
                    <span>{t(item.label)}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* Brand Footer */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#22c55e] to-[#16a34a]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-800">MotoLink</span>
                <span className="text-[9px] text-gray-400">GPS Tracking</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────── */
const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MonitorIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function StatisticsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function ManageIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <rect x="9.5" y="14" width="5" height="7" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <rect x="3" y="6" width="13" height="12" rx="1" />
      <path d="M16 10h3l2 2v4h-5" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

function GeofenceIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function TripsIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M5 18c4-8 10-8 14 0" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  );
}

function AlarmIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3V8Z" />
      <path d="M10 19a2 2 0 1 0 4 0" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M14 3v6h6M8 13h8M8 17h6" />
    </svg>
  );
}

function RulesIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ScheduledIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <path d="M5 4h14v16H5z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg {...ICON_PROPS} width="16" height="16">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}
