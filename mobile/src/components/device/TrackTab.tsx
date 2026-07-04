import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDeviceLive } from "@/hooks/useDeviceLive";
import { cutFuel, restoreFuel } from "@/api/endpoints";
import { extractError } from "@/api/client";
import WebMap, { MapVehicle } from "@/components/WebMap";
import { Loading, Metric, Section } from "@/ui";
import { fmtVoltage, motionColor, motionOf } from "@/format";
import { colors, radius, space } from "@/theme";

export default function TrackTab({ imei, orgId }: { imei: string; orgId: string | null }) {
  const { device, loc, loading, reloadDevice } = useDeviceLive(imei, orgId);
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom: number; nonce: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const centered = useRef(false);

  useEffect(() => {
    if (loc && !centered.current) {
      centered.current = true;
      setCenter({ lat: loc.latitude, lng: loc.longitude, zoom: 15, nonce: 1 });
    }
  }, [loc]);

  const vehicles = useMemo<MapVehicle[]>(() => {
    if (!loc || !device) return [];
    return [
      {
        imei,
        lat: loc.latitude,
        lng: loc.longitude,
        course: loc.course,
        color: motionColor(motionOf(device, loc)),
        label: device.vehiclePlate ?? device.name ?? imei.slice(-6),
      },
    ];
  }, [loc, device, imei]);

  async function runCommand(kind: "cut" | "restore") {
    setBusy(true);
    try {
      const res = kind === "cut" ? await cutFuel(imei) : await restoreFuel(imei);
      Alert.alert(res.ok ? "Command sent" : "Command failed", res.reply ?? res.error ?? "");
      if (res.ok) await reloadDevice(); // pick up the new engine_locked state
    } catch (e) {
      Alert.alert("Error", extractError(e).message);
    } finally {
      setBusy(false);
    }
  }

  function confirm(kind: "cut" | "restore") {
    const cut = kind === "cut";
    Alert.alert(
      cut ? "Cut engine?" : "Restore engine?",
      cut ? "This immobilises the vehicle immediately." : "This re-enables the engine.",
      [
        { text: "Cancel", style: "cancel" },
        { text: cut ? "Cut engine" : "Restore", style: cut ? "destructive" : "default", onPress: () => runCommand(kind) },
      ],
    );
  }

  if (loading && !device) return <Loading label="Loading device…" />;

  const speed = loc?.speed ?? device?.lastSpeed ?? 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.mapBox}>
        <WebMap vehicles={vehicles} center={center} />
        <View style={styles.speedo}>
          <Text style={styles.speedoVal}>{speed}</Text>
          <Text style={styles.speedoUnit}>km/h</Text>
        </View>
      </View>

      <Section title="Telemetry">
        <Metric label="Ignition" value={loc?.accOn == null ? "—" : loc.accOn ? "ON" : "OFF"} />
        <Metric label="GPS sats" value={loc?.satellites != null ? String(loc.satellites) : "—"} />
        <Metric label="GSM" value={device?.lastGsmSignal != null ? String(device.lastGsmSignal) : "—"} />
        <Metric label="Voltage" value={fmtVoltage(loc?.voltageMv ?? device?.lastVoltageMv)} />
        <Metric label="Course" value={loc ? `${loc.course}°` : "—"} />
        <Metric label="Fix" value={loc ? (loc.valid ? "Valid" : "Invalid") : "—"} />
      </Section>

      <Section title="Engine control">
        <View style={styles.lockRow}>
          <Text style={styles.lockLabel}>Current state</Text>
          <Text style={[styles.lockValue, { color: device?.engineLocked ? colors.danger : colors.ok }]}>
            {device?.engineLocked ? "🔒 Locked" : "Unlocked"}
          </Text>
        </View>
        <View style={styles.actions}>
          <ActionBtn label="Cut engine" tone="danger" disabled={busy} onPress={() => confirm("cut")} />
          <ActionBtn label="Restore engine" tone="ok" disabled={busy} onPress={() => confirm("restore")} />
        </View>
      </Section>
      <Text style={styles.note}>Sends GT06 DYD / HFYD to the device (default password). Reply is shown when the device answers.</Text>
    </ScrollView>
  );
}

function ActionBtn({
  label,
  tone,
  disabled,
  onPress,
}: {
  label: string;
  tone: "danger" | "ok";
  disabled?: boolean;
  onPress: () => void;
}) {
  const color = tone === "danger" ? colors.danger : colors.ok;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.action, { borderColor: color }, disabled && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { gap: space.md, paddingBottom: space.xl },
  mapBox: { height: 300, backgroundColor: colors.bg },
  speedo: {
    position: "absolute",
    right: space.md,
    top: space.md,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  speedoVal: { color: colors.text, fontSize: 24, fontWeight: "800" },
  speedoUnit: { color: colors.textFaint, fontSize: 11 },
  lockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingBottom: space.xs,
  },
  lockLabel: { color: colors.textFaint, fontSize: 12 },
  lockValue: { fontSize: 14, fontWeight: "700" },
  actions: { flexDirection: "row", gap: space.md, paddingVertical: space.sm, width: "100%" },
  action: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: { fontWeight: "700", fontSize: 14 },
  note: { color: colors.textFaint, fontSize: 11, paddingHorizontal: space.md },
});
