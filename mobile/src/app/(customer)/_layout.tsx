import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";

export default function CustomerLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#D6241F",
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: "rgba(23, 17, 13, 0.82)",
          borderTopColor: "rgba(255, 255, 255, 0.14)",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Wallet", tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="scan"
        options={{ title: "Scan", tabBarIcon: ({ color, size }) => <Ionicons name="scan" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="rewards"
        options={{ title: "Rewards", tabBarIcon: ({ color, size }) => <Ionicons name="gift" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "Activity", tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
