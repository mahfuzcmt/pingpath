"use client";

import { useState, useMemo } from "react";
import type { DeviceGroupView, DeviceView } from "@/types/domain";

// Icon definitions matching DeviceGroupModal
const GROUP_ICONS: Record<string, string> = {
  folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  truck: "M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM5 8h10a2 2 0 012 2v5H3V10a2 2 0 012-2z",
  motorcycle: "M5 17a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM5 15h4l2-4h4l2 4h2",
  car: "M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM3 12h18v4H3v-4zm2-4h14l2 4H3l2-4z",
  bus: "M5 17a1 1 0 100-2 1 1 0 000 2zm14 0a1 1 0 100-2 1 1 0 000 2zM4 6h16a2 2 0 012 2v8H2V8a2 2 0 012-2z",
  delivery: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z",
};

function GroupIcon({ icon, color }: { icon: string; color: string }) {
  const path = GROUP_ICONS[icon] || GROUP_ICONS.folder;
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

interface DeviceGroupAccordionProps {
  groups: DeviceGroupView[];
  devices: DeviceView[];
  selectedImei: string | null;
  expandedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onSelectDevice: (imei: string) => void;
  onEditGroup?: (group: DeviceGroupView) => void;
  onDeleteGroup?: (group: DeviceGroupView) => void;
  renderDevice: (device: DeviceView) => React.ReactNode;
}

export function DeviceGroupAccordion({
  groups,
  devices,
  selectedImei,
  expandedGroups,
  onToggleGroup,
  onSelectDevice,
  onEditGroup,
  onDeleteGroup,
  renderDevice,
}: DeviceGroupAccordionProps) {
  // Group devices by groupId
  const devicesByGroup = useMemo(() => {
    const map = new Map<string | null, DeviceView[]>();

    devices.forEach((device) => {
      const groupId = device.groupId;
      if (!map.has(groupId)) {
        map.set(groupId, []);
      }
      map.get(groupId)!.push(device);
    });

    return map;
  }, [devices]);

  // Sort groups by sortOrder
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [groups]);

  // Get ungrouped devices
  const ungroupedDevices = devicesByGroup.get(null) ?? [];

  return (
    <div className="space-y-1">
      {/* Ungrouped devices first (if any) */}
      {ungroupedDevices.length > 0 && (
        <GroupSection
          name="Ungrouped"
          color="#6B7280"
          icon="folder"
          deviceCount={ungroupedDevices.length}
          devices={ungroupedDevices}
          isExpanded={expandedGroups.has("ungrouped")}
          onToggle={() => onToggleGroup("ungrouped")}
          renderDevice={renderDevice}
          isDefault
        />
      )}

      {/* Named groups */}
      {sortedGroups.map((group) => {
        if (group.isDefault) return null; // Skip default "Ungrouped" group from backend

        const groupDevices = devicesByGroup.get(group.id) ?? [];

        return (
          <GroupSection
            key={group.id}
            name={group.name}
            color={group.color}
            icon={group.icon}
            deviceCount={groupDevices.length}
            devices={groupDevices}
            isExpanded={expandedGroups.has(group.id)}
            onToggle={() => onToggleGroup(group.id)}
            onEdit={onEditGroup ? () => onEditGroup(group) : undefined}
            onDelete={onDeleteGroup ? () => onDeleteGroup(group) : undefined}
            renderDevice={renderDevice}
          />
        );
      })}
    </div>
  );
}

interface GroupSectionProps {
  name: string;
  color: string;
  icon: string;
  deviceCount: number;
  devices: DeviceView[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  renderDevice: (device: DeviceView) => React.ReactNode;
  isDefault?: boolean;
}

function GroupSection({
  name,
  color,
  icon,
  deviceCount,
  devices,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  renderDevice,
  isDefault,
}: GroupSectionProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="rounded-lg border border-ink-100 bg-white/50 overflow-hidden">
      {/* Group header */}
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-ink-50 transition-colors"
      >
        {/* Expand/collapse icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-ink-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>

        {/* Group icon */}
        <GroupIcon icon={icon} color={color} />

        {/* Group name */}
        <span className="flex-1 font-medium text-ink-700 truncate">
          {name}
        </span>

        {/* Device count */}
        <span className="text-xs text-ink-400 bg-ink-100 px-2 py-0.5 rounded-full">
          {deviceCount}
        </span>

        {/* Edit/Delete actions (show on hover, not for default group) */}
        {!isDefault && showActions && (onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                title="Edit group"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete group"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </button>

      {/* Device list (collapsible) */}
      {isExpanded && devices.length > 0 && (
        <div className="border-t border-ink-100">
          {devices.map((device) => (
            <div key={device.imei}>
              {renderDevice(device)}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isExpanded && devices.length === 0 && (
        <div className="border-t border-ink-100 px-4 py-3 text-sm text-ink-400 italic">
          No devices in this group
        </div>
      )}
    </div>
  );
}
