import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function StaffHome() {
  const { session, logout } = useAuth();
  if (session?.role !== "STAFF") return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Signed in as staff
      </ThemedText>
      <ThemedText type="title" style={styles.name}>
        {session.staff.name}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{session.staff.locationName}</ThemedText>

      <Button title="Log out" variant="secondary" onPress={logout} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
    gap: 12,
  },
  name: {
    fontSize: 32,
  },
});
