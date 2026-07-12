import { Redirect, Tabs } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useI18n } from "@/i18n";
import { colors, space } from "@/theme";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

function SignOut() {
  const { signOut } = useAuth();
  const { t } = useI18n();
  return (
    <Pressable onPress={() => void signOut()} hitSlop={12} style={{ paddingHorizontal: space.md }}>
      <Text style={{ color: colors.brand, fontSize: 13, fontWeight: "600" }}>{t("auth.signOut")}</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { status } = useAuth();
  const { t } = useI18n();
  usePushNotifications(status === "authed");
  if (status === "anon") return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tab.home"), tabBarIcon: () => <TabIcon emoji="🏠" />, headerRight: () => <SignOut /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: t("tab.map"), headerShown: false, tabBarIcon: () => <TabIcon emoji="🗺️" /> }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{ title: t("tab.vehicles"), tabBarIcon: () => <TabIcon emoji="🚗" />, headerRight: () => <SignOut /> }}
      />
      <Tabs.Screen
        name="alerts"
        options={{ title: t("tab.alerts"), tabBarIcon: () => <TabIcon emoji="🔔" />, headerRight: () => <SignOut /> }}
      />
    </Tabs>
  );
}
