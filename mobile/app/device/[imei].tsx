import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import TrackTab from "@/components/device/TrackTab";
import HistoryTab from "@/components/device/HistoryTab";
import StatisticsTab from "@/components/device/StatisticsTab";
import { EmptyState } from "@/ui";
import { colors, space } from "@/theme";

type Tab = "track" | "history" | "stats";
const TABS: { key: Tab; label: string }[] = [
  { key: "track", label: "Track" },
  { key: "history", label: "History" },
  { key: "stats", label: "Statistics" },
];

export default function DeviceScreen() {
  const { imei } = useLocalSearchParams<{ imei: string }>();
  const { org } = useAuth();
  const [tab, setTab] = useState<Tab>("track");
  const orgId = org?.id ?? null;

  if (!imei) return <EmptyState text="No device selected." />;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerTitle: imei.slice(-8) }} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        {tab === "track" && <TrackTab imei={imei} orgId={orgId} />}
        {tab === "history" && <HistoryTab imei={imei} />}
        {tab === "stats" && <StatisticsTab imei={imei} orgId={orgId} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: space.md,
  },
  tab: { paddingVertical: space.md, marginRight: space.lg, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.brand },
  tabText: { color: colors.textFaint, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: colors.text },
  body: { flex: 1 },
});
