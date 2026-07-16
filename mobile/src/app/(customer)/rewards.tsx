import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAudioPlayer } from "expo-audio";
import { useQuery } from "@tanstack/react-query";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LocoCoin } from "@/components/LocoCoin";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { useAuth } from "@/context/AuthContext";
import { fetchRewards } from "@/api/rewards";
import { createRedemption, RedemptionResult } from "@/api/redemptions";
import { ApiError } from "@/api/client";
import { Reward } from "@/api/types";
import { useCountdown } from "@/hooks/use-countdown";
import { rewardIcon } from "@/lib/rewardIcon";
import { BrandTitleStyle } from "@/constants/theme";

export default function Rewards() {
  const { session, refreshSession } = useAuth();
  const [activeRedemption, setActiveRedemption] = useState<RedemptionResult | null>(null);
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const redeemSound = useAudioPlayer(require("../../../assets/sounds/redeem-cluck.wav"));

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => fetchRewards().then((res) => res.rewards),
  });

  const { label: countdownLabel, expired } = useCountdown(activeRedemption?.expiresAt ?? null);

  if (session?.role !== "CUSTOMER") return null;
  const customerSession = session;

  function onRedeem(reward: Reward) {
    if (customerSession.customer.coinBalance < reward.costCoins) return;
    setRedeemError(null);
    setPendingReward(reward);
  }

  async function confirmRedeem() {
    if (!pendingReward) return;
    // Play immediately, synchronously within the tap gesture — iOS Safari and
    // Android Chrome block audio.play() once it's past an `await`, since the
    // browser no longer considers it tied to the user's tap.
    redeemSound.seekTo(0);
    redeemSound.play();
    setRedeeming(true);
    try {
      const result = await createRedemption(customerSession.token, pendingReward.id);
      setActiveRedemption(result);
      setPendingReward(null);
      setConfettiKey((key) => key + 1);
      await refreshSession();
    } catch (err) {
      setRedeemError(err instanceof ApiError ? err.message : "Please try again.");
      setPendingReward(null);
    } finally {
      setRedeeming(false);
    }
  }

  if (activeRedemption) {
    return (
      <ThemedView style={styles.container}>
        <BrandBackdrop />
        <ThemedView style={styles.qrCard} type="backgroundElement">
          <ConfettiBurst burstKey={confettiKey} />
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
          {rewardIcon(activeRedemption.reward)} {activeRedemption.reward.name}
        </ThemedText>
        <Button title="Done" onPress={() => setActiveRedemption(null)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
        Rewards
      </ThemedText>
      <ThemedView style={styles.titleRule} />
      <ThemedView style={styles.balancePill}>
        <LocoCoin size={16} />
        <ThemedText style={styles.balancePillText}>
          {customerSession.customer.coinBalance} coins available
        </ThemedText>
      </ThemedView>
      {redeemError ? <ThemedText style={styles.error}>{redeemError}</ThemedText> : null}

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
              <ThemedView style={[styles.card, !affordable && styles.cardLocked]} type="backgroundElement">
                <ThemedView style={styles.cardIconBadge}>
                  <ThemedText style={styles.cardIconEmoji}>{rewardIcon(item)}</ThemedText>
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.cardBody}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.description}
                  </ThemedText>
                  <ThemedText type="small" style={styles.cardCost}>
                    {item.costCoins} coins
                  </ThemedText>
                </ThemedView>
                <Button
                  title={affordable ? "Redeem" : "Not enough coins"}
                  onPress={() => onRedeem(item)}
                  disabled={!affordable}
                />
              </ThemedView>
            );
          }}
        />
      )}

      <ConfirmModal
        visible={pendingReward !== null}
        title="Redeem reward?"
        message={pendingReward ? `This will use ${pendingReward.costCoins} coins for "${pendingReward.name}".` : ""}
        confirmLabel="Redeem"
        onConfirm={confirmRedeem}
        onCancel={() => setPendingReward(null)}
        confirming={redeeming}
      />
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
  titleRule: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F6B90D",
    marginBottom: 4,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(214, 36, 31, 0.12)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  balancePillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D6241F",
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardLocked: {
    opacity: 0.55,
  },
  cardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(246, 185, 13, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconEmoji: {
    fontSize: 20,
  },
  cardBody: {
    gap: 4,
  },
  cardCost: {
    color: "#D6241F",
    fontWeight: "700",
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
    borderWidth: 1,
    borderColor: "rgba(214, 36, 31, 0.35)",
    shadowColor: "#D6241F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
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
