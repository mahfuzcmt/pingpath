import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/auth/AuthContext";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen
            name="device/[imei]"
            options={{
              headerShown: true,
              headerTitle: "Vehicle",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="geofences"
            options={{
              headerShown: true,
              headerTitle: "Geofences",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
          <Stack.Screen
            name="geofence-new"
            options={{
              headerShown: true,
              headerTitle: "New geofence",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
            }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
