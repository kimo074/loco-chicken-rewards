import { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { fetchRewards } from "@/api/rewards";
import { createRedemption, RedemptionResult } from "@/api/redemptions";
import { ApiError } from "@/api/client";
import { Reward } from "@/api/types";
import { useCountdown } from "@/hooks/use-countdown";

export default function Rewards() {
  const { session, refreshSession } = useAuth();
  const [activeRedemption, setActiveRedemption] = useState<RedemptionResult | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => fetchRewards().then((res) => res.rewards),
  });

  const { label: countdownLabel, expired } = useCountdown(activeRedemption?.expiresAt ?? null);

  if (session?.role !== "CUSTOMER") return null;
  const customerSession = session;

  async function onRedeem(reward: Reward) {
    if (customerSession.customer.coinBalance < reward.costCoins) return;

    Alert.alert("Redeem reward?", `This will use ${reward.costCoins} coins for "${reward.name}".`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: async () => {
          setRedeemingId(reward.id);
          try {
            const result = await createRedemption(customerSession.token, reward.id);
            setActiveRedemption(result);
            await refreshSession();
          } catch (err) {
            Alert.alert("Couldn't redeem", err instanceof ApiError ? err.message : "Please try again.");
          } finally {
            setRedeemingId(null);
          }
        },
      },
    ]);
  }

  if (activeRedemption) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.qrCard} type="backgroundElement">
          {expired ? (
            <ThemedText type="subtitle" style={styles.expiredText}>
              This code has expired
            </ThemedText>
          ) : (
            <>
              <QRCode value={activeRedemption.token} size={200} />
              <ThemedText type="title" style={styles.shortCode}>
                {activeRedemption.shortCode}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Show this to staff · expires in {countdownLabel}
              </ThemedText>
            </>
          )}
        </ThemedView>
        <ThemedText type="subtitle" style={styles.rewardName}>
          {activeRedemption.reward.name}
        </ThemedText>
        <Button title="Done" onPress={() => setActiveRedemption(null)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Rewards
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.balanceHint}>
        You have {customerSession.customer.coinBalance} coins
      </ThemedText>

      {isLoading ? (
        <ThemedText themeColor="textSecondary">Loading rewards…</ThemedText>
      ) : error ? (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.error}>Could not load rewards.</ThemedText>
          <Button title="Retry" variant="secondary" onPress={() => refetch()} />
        </ThemedView>
      ) : !data || data.length === 0 ? (
        <ThemedText themeColor="textSecondary">No rewards available right now.</ThemedText>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const affordable = customerSession.customer.coinBalance >= item.costCoins;
            return (
              <ThemedView style={styles.card} type="backgroundElement">
                <ThemedView type="backgroundElement" style={styles.cardBody}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.description}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.costCoins} coins
                  </ThemedText>
                </ThemedView>
                <Button
                  title={affordable ? "Redeem" : "Not enough coins"}
                  onPress={() => onRedeem(item)}
                  disabled={!affordable}
                  loading={redeemingId === item.id}
                />
              </ThemedView>
            );
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    gap: 8,
  },
  title: {
    fontSize: 32,
  },
  balanceHint: {
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardBody: {
    gap: 4,
  },
  errorBox: {
    gap: 12,
    alignItems: "flex-start",
  },
  error: {
    color: "#C4392B",
  },
  qrCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 280,
  },
  shortCode: {
    letterSpacing: 4,
    fontSize: 28,
  },
  expiredText: {
    color: "#C4392B",
  },
  rewardName: {
    textAlign: "center",
  },
});
