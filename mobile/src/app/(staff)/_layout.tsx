import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="new-sale"
        options={{ title: "New Sale", tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="redeem-scan"
        options={{ title: "Rewards", tabBarIcon: ({ color, size }) => <Ionicons name="trophy" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
