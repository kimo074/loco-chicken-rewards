import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export default function CustomerHome() {
  const { session, logout } = useAuth();
  if (session?.role !== "CUSTOMER") return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Welcome back,
      </ThemedText>
      <ThemedText type="title" style={styles.name}>
        {session.customer.name}
      </ThemedText>

      <ThemedView style={styles.balanceCard} type="backgroundElement">
        <ThemedText type="small" themeColor="textSecondary">
          Your balance
        </ThemedText>
        <ThemedText style={styles.balance}>{session.customer.coinBalance} coins</ThemedText>
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
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  balance: {
    fontSize: 40,
    fontWeight: "700",
  },
});
