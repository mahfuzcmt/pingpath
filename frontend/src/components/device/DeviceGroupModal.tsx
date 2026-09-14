"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import type { DeviceGroupView, DeviceGroupCreate, DeviceGroupUpdate } from "@/types/domain";

const GROUP_COLORS = [
  "#0284C7", // brand blue
  "#16A34A", // green
  "#DC2626", // red
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#0891B2", // cyan
  "#78716C", // stone
];

const GROUP_ICONS = [
  { id: "folder", label: "Folder", svg: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { id: "truck", label: "Truck", svg: "M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM5 8h10a2 2 0 012 2v5H3V10a2 2 0 012-2z" },
  { id: "motorcycle", label: "Bike", svg: "M5 17a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM5 15h4l2-4h4l2 4h2" },
  { id: "car", label: "Car", svg: "M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zM3 12h18v4H3v-4zm2-4h14l2 4H3l2-4z" },
  { id: "bus", label: "Bus", svg: "M5 17a1 1 0 100-2 1 1 0 000 2zm14 0a1 1 0 100-2 1 1 0 000 2zM4 6h16a2 2 0 012 2v8H2V8a2 2 0 012-2z" },
  { id: "delivery", label: "Delivery", svg: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" },
];

interface DeviceGroupModalProps {
  group?: DeviceGroupView;
  onSave: (data: DeviceGroupCreate | DeviceGroupUpdate) => Promise<void>;
  onClose: () => void;
}

export function DeviceGroupModal({ group, onSave, onClose }: DeviceGroupModalProps) {
  const { t } = useLocale();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [color, setColor] = useState(group?.color ?? GROUP_COLORS[0]);
  const [icon, setIcon] = useState(group?.icon ?? "folder");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave({ name: name.trim(), description: description.trim() || undefined, color, icon });
      onClose();
    } catch (err) {
      setError("Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-ink-900">
          {group ? "Edit Group" : "Create Group"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Delivery Fleet"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={saving}
            />
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-brand-500 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  disabled={saving}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {GROUP_ICONS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setIcon(i.id)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                    icon === i.id
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-ink-200 text-ink-500 hover:border-ink-300"
                  }`}
                  title={i.label}
                  disabled={saving}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={i.svg} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-ink-600 hover:bg-ink-100"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : group ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
