import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { useDevices } from "@/hooks/useDevices";
import { useLiveLocations } from "@/hooks/useLiveLocations";
import { Chip, EmptyState, Loading, Pill } from "@/ui";
import { fmtAgo, motionColor, motionOf } from "@/format";
import { colors, radius, space } from "@/theme";
import type { DeviceView, LocationView, MotionStatus } from "@/types";

type Filter = "ALL" | "MOVING" | "IDLE" | "STOPPED" | "OFFLINE";

export default function VehiclesScreen() {
  const { org } = useAuth();
  const router = useRouter();
  const { devices, loading, reload } = useDevices();
  const { locations } = useLiveLocations(org?.id ?? null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const rows = useMemo(() => {
    return devices.map((d) => {
      const loc = locations.get(d.imei) ?? null;
      return { d, loc, motion: motionOf(d, loc) };
    });
  }, [devices, locations]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: rows.length, MOVING: 0, IDLE: 0, STOPPED: 0, OFFLINE: 0 };
    for (const r of rows) c[r.motion] += 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "ALL" && r.motion !== filter) return false;
      if (!needle) return true;
      const hay = `${r.d.vehiclePlate ?? ""} ${r.d.name ?? ""} ${r.d.imei}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, filter, q]);

  if (loading && rows.length === 0) return <Loading label="Loading vehicles…" />;

  return (
    <View style={styles.screen}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search plate, name or IMEI"
        placeholderTextColor={colors.textFaint}
        style={styles.search}
      />
      <View style={styles.chips}>
        {(["ALL", "MOVING", "IDLE", "STOPPED", "OFFLINE"] as Filter[]).map((f) => (
          <Chip key={f} label={`${cap(f)} (${counts[f]})`} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.d.imei}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.brand} />}
        ListEmptyComponent={<EmptyState text="No vehicles match." />}
        renderItem={({ item }) => (
          <VehicleCard
            device={item.d}
            loc={item.loc}
            motion={item.motion}
            onPress={() => router.push({ pathname: "/device/[imei]", params: { imei: item.d.imei } })}
          />
        )}
      />
    </View>
  );
}

function VehicleCard({
  device,
  loc,
  motion,
  onPress,
}: {
  device: DeviceView;
  loc: LocationView | null;
  motion: MotionStatus;
  onPress: () => void;
}) {
  const speed = loc?.speed ?? device.lastSpeed ?? 0;
  const accOn = loc?.accOn;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardTop}>
        <Text style={styles.plate}>{device.vehiclePlate ?? device.name ?? device.imei}</Text>
        <Text style={styles.speed}>{speed} km/h</Text>
      </View>
      {device.name && device.vehiclePlate ? <Text style={styles.sub}>{device.name}</Text> : null}
      <View style={styles.pills}>
        <Pill label={cap(motion)} color={motionColor(motion)} />
        {accOn != null ? (
          <Pill label={accOn ? "Ignition ON" : "Ignition OFF"} color={accOn ? colors.ok : colors.textFaint} />
        ) : null}
      </View>
      <Text style={styles.seen}>Last seen {fmtAgo(device.lastSeenAt)}</Text>
    </Pressable>
  );
}

function cap(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    margin: space.md,
    marginBottom: space.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: colors.text,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm },
  list: { padding: space.md, paddingTop: space.xs, gap: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plate: { color: colors.text, fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
  speed: { color: colors.textDim, fontSize: 13 },
  sub: { color: colors.textFaint, fontSize: 13 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: 2 },
  seen: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
});
