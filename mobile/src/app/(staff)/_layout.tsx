import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

export default function StaffLayout() {
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
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="new-sale" options={{ title: "New Sale" }} />
      <Tabs.Screen name="redeem-scan" options={{ title: "Redeem" }} />
    </Tabs>
  );
}
