"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, type StringKey } from "@/lib/i18n";
import {
  filterSpeed,
  formatCompactDuration,
  vehicleState,
  VEHICLE_STATE_COLOR,
  type VehicleState,
} from "@/lib/format";
import { buildVehicleSvg } from "@/lib/vehicleIcons";
import { useSpeedLimits } from "@/hooks/useSpeedLimits";
import { useTicker } from "@/hooks/useTicker";
import type { DeviceGroupView, DeviceView, LocationView } from "@/types/domain";
import type { LiveLocationView } from "@/hooks/useLiveLocations";

/**
 * ADL-style live vehicle panel: search → status tabs → sort/visibility bar →
 * grouped accordion. Checkboxes control which vehicles are drawn on the map.
 */

export type VehicleAction =
  | "playback"
  | "live"
  | "command"
  | "share"
  | "edit"
  | "details"
  | "navigate"
  | "streetview"
  | "geofence";

type Tab = "all" | "online" | "offline" | "inactive";
type SortKey = "speed" | "name" | "updated" | "status";

const OVERSPEED_COLOR = "#DC2626";
const UNGROUPED_ID = "__ungrouped";
const COLLAPSED_STORAGE_KEY = "motolink.dashboard.collapsedGroups";
const ONLINE_STATES: ReadonlySet<VehicleState> = new Set(["moving", "idle", "stopped"]);
const INACTIVE_STATES: ReadonlySet<VehicleState> = new Set(["nodata", "expired"]);
const STATE_RANK: Record<VehicleState, number> = {
  moving: 0, idle: 1, stopped: 2, offline: 3, expired: 4, nodata: 5,
};
const TAB_LABEL: Record<Tab, StringKey> = {
  all: "list.all", online: "list.online", offline: "list.offline", inactive: "list.inactive",
};
const SORT_LABEL: Record<SortKey, StringKey> = {
  speed: "list.sortSpeed", name: "list.sortName", updated: "list.sortUpdated", status: "list.sortStatus",
};

interface Row {
  device: DeviceView;
  state: VehicleState;
  speed: number;
  overspeed: boolean;
  updatedAt: number;
}

interface Section {
  id: string;
  name: string;
  color: string;
  rows: Row[];
}

interface DeviceListProps {
  devices: DeviceView[];
  groups: DeviceGroupView[];
  locations: Map<string, LocationView | LiveLocationView>;
  selectedImei: string | null;
  /** IMEIs the user unticked — these are not drawn on the map. */
  hiddenImeis: Set<string>;
  onSelect: (imei: string | null) => void;
  onHiddenChange: (next: Set<string>) => void;
  onAction: (action: VehicleAction, imei: string) => void;
}

function deviceLabel(d: DeviceView): string {
  return d.name || d.vehiclePlate || d.imei.slice(-8);
}

function tabOf(state: VehicleState): Tab {
  if (ONLINE_STATES.has(state)) return "online";
  if (INACTIVE_STATES.has(state)) return "inactive";
  return "offline";
}

function rowStatus(row: Row, t: (k: StringKey) => string): { text: string; color: string } {
  const { device, state, speed, overspeed } = row;
  switch (state) {
    case "moving":
      return { text: `${speed} km/h`, color: overspeed ? OVERSPEED_COLOR : VEHICLE_STATE_COLOR.moving };
    case "idle": {
      const d = formatCompactDuration(device.parkedSince ?? device.lastSeenAt);
      return { text: d ? `${t("veh.idle")} ${d}` : t("veh.idle"), color: VEHICLE_STATE_COLOR.idle };
    }
    case "stopped": {
      const d = formatCompactDuration(device.parkedSince ?? device.lastSeenAt);
      return { text: d || t("veh.stopped"), color: VEHICLE_STATE_COLOR.stopped };
    }
    case "offline": {
      const d = formatCompactDuration(device.lastSeenAt);
      return { text: d ? `${t("veh.offline")} ${d}` : t("veh.offline"), color: VEHICLE_STATE_COLOR.offline };
    }
    case "expired":
      return { text: t("veh.expired"), color: VEHICLE_STATE_COLOR.expired };
    default:
      return { text: t("veh.nodata"), color: VEHICLE_STATE_COLOR.nodata };
  }
}

