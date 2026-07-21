import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { LocoCoin } from "@/components/LocoCoin";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { ChickenMood, randomMood } from "@/components/ChickenMood";
import { useAuth } from "@/context/AuthContext";
import { fetchRewards } from "@/api/rewards";

const MOOD_CHANGE_INTERVAL_MS = 20 * 1000;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function GlossyBlackButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={(state) => [styles.glossyButton, { opacity: state.pressed ? 0.85 : 1 }]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glossy-black" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3A322C" />
            <Stop offset="12%" stopColor="#1C1712" />
            <Stop offset="100%" stopColor="#080605" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={12} fill="url(#glossy-black)" />
      </Svg>
      <ThemedText style={styles.glossyButtonText}>{title}</ThemedText>
    </Pressable>
  );
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

  const [mood, setMood] = useState(randomMood);
  useEffect(() => {
    const interval = setInterval(() => {
      setMood((current) => randomMood(current));
    }, MOOD_CHANGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedView style={styles.greetingRow}>
        <ChickenMood mood={mood} size={30} />
        <ThemedText type="small" style={styles.greetingText}>
          {greeting().toUpperCase()}
        </ThemedText>
      </ThemedView>
      <ThemedText type="title" style={styles.name}>
        {session.customer.name} 👋
      </ThemedText>
      <ThemedText type="small" style={[styles.note, styles.noteBold]}>
        Remember to ask a staff member at the counter to add your points after you pay.
      </ThemedText>

      <ThemedView style={styles.balanceCard}>
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
        <ThemedView style={styles.progressCard}>
          <ThemedText type="smallBold" style={styles.progressCardText}>
            {nextReward.costCoins - balance} coins to {nextReward.name}
          </ThemedText>
          <ThemedView style={styles.progressTrack} type="background">
            <ThemedView style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
          </ThemedView>
        </ThemedView>
      ) : data && data.length > 0 ? (
        <ThemedView style={styles.progressCard}>
          <ThemedText type="smallBold" style={styles.progressCardText}>
            🎉 You can redeem any reward right now!
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.logoutButton}>
        <GlossyBlackButton title="Log out" onPress={logout} />
      </ThemedView>
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
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  greetingText: {
    fontWeight: "800",
    letterSpacing: 2,
    color: "#3A1218",
  },
  note: {
    lineHeight: 20,
  },
  noteBold: {
    fontWeight: "800",
    color: "#3A1218",
  },
  balanceCard: {
    borderRadius: 24,
    padding: 28,
    marginTop: 24,
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(36, 28, 21, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
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
    backgroundColor: "rgba(10, 8, 6, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(246, 185, 13, 0.4)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  progressCardText: {
    color: "#FFFFFF",
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
  glossyButton: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  glossyButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
