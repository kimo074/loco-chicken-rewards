import { useEffect } from "react";
import { ActivityIndicator, Platform } from "react-native";
import { ThemedView } from "@/components/themed-view";

// The admin panel is served by the backend; this keeps <web-app>/admin working
// for anyone who types the admin path on the customer site's address.
const ADMIN_URL = `${process.env.EXPO_PUBLIC_API_URL}/admin`;

export default function AdminRedirect() {
  useEffect(() => {
    if (Platform.OS === "web") window.location.replace(ADMIN_URL);
  }, []);

  return (
    <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </ThemedView>
  );
}
