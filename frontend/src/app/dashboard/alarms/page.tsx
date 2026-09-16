"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/session-context";
import { useAlarms } from "@/hooks/useAlarms";
import { useDevices } from "@/hooks/useDevices";
import { useExport } from "@/hooks/useExport";
import { AlarmList, type AlarmCenterFilter } from "@/components/alarm/AlarmList";

const DHAKA_OFFSET = "+06:00";

function dhakaToday(): string {
  return new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
  return new Date(Date.now() + 6 * 3600_000 - n * 86_400_000).toISOString().slice(0, 10);
}
/** Dhaka calendar day → [start, end) instants. */
function dayStart(d: string): string {
  return new Date(`${d}T00:00:00${DHAKA_OFFSET}`).toISOString();
}
function dayEndExclusive(d: string): string {
  return new Date(new Date(`${d}T00:00:00${DHAKA_OFFSET}`).getTime() + 86_400_000).toISOString();
}

/** Alarm center: filterable history with map jump and Excel export. Deep link: ?imei=…&unacked=1 */
export default function Page() {
  const { orgId } = useSession();
  const { devices } = useDevices();
  const { exportData, loading: exporting } = useExport();
  const [filter, setFilter] = useState<AlarmCenterFilter>({
    type: "",
    severity: "",
    imei: "",
    from: daysAgo(7),
    to: dhakaToday(),
    unackedOnly: false,
  });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const imei = q.get("imei");
    const unacked = q.get("unacked");
    if (imei || unacked) setFilter((f) => ({ ...f, imei: imei ?? f.imei, unackedOnly: unacked === "1" || unacked === "true" }));
  }, []);

  const query = useMemo(
    () => ({
      limit: 500,
      unackedOnly: filter.unackedOnly,
      type: filter.type || undefined,
      severity: filter.severity || undefined,
      imei: filter.imei || undefined,
      from: filter.from ? dayStart(filter.from) : undefined,
      to: filter.to ? dayEndExclusive(filter.to) : undefined,
    }),
    [filter],
  );
  const { alarms, loading, acknowledge } = useAlarms(orgId, query);

  return (
    <AlarmList
      alarms={alarms}
      loading={loading}
      devices={devices}
      filter={filter}
      onFilterChange={setFilter}
      onAcknowledge={acknowledge}
      exporting={exporting}
      onExport={() => exportData({ type: "alarms", from: filter.from, to: filter.to })}
    />
  );
}
