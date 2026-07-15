import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { getStaffTierProgress } from "@/lib/staffTiers";

export default function StaffHome() {
  const { session, logout } = useAuth();
  if (session?.role !== "STAFF") return null;

  const { current, next, pointsToNext } = getStaffTierProgress(session.staff.points);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Signed in as staff
      </ThemedText>
      <ThemedText type="title" style={styles.name}>
        {session.staff.name}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{session.staff.locationName}</ThemedText>

      <ThemedView style={styles.pointsCard} type="backgroundElement">
        <ThemedText type="small" themeColor="textSecondary">
          Your points
        </ThemedText>
        <ThemedText type="title" style={styles.pointsValue}>
          {session.staff.points}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          1 point per order · rewards coming soon
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.tierCard} type="backgroundElement">
        {current ? (
          <>
            <ThemedText style={styles.tierEmoji}>{current.emoji}</ThemedText>
            <ThemedText type="subtitle">{current.name} Award</ThemedText>
          </>
        ) : (
          <ThemedText type="subtitle" themeColor="textSecondary">
            No award yet
          </ThemedText>
        )}
        {next ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.tierProgress}>
            {pointsToNext} orders to {next.emoji} {next.name}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.tierProgress}>
            You&apos;ve reached the highest award!
          </ThemedText>
        )}
      </ThemedView>

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
  pointsCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  pointsValue: {
    fontSize: 40,
  },
  tierCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  tierEmoji: {
    fontSize: 40,
  },
  tierProgress: {
    marginTop: 4,
  },
});
