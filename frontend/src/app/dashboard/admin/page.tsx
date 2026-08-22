"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useAdminStats, useAdminOrgs, useAdminDevices } from "@/hooks/useAdminData";
import type { OrgAdminView, OrgCreate, DeviceAdminView } from "@/types/domain";
import { formatRelative } from "@/lib/format";

type Tab = "orgs" | "devices";

export default function AdminPage() {
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("orgs");

  const { stats, loading: statsLoading } = useAdminStats();

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-50">
      {/* Header */}
      <div className="shrink-0 border-b border-surface-300 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-ink-900">Super Admin Panel</h1>
        <p className="text-xs text-ink-500">Manage organizations and device assignments</p>
      </div>

      {/* Stats Bar */}
      <div className="shrink-0 border-b border-surface-300 bg-white px-4 py-2">
        <div className="flex flex-wrap items-center gap-6">
          <StatCard
            label="Organizations"
            value={stats?.totalOrgs ?? 0}
            sub={`${stats?.activeOrgs ?? 0} active`}
            loading={statsLoading}
          />
          <StatCard
            label="Devices"
            value={stats?.totalDevices ?? 0}
            sub={`${stats?.onlineDevices ?? 0} online`}
            loading={statsLoading}
          />
          <StatCard
            label="Users"
            value={stats?.totalUsers ?? 0}
            loading={statsLoading}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-surface-300 bg-white px-4">
        <div className="flex gap-4">
          <TabButton
            active={activeTab === "orgs"}
            onClick={() => setActiveTab("orgs")}
          >
            Organizations
          </TabButton>
          <TabButton
            active={activeTab === "devices"}
            onClick={() => setActiveTab("devices")}
          >
            Devices
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "orgs" && <OrgsTab />}
        {activeTab === "devices" && <DevicesTab />}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: number;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <span className="text-xl font-bold text-ink-900">
        {loading ? "..." : value}
      </span>
      {sub && <span className="text-[10px] text-ink-400">{sub}</span>}
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
      className={`border-b-2 px-2 py-2 text-sm font-medium transition ${
        active
          ? "border-brand-500 text-brand-600"
          : "border-transparent text-ink-500 hover:text-ink-700"
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Organizations Tab
// ─────────────────────────────────────────────────────────────

function OrgsTab() {
  const { orgs, loading, error, createOrg, updateOrgStatus } = useAdminOrgs();
  const { locale } = useLocale();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<OrgCreate>({
    name: "",
    slug: "",
    planTier: "BASIC",
    contactEmail: "",
    contactPhone: "",
    address: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      await createOrg(formData);
      setShowCreate(false);
      setFormData({
        name: "",
        slug: "",
        planTier: "BASIC",
        contactEmail: "",
        contactPhone: "",
        address: "",
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (org: OrgAdminView, newStatus: string) => {
    try {
      await updateOrgStatus(org.id, newStatus);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-ink-500">Loading...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-sm text-status-stopped">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          {showCreate ? "Cancel" : "Create Organization"}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-surface-300 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-ink-900">New Organization</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  })
                }
                className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="org-slug"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Plan Tier</label>
              <select
                value={formData.planTier}
                onChange={(e) => setFormData({ ...formData, planTier: e.target.value })}
                className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          {formError && (
            <p className="mt-3 text-sm text-status-stopped">{formError}</p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Orgs Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-200 bg-surface-50">
            <tr>
              <th className="px-4 py-2 font-medium text-ink-700">Name</th>
              <th className="px-4 py-2 font-medium text-ink-700">Slug</th>
              <th className="px-4 py-2 font-medium text-ink-700">Plan</th>
              <th className="px-4 py-2 font-medium text-ink-700">Status</th>
              <th className="px-4 py-2 font-medium text-ink-700">Devices</th>
              <th className="px-4 py-2 font-medium text-ink-700">Users</th>
              <th className="px-4 py-2 font-medium text-ink-700">Created</th>
              <th className="px-4 py-2 font-medium text-ink-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-500">
                  No organizations found
                </td>
              </tr>
            )}
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-surface-100 hover:bg-surface-50">
                <td className="px-4 py-2 font-medium text-ink-900">{org.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-ink-600">{org.slug}</td>
                <td className="px-4 py-2">
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {org.planTier}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={org.status} />
                </td>
                <td className="px-4 py-2 text-ink-700">{org.deviceCount}</td>
                <td className="px-4 py-2 text-ink-700">{org.userCount}</td>
                <td className="px-4 py-2 text-xs text-ink-500">
                  {formatRelative(org.createdAt, locale)}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={org.status}
                    onChange={(e) => handleStatusChange(org, e.target.value)}
                    className="rounded border border-surface-300 px-2 py-1 text-xs"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-status-moving/15 text-status-moving",
    SUSPENDED: "bg-status-idle/15 text-status-idle",
    CANCELLED: "bg-status-stopped/15 text-status-stopped",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-surface-200 text-ink-600"}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Devices Tab
// ─────────────────────────────────────────────────────────────

function DevicesTab() {
  const { orgs } = useAdminOrgs();
  const [orgFilter, setOrgFilter] = useState<string>("");
  const { devices, loading, error, reassignDevice } = useAdminDevices(orgFilter || undefined);
  const { locale } = useLocale();
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [selectedTargetOrg, setSelectedTargetOrg] = useState<Record<string, string>>({});

  const handleReassign = async (imei: string) => {
    const targetOrgId = selectedTargetOrg[imei];
    if (!targetOrgId) return;

    setReassigning(imei);
    try {
      await reassignDevice(imei, targetOrgId);
      setSelectedTargetOrg((prev) => {
        const next = { ...prev };
        delete next[imei];
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reassign device");
    } finally {
      setReassigning(null);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-ink-500">Loading...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-sm text-status-stopped">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-ink-700">Filter by Organization:</label>
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Organizations</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Devices Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-200 bg-surface-50">
            <tr>
              <th className="px-4 py-2 font-medium text-ink-700">IMEI</th>
              <th className="px-4 py-2 font-medium text-ink-700">Name/Plate</th>
              <th className="px-4 py-2 font-medium text-ink-700">Organization</th>
              <th className="px-4 py-2 font-medium text-ink-700">Status</th>
              <th className="px-4 py-2 font-medium text-ink-700">Last Seen</th>
              <th className="px-4 py-2 font-medium text-ink-700">Reassign</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No devices found
                </td>
              </tr>
            )}
            {devices.map((device) => (
              <tr key={device.imei} className="border-b border-surface-100 hover:bg-surface-50">
                <td className="px-4 py-2 font-mono text-xs text-ink-700">{device.imei}</td>
                <td className="px-4 py-2 text-ink-900">
                  {device.name || device.vehiclePlate || "—"}
                </td>
                <td className="px-4 py-2 text-ink-700">{device.orgName}</td>
                <td className="px-4 py-2">
                  <DeviceStatusBadge status={device.status} />
                </td>
                <td className="px-4 py-2 text-xs text-ink-500">
                  {device.lastSeenAt ? formatRelative(device.lastSeenAt, locale) : "Never"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTargetOrg[device.imei] ?? ""}
                      onChange={(e) =>
                        setSelectedTargetOrg((prev) => ({
                          ...prev,
                          [device.imei]: e.target.value,
                        }))
                      }
                      className="rounded border border-surface-300 px-2 py-1 text-xs"
                    >
                      <option value="">Select org...</option>
                      {orgs
                        .filter((o) => o.id !== device.orgId)
                        .map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleReassign(device.imei)}
                      disabled={
                        !selectedTargetOrg[device.imei] || reassigning === device.imei
                      }
                      className="rounded bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {reassigning === device.imei ? "..." : "Move"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeviceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ONLINE: "bg-status-moving/15 text-status-moving",
    OFFLINE: "bg-status-offline/15 text-status-offline",
    NEVER_CONNECTED: "bg-status-nodata/15 text-status-nodata",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-surface-200 text-ink-600"}`}>
      {status}
    </span>
  );
}
