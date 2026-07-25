import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { logShiftOrders } from "@/api/me";
import { ApiError } from "@/api/client";
import { STAFF_TIERS, getStaffTierProgress } from "@/lib/staffTiers";

export default function RedeemScan() {
  const { t } = useTranslation();
  const { session, refreshSession } = useAuth();
  const [shiftOrders, setShiftOrders] = useState("");
  const [loggingShift, setLoggingShift] = useState(false);
  const [shiftLogMessage, setShiftLogMessage] = useState<string | null>(null);

  if (session?.role !== "STAFF") return null;
  const staffSession = session;
  const points = staffSession.staff.points ?? 0;

  const { current, next } = getStaffTierProgress(points);
  const previousThreshold = current?.threshold ?? 0;
  const progressFraction = next ? Math.min(1, Math.max(0, (points - previousThreshold) / (next.threshold - previousThreshold))) : 1;
  const nextIndex = next ? STAFF_TIERS.findIndex((tier) => tier.name === next.name) : -1;
  const afterNext = nextIndex >= 0 && nextIndex + 1 < STAFF_TIERS.length ? STAFF_TIERS[nextIndex + 1] : null;

  async function onLogShiftOrders() {
    const orders = parseInt(shiftOrders, 10);
    if (!orders || orders < 1) return;
    setLoggingShift(true);
    setShiftLogMessage(null);
    try {
      const { points } = await logShiftOrders(staffSession.token, orders);
      setShiftLogMessage(t("redeemScan.addedPoints", { points }));
      setShiftOrders("");
      await refreshSession();
    } catch (err) {
      setShiftLogMessage(err instanceof ApiError ? err.message : t("common.somethingWrong"));
    } finally {
      setLoggingShift(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          {t("redeemScan.title")}
        </ThemedText>

        <ThemedView style={styles.comingSoonBanner} type="backgroundElement">
          <ThemedText style={styles.bannerEmoji}>🎁</ThemedText>
          <ThemedText type="subtitle">{t("redeemScan.comingSoon")}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.bannerBody}>
            {t("redeemScan.comingSoonBody")}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.shiftEntry} type="backgroundElement">
          <ThemedText type="smallBold">{t("redeemScan.logShift")}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t("redeemScan.logShiftBody")}
          </ThemedText>
          <TextField
            label={t("redeemScan.ordersLabel")}
            value={shiftOrders}
            onChangeText={setShiftOrders}
            keyboardType="number-pad"
            placeholder={t("redeemScan.ordersPlaceholder")}
          />
          {shiftLogMessage ? <ThemedText type="small">{shiftLogMessage}</ThemedText> : null}
          <Button
            title={t("redeemScan.addPoints")}
            onPress={onLogShiftOrders}
            loading={loggingShift}
            disabled={!shiftOrders.trim() || parseInt(shiftOrders, 10) < 1}
          />
        </ThemedView>

        {next ? (
          <ThemedView style={styles.progressCard} type="backgroundElement">
            <ThemedText style={styles.progressEmoji}>{next.emoji}</ThemedText>
            <ThemedText type="subtitle">{t("staffHome.award", { name: t(next.nameKey) })}</ThemedText>
            <ThemedView style={styles.progressTrack} type="backgroundElement">
              <ThemedView style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {t("redeemScan.ordersProgress", {
                points: points.toLocaleString(),
                threshold: next.threshold.toLocaleString(),
                remaining: (next.threshold - points).toLocaleString(),
              })}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.progressCard} type="backgroundElement">
            <ThemedText style={styles.progressEmoji}>🏆</ThemedText>
            <ThemedText type="subtitle">{t("redeemScan.masterAchieved")}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t("redeemScan.reachedHighest")}
            </ThemedText>
          </ThemedView>
        )}

        {afterNext ? (
          <ThemedView style={styles.lockedCard} type="backgroundElement">
            <ThemedText style={styles.lockedEmoji}>{afterNext.emoji}</ThemedText>
            <ThemedText type="subtitle">{t("staffHome.award", { name: t(afterNext.nameKey) })}</ThemedText>
            <ThemedView style={styles.lockedBadge}>
              <ThemedText type="small" style={styles.lockedBadgeText}>
                {t("redeemScan.lockedComingSoon")}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 70,
    gap: 12,
  },
  title: {
    fontSize: 32,
    marginBottom: 4,
  },
  comingSoonBanner: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  bannerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  bannerBody: {
    textAlign: "center",
    lineHeight: 20,
  },
  shiftEntry: {
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
  progressCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  progressEmoji: {
    fontSize: 32,
  },
  progressTrack: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(128,128,128,0.25)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#F6B90D",
  },
  lockedCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    opacity: 0.5,
  },
  lockedEmoji: {
    fontSize: 32,
  },
  lockedBadge: {
    backgroundColor: "rgba(128,128,128,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lockedBadgeText: {
    letterSpacing: 0.5,
  },
});
