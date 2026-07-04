import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useAuth } from "@/auth/AuthContext";
import { useLiveLocations } from "@/hooks/useLiveLocations";
import { useDevices } from "@/hooks/useDevices";
import WebMap, { MapVehicle } from "@/components/WebMap";
import { motionColor, motionOf } from "@/format";
import { colors, radius, space } from "@/theme";

export default function MapScreen() {
  const { org } = useAuth();
  const orgId = org?.id ?? null;
  const router = useRouter();
  const { locations, refresh } = useLiveLocations(orgId);
  const { devices } = useDevices();
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom: number; nonce: number } | null>(null);

  const byImei = useMemo(() => new Map(devices.map((d) => [d.imei, d])), [devices]);

  const vehicles = useMemo<MapVehicle[]>(() => {
    const out: MapVehicle[] = [];
    for (const loc of locations.values()) {
      if (!loc.valid) continue;
      const d = byImei.get(loc.imei);
      const motion = d ? motionOf(d, loc) : loc.speed > 3 ? "MOVING" : "STOPPED";
      out.push({
        imei: loc.imei,
        lat: loc.latitude,
        lng: loc.longitude,
        course: loc.course,
        color: motionColor(motion),
        label: d?.vehiclePlate ?? d?.name ?? loc.imei.slice(-6),
      });
    }
    return out;
  }, [locations, byImei]);

  const locateMe = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({});
    setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 14, nonce: Date.now() });
  }, []);

  return (
    <View style={styles.fill}>
      <WebMap
        vehicles={vehicles}
        center={center}
        onSelect={(imei) => router.push({ pathname: "/device/[imei]", params: { imei } })}
      />

      <SafeAreaView edges={["top"]} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.badge}>
          <Text style={styles.badgeBrand}>MotoLink</Text>
          <Text style={styles.badgeCount}>{vehicles.length} live</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.controls} pointerEvents="box-none">
        <MapButton label="⟳" onPress={refresh} />
        <MapButton label="◎" onPress={locateMe} />
      </SafeAreaView>
    </View>
  );
}

function MapButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.7 }]}>
      <Text style={styles.mapBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "flex-start", padding: space.md },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  badgeBrand: { color: colors.text, fontWeight: "800" },
  badgeCount: { color: colors.brand, fontWeight: "600", fontSize: 12 },
  controls: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: space.md,
    gap: space.sm,
    alignItems: "flex-end",
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mapBtnText: { color: colors.text, fontSize: 22 },
});
