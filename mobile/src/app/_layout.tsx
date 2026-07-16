import { Stack } from "expo-router";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemedView } from "@/components/themed-view";

const queryClient = new QueryClient();

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={session?.role === "CUSTOMER"}>
        <Stack.Screen name="(customer)" />
      </Stack.Protected>
      <Stack.Protected guard={session?.role === "STAFF"}>
        <Stack.Screen name="(staff)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={DarkTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
