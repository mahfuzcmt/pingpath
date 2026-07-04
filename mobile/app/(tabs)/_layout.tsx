import { Redirect, Tabs } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors, space } from "@/theme";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

function SignOut() {
  const { signOut } = useAuth();
  return (
    <Pressable onPress={() => void signOut()} hitSlop={12} style={{ paddingHorizontal: space.md }}>
      <Text style={{ color: colors.brand, fontSize: 13, fontWeight: "600" }}>Sign out</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { status } = useAuth();
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
        options={{ title: "Home", tabBarIcon: () => <TabIcon emoji="🏠" />, headerRight: () => <SignOut /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: "Map", headerShown: false, tabBarIcon: () => <TabIcon emoji="🗺️" /> }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{ title: "Vehicles", tabBarIcon: () => <TabIcon emoji="🚗" />, headerRight: () => <SignOut /> }}
      />
      <Tabs.Screen
        name="alerts"
        options={{ title: "Alerts", tabBarIcon: () => <TabIcon emoji="🔔" />, headerRight: () => <SignOut /> }}
      />
    </Tabs>
  );
}
