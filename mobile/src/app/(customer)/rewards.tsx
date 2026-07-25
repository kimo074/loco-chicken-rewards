import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAudioPlayer } from "expo-audio";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      setRedeemError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
      setPendingReward(null);
    } finally {
      setRedeeming(false);
    }
  }

  if (activeRedemption) {
    return (
      <ThemedView style={styles.container}>
        <BrandBackdrop />
        <ThemedView style={styles.qrCard}>
          <ConfettiBurst burstKey={confettiKey} />
          {expired ? (
            <ThemedText type="subtitle" style={styles.expiredText}>
              {t("rewards.codeExpired")}
            </ThemedText>
          ) : (
            <>
              <QRCode value={activeRedemption.token} size={200} />
              <ThemedText type="title" style={styles.shortCode}>
                {activeRedemption.shortCode}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t("rewards.showToStaff", { time: countdownLabel })}
              </ThemedText>
            </>
          )}
        </ThemedView>
        <ThemedText type="subtitle" style={[styles.rewardName, styles.mutedInk]}>
          {rewardIcon(activeRedemption.reward)} {activeRedemption.reward.name}
        </ThemedText>
        <Button title={t("rewards.done")} onPress={() => setActiveRedemption(null)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
        {t("rewards.title")}
      </ThemedText>
      <ThemedView style={styles.titleRule} />
      <ThemedView style={styles.balancePill}>
        <LocoCoin size={16} />
        <ThemedText style={styles.balancePillText}>
          {t("rewards.balanceAvailable", { count: customerSession.customer.coinBalance })}
        </ThemedText>
      </ThemedView>
      {redeemError ? <ThemedText style={styles.error}>{redeemError}</ThemedText> : null}

      {isLoading ? (
        <ThemedText style={styles.mutedInk}>{t("rewards.loading")}</ThemedText>
      ) : error ? (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.error}>{t("rewards.loadError")}</ThemedText>
          <Button title={t("common.retry")} variant="secondary" onPress={() => refetch()} style={styles.glassButton} />
        </ThemedView>
      ) : !data || data.length === 0 ? (
        <ThemedText style={styles.mutedInk}>{t("rewards.empty")}</ThemedText>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const affordable = customerSession.customer.coinBalance >= item.costCoins;
            return (
              <ThemedView style={[styles.card, !affordable && styles.cardLocked]}>
                <ThemedView style={styles.cardIconBadge}>
                  <ThemedText style={styles.cardIconEmoji}>{rewardIcon(item)}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.cardBody}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.description}
                  </ThemedText>
                  <ThemedText type="small" style={styles.cardCost}>
                    {t("rewards.costCoins", { count: item.costCoins })}
                  </ThemedText>
                </ThemedView>
                <Button
                  title={affordable ? t("rewards.redeemButton") : t("rewards.notEnough")}
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
        title={t("rewards.redeemModalTitle")}
        message={
          pendingReward
            ? t("rewards.redeemModalMessage", { cost: pendingReward.costCoins, name: pendingReward.name })
            : ""
        }
        confirmLabel={t("rewards.redeemConfirm")}
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
    backgroundColor: "rgba(36, 28, 21, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
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
    backgroundColor: "transparent",
  },
  cardCost: {
    color: "#D6241F",
    fontWeight: "700",
  },
  errorBox: {
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "transparent",
  },
  error: {
    color: "#C4392B",
  },
  mutedInk: {
    color: "#4A1B22",
  },
  glassButton: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  qrCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 280,
    backgroundColor: "rgba(36, 28, 21, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
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
