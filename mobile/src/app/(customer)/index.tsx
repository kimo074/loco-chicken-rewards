import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { LocoCoin } from "@/components/LocoCoin";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { ChickenMood, randomMood } from "@/components/ChickenMood";
import { GlossyButton } from "@/components/GlossyButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { fetchRewards } from "@/api/rewards";

const MOOD_CHANGE_INTERVAL_MS = 20 * 1000;

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "customerHome.greetingMorning";
  if (hour < 18) return "customerHome.greetingAfternoon";
  return "customerHome.greetingEvening";
}

export default function CustomerHome() {
  const { t } = useTranslation();
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
      <LanguageSwitcher style={styles.languageSwitcher} />
      <ThemedView style={styles.greetingRow}>
        <ChickenMood mood={mood} size={30} />
        <ThemedText type="small" style={styles.greetingText}>
          {t(greetingKey()).toUpperCase()}
        </ThemedText>
      </ThemedView>
      <ThemedText type="title" style={[styles.name, styles.nameColor]}>
        {session.customer.name} 👋
      </ThemedText>
      <ThemedText type="small" style={[styles.note, styles.noteBold]}>
        {t("customerHome.note")}
      </ThemedText>

      <ThemedView style={styles.balanceCard}>
        <LocoCoin size={40} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.balanceLabel}>
          {t("customerHome.yourBalance")}
        </ThemedText>
        <ThemedText style={styles.balance}>{balance}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t("customerHome.coins")}
        </ThemedText>
      </ThemedView>

      {nextReward ? (
        <ThemedView style={styles.progressCard}>
          <ThemedText type="smallBold" style={styles.progressCardText}>
            {t("customerHome.coinsTo", { count: nextReward.costCoins - balance, reward: nextReward.name })}
          </ThemedText>
          <ThemedView style={styles.progressTrack} type="background">
            <ThemedView style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
          </ThemedView>
        </ThemedView>
      ) : data && data.length > 0 ? (
        <ThemedView style={styles.progressCard}>
          <ThemedText type="smallBold" style={styles.progressCardText}>
            {t("customerHome.redeemNow")}
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.logoutButton}>
        <GlossyButton title={t("common.logOut")} onPress={logout} />
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
  languageSwitcher: {
    position: "absolute",
    top: 56,
    right: 24,
  },
  name: {
    fontSize: 32,
  },
  nameColor: {
    color: "#3A1218",
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
    backgroundColor: "rgba(26, 18, 16, 0.9)",
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
});
