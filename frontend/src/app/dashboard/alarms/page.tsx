"use client";

import { useSession } from "@/lib/session-context";
import { useAlarms } from "@/hooks/useAlarms";
import { AlarmList } from "@/components/alarm/AlarmList";

export default function Page() {
  const { orgId } = useSession();
  const { alarms, loading, acknowledge } = useAlarms(orgId, { limit: 200 });
  return <AlarmList alarms={alarms} loading={loading} onAcknowledge={acknowledge} />;
}
