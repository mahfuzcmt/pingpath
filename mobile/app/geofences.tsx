import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { deleteGeofence, listGeofences } from "@/api/endpoints";
import { extractError } from "@/api/client";
import { EmptyState, Pill, PrimaryButton } from "@/ui";
import { fmtDistance } from "@/format";
import { colors, radius, space } from "@/theme";
import type { GeofenceView } from "@/types";

const NOTIFY_LABEL: Record<GeofenceView["notifyOn"], string> = {
  ENTER: "on enter",
  EXIT: "on exit",
  BOTH: "enter + exit",
};

export default function GeofencesScreen() {
  const router = useRouter();
  const [fences, setFences] = useState<GeofenceView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFences(await listGeofences());
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh whenever the screen gains focus (e.g. returning from creation).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  function confirmDelete(g: GeofenceView) {
    Alert.alert("Delete geofence?", `"${g.name}" will stop firing alerts.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteGeofence(g.id);
              await reload();
            } catch (e) {
              setError(extractError(e).message);
            }
          })();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={fences}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.brand} />}
        ListEmptyComponent={
          loading ? null : <EmptyState text="No geofences yet. Create one to get zone entry/exit alerts." />
        }
        ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.type === "CIRCLE" && item.radiusM != null
                  ? `Circle · ${fmtDistance(item.radiusM)} radius`
                  : `Polygon · ${item.polygon.length} points`}
                {"  ·  "}
                {NOTIFY_LABEL[item.notifyOn]}
              </Text>
            </View>
            <Pill
              label={item.active ? "Active" : "Off"}
              color={item.active ? colors.ok : colors.textFaint}
            />
            <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </View>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton label="New geofence" onPress={() => router.push("/geofence-new")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.md, gap: space.sm, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  rowMain: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 15, fontWeight: "700" },
  meta: { color: colors.textFaint, fontSize: 12 },
  deleteBtn: { paddingLeft: space.xs },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: "700" },
  footer: { padding: space.md },
  error: { color: colors.danger, fontSize: 13, marginBottom: space.sm },
});
