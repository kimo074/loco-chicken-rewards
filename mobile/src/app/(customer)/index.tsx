import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { LocoCoin } from "@/components/LocoCoin";
import { useAuth } from "@/context/AuthContext";
import { fetchRewards } from "@/api/rewards";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function CustomerHome() {
  const { session, logout } = useAuth();
  const { data } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => fetchRewards().then((res) => res.rewards),
  });

  if (session?.role !== "CUSTOMER") return null;
  const balance = session.customer.coinBalance;

  const nextReward = data
    ?.filter((r) => r.costCoins > balance)
    .sort((a, b) => a.costCoins - b.costCoins)[0];
  const progressFraction = nextReward ? Math.min(1, balance / nextReward.costCoins) : 1;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {greeting()},
      </ThemedText>
      <ThemedText type="title" style={styles.name}>
        {session.customer.name} 👋
      </ThemedText>

      <ThemedView style={styles.balanceCard} type="backgroundElement">
        <LocoCoin size={40} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.balanceLabel}>
          YOUR BALANCE
        </ThemedText>
        <ThemedText style={styles.balance}>{balance}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          coins
        </ThemedText>
      </ThemedView>

      {nextReward ? (
        <ThemedView style={styles.progressCard} type="backgroundElement">
          <ThemedText type="smallBold">
            {nextReward.costCoins - balance} coins to {nextReward.name}
          </ThemedText>
          <ThemedView style={styles.progressTrack} type="background">
            <ThemedView style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
          </ThemedView>
        </ThemedView>
      ) : data && data.length > 0 ? (
        <ThemedView style={styles.progressCard} type="backgroundElement">
          <ThemedText type="smallBold">🎉 You can redeem any reward right now!</ThemedText>
        </ThemedView>
      ) : null}

      <Button title="Log out" variant="secondary" onPress={logout} style={styles.logoutButton} />
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
    borderRadius: 24,
    padding: 28,
    marginTop: 24,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(214, 36, 31, 0.35)",
    shadowColor: "#D6241F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
  balanceLabel: {
    marginTop: 4,
    letterSpacing: 1.5,
  },
  balance: {
    fontSize: 56,
    fontWeight: "800",
    color: "#D6241F",
  },
  progressCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    gap: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#F6B90D",
  },
  logoutButton: {
    marginTop: "auto",
  },
});