const COMPARATORS: Record<SortKey, (a: Row, b: Row) => number> = {
  speed: (a, b) => {
    if (a.overspeed !== b.overspeed) return a.overspeed ? -1 : 1;
    if (STATE_RANK[a.state] !== STATE_RANK[b.state]) return STATE_RANK[a.state] - STATE_RANK[b.state];
    return b.speed - a.speed || b.updatedAt - a.updatedAt;
  },
  name: (a, b) => deviceLabel(a.device).localeCompare(deviceLabel(b.device)),
  updated: (a, b) => b.updatedAt - a.updatedAt,
  status: (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || b.updatedAt - a.updatedAt,
};

function readCollapsed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeCollapsed(set: Set<string>): void {
  try {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Storage may be unavailable (private mode); collapse state is a convenience only.
  }
}

export function DeviceList({
  devices,
  groups,
  locations,
  selectedImei,
  hiddenImeis,
  onSelect,
  onHiddenChange,
  onAction,
}: DeviceListProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("speed");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const speedLimits = useSpeedLimits();
  useTicker(1000); // re-render so stop durations tick

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const rows = useMemo<Row[]>(
    () =>
      devices.map((device) => {
        const live = locations.get(device.imei);
        const speed = filterSpeed(live?.speed ?? device.lastSpeed, live?.valid);
        return {
          device,
          state: vehicleState(device, live),
          speed,
          overspeed: speedLimits.isOverspeed(device.imei, live?.speed ?? device.lastSpeed),
          updatedAt: live?.ts ? Date.parse(live.ts) : device.lastSeenAt ? Date.parse(device.lastSeenAt) : 0,
        };
      }),
    [devices, locations, speedLimits],
  );

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: rows.length, online: 0, offline: 0, inactive: 0 };
    for (const r of rows) c[tabOf(r.state)]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (tab !== "all" && tabOf(r.state) !== tab) return false;
        if (!q) return true;
        const d = r.device;
        return (
          d.imei.includes(q) ||
          (d.name?.toLowerCase().includes(q) ?? false) ||
          (d.vehiclePlate?.toLowerCase().includes(q) ?? false) ||
          (d.simMsisdn?.includes(q) ?? false)
        );
      })
      .sort(COMPARATORS[sortKey]);
  }, [rows, query, tab, sortKey]);

  const sections = useMemo<Section[]>(() => {
    const byGroup = new Map<string, Row[]>();
    for (const r of filtered) {
      const key = r.device.groupId ?? UNGROUPED_ID;
      const list = byGroup.get(key);
      if (list) list.push(r);
      else byGroup.set(key, [r]);
    }
    const filtering = query.trim() !== "" || tab !== "all";
    const out: Section[] = [];
    const ungrouped = byGroup.get(UNGROUPED_ID) ?? [];
    if (ungrouped.length > 0 || !filtering) {
      out.push({ id: UNGROUPED_ID, name: t("list.ungrouped"), color: "#7E8792", rows: ungrouped });
    }
    for (const g of [...groups].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (g.isDefault) continue;
      const list = byGroup.get(g.id) ?? [];
      if (list.length === 0 && filtering) continue;
      out.push({ id: g.id, name: g.name, color: g.color, rows: list });
    }
    // Devices whose group id is unknown to the org (stale) still need a home.
    const known = new Set([UNGROUPED_ID, ...groups.map((g) => g.id)]);
    for (const [key, list] of byGroup) {
      if (!known.has(key)) out[0]?.rows.push(...list);
    }
    return out;
  }, [filtered, groups, query, tab, t]);

  const visibleFiltered = filtered.filter((r) => !hiddenImeis.has(r.device.imei)).length;
  const allVisible = filtered.length > 0 && visibleFiltered === filtered.length;
  const someVisible = visibleFiltered > 0 && !allVisible;
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisible;
  }, [someVisible]);

  const toggleAllVisible = () => {
    const next = new Set(hiddenImeis);
    if (allVisible) for (const r of filtered) next.add(r.device.imei);
    else for (const r of filtered) next.delete(r.device.imei);
    onHiddenChange(next);
  };

  const toggleVisible = (imei: string) => {
    const next = new Set(hiddenImeis);
    if (next.has(imei)) next.delete(imei);
    else next.add(imei);
    onHiddenChange(next);
  };

  const toggleGroup = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeCollapsed(next);
      return next;
    });
  };

  const tabs: Tab[] = ["all", "online", "offline", "inactive"];

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      {/* Search */}
      <div className="px-3 pb-2 pt-3">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            className="h-8 w-full rounded-md border border-surface-300 bg-white pl-8 pr-3 text-[13px] text-ink-700 placeholder:text-ink-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/40"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex border-b border-surface-300 px-2">
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-2.5 py-1.5 text-[13px] font-medium transition border-b-2 -mb-px ${
              tab === id
                ? "border-teal-500 text-teal-500"
                : "border-transparent text-ink-500 hover:text-ink-700"
            }`}
          >
            {t(TAB_LABEL[id])}
            <span className="ml-0.5 tabular-nums">({counts[id]})</span>
          </button>
        ))}
      </div>

      {/* Sort + map visibility */}
      <div className="flex items-center justify-between border-b border-surface-200 bg-surface-50 px-3 py-1.5">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="h-7 rounded border border-surface-300 bg-white px-2 text-[12px] text-ink-700 focus:border-teal-500 focus:outline-none"
          aria-label="Sort vehicles"
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <option key={k} value={k}>{t(SORT_LABEL[k])}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-500">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allVisible}
            onChange={toggleAllVisible}
            className="h-3.5 w-3.5 cursor-pointer accent-teal-500"
          />
          {t("list.showAll")}
        </label>
      </div>

      {/* Grouped vehicle list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-3 py-10 text-center text-[13px] text-ink-500">{t("veh.none")}</div>
        )}
        {sections.map((section) => {
          const isCollapsed = collapsed.has(section.id);
          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleGroup(section.id)}
                className="flex h-9 w-full items-center gap-2 border-b border-surface-200 px-3 text-left hover:bg-surface-50"
              >
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`shrink-0 text-ink-500 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: section.color }} />
                <span className="truncate text-[13px] font-semibold text-ink-700">{section.name}</span>
                <span className="text-[12px] text-ink-500 tabular-nums">({section.rows.length})</span>
              </button>
              {!isCollapsed &&
                section.rows.map((row) => (
                  <VehicleRow
                    key={row.device.imei}
                    row={row}
                    selected={row.device.imei === selectedImei}
                    visible={!hiddenImeis.has(row.device.imei)}
                    onSelect={() => onSelect(row.device.imei)}
                    onToggleVisible={() => toggleVisible(row.device.imei)}
                    onAction={(a) => onAction(a, row.device.imei)}
                    t={t}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Row ───────────────────────────────────────────────────────────── */

interface VehicleRowProps {
  row: Row;
  selected: boolean;
  visible: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onAction: (a: VehicleAction) => void;
  t: (k: StringKey) => string;
}

function VehicleRow({ row, selected, visible, onSelect, onToggleVisible, onAction, t }: VehicleRowProps) {
  const { device, state, overspeed } = row;
  const status = rowStatus(row, t);
  const iconColor = overspeed ? OVERSPEED_COLOR : VEHICLE_STATE_COLOR[state];
  const online = ONLINE_STATES.has(state);
  const icon = useMemo(() => buildVehicleSvg(device.vehicleType, iconColor, 0, 14), [device.vehicleType, iconColor]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group flex h-9 cursor-pointer items-center gap-2 border-b border-surface-200 border-l-[3px] pl-2 pr-1 transition-colors ${
        selected ? "border-l-teal-500 bg-teal-500/10" : "border-l-transparent hover:bg-surface-50"
      } ${visible ? "" : "opacity-60"}`}
    >
      <input
        type="checkbox"
        checked={visible}
        onChange={onToggleVisible}
        onClick={(e) => e.stopPropagation()}
        title={t("list.showOnMap")}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-teal-500"
      />
      <span className="inline-flex shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
      <span
        className={`min-w-0 flex-1 truncate text-[13px] ${selected ? "font-semibold text-link-hover" : "font-medium text-link"}`}
        title={device.vehiclePlate ?? device.imei}
      >
        {deviceLabel(device)}
      </span>
      <span className="shrink-0 text-[12px] font-medium tabular-nums" style={{ color: status.color }}>
        {status.text}
      </span>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: online ? "#22c55e" : "#94a3b8" }}
        title={online ? t("fleet.online") : t("fleet.offline")}
      />
      <RowMenu onAction={onAction} t={t} />
    </div>
  );
}

/* ── ⋮ menu (fixed-position so it escapes the scroll container) ───── */

const MENU_ITEMS: { action: VehicleAction; label: StringKey }[] = [
  { action: "playback", label: "act.playback" },
  { action: "live", label: "act.live" },
  { action: "command", label: "act.command" },
  { action: "share", label: "act.share" },
  { action: "details", label: "act.details" },
  { action: "edit", label: "act.edit" },
];

function RowMenu({ onAction, t }: { onAction: (a: VehicleAction) => void; t: (k: StringKey) => string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", () => setOpen(false), true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 150) });
          setOpen((v) => !v);
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-400 opacity-70 transition hover:bg-surface-200 hover:text-ink-700 group-hover:opacity-100"
        title="More"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[3000] min-w-[150px] rounded-md border border-surface-300 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {MENU_ITEMS.map((m) => (
            <button
              key={m.action}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onAction(m.action); }}
              className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-ink-700 hover:bg-surface-100"
            >
              {t(m.label)}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
