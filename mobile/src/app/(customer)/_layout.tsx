import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

export default function CustomerLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E85D2E",
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.backgroundSelected },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Wallet" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
      <Tabs.Screen name="rewards" options={{ title: "Rewards" }} />
      <Tabs.Screen name="history" options={{ title: "Activity" }} />
    </Tabs>
  );
}
