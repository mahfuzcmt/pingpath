import { RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { useDeviceLive } from "@/hooks/useDeviceLive";
import { useDeviceTodayStats } from "@/hooks/useDeviceTodayStats";
import { Loading, Metric, Section } from "@/ui";
import { fmtAgo, fmtDistance, fmtDuration, fmtVoltage } from "@/format";
import { colors, space } from "@/theme";

export default function StatisticsTab({ imei, orgId }: { imei: string; orgId: string | null }) {
  const { device, loc, loading } = useDeviceLive(imei, orgId);
  const { stats, loading: statsLoading, reload } = useDeviceTodayStats(imei);

  if (loading && !device) return <Loading label="Loading statistics…" />;

  const serverTime = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={statsLoading} onRefresh={reload} tintColor={colors.brand} />}
    >
      <Section title="Today (Asia/Dhaka)">
        <Metric label="Distance" value={fmtDistance(stats.distanceM)} />
        <Metric label="Trips" value={String(stats.trips)} />
        <Metric label="Max speed" value={`${stats.maxSpeed} km/h`} />
        <Metric label="Avg speed" value={`${stats.avgSpeed} km/h`} />
        <Metric label="Move time" value={fmtDuration(stats.moveS)} />
        <Metric label="Idle time" value={fmtDuration(stats.idleS)} />
      </Section>

      <Section title="Current">
        <Metric label="Speed" value={`${loc?.speed ?? device?.lastSpeed ?? 0} km/h`} />
        <Metric label="Odometer" value={fmtDistance(loc?.mileageMeters)} />
        <Metric label="Engine hrs" value={fmtDuration(device?.lastEngineHoursSeconds)} />
        <Metric
          label="Location"
          width="66%"
          value={loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : "—"}
        />
        <Metric label="Last seen" value={fmtAgo(device?.lastSeenAt)} />
      </Section>

      <Section title="Device health">
        <Metric label="Voltage" value={fmtVoltage(loc?.voltageMv ?? device?.lastVoltageMv)} />
        <Metric label="GSM" value={device?.lastGsmSignal != null ? String(device.lastGsmSignal) : "—"} />
        <Metric label="GPS sats" value={loc?.satellites != null ? String(loc.satellites) : "—"} />
        <Metric label="Status" value={device?.status ?? "—"} />
        <Metric label="Engine" value={device?.engineLocked ? "🔒 Locked" : "Unlocked"} />
      </Section>

      <Section title="Subscription">
        <Metric label="Status" value={device?.subscriptionStatus ?? "—"} />
        <Metric label="Expires" width="66%" value={fmtExpiry(device?.subscriptionExpiresAt)} />
      </Section>

      <Text style={styles.server}>Server time · {serverTime}</Text>
    </ScrollView>
  );
}

/** Format a yyyy-MM-dd expiry date with a relative "in N days" / "expired" hint. */
function fmtExpiry(date: string | null | undefined): string {
  if (!date) return "—";
  const due = new Date(`${date}T00:00:00+06:00`); // Asia/Dhaka day boundary
  if (Number.isNaN(due.getTime())) return date;
  const label = due.toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium" });
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${label} · expired`;
  if (days === 0) return `${label} · today`;
  return `${label} · in ${days}d`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  server: { color: colors.textFaint, fontSize: 11 },
});
