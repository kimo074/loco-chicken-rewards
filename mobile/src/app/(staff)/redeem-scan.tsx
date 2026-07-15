import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { logShiftOrders } from "@/api/me";
import { ApiError } from "@/api/client";
import { STAFF_TIERS, StaffTier } from "@/lib/staffTiers";

function AchievementRow({ tier, points }: { tier: StaffTier; points: number }) {
  const achieved = points >= tier.threshold;
  const remaining = tier.threshold - points;
  return (
    <ThemedView style={[styles.achievementRow, achieved && styles.achievementRowDone]} type="backgroundElement">
      <ThemedText style={styles.achievementEmoji}>{achieved ? tier.emoji : "🔒"}</ThemedText>
      <ThemedView type="backgroundElement" style={styles.achievementBody}>
        <ThemedText type="smallBold">{tier.name} Award</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {achieved
            ? `Achieved · ${tier.threshold.toLocaleString()} orders`
            : `${remaining.toLocaleString()} orders to go · ${tier.threshold.toLocaleString()} total`}
        </ThemedText>
      </ThemedView>
      {achieved ? <ThemedText style={styles.checkmark}>✅</ThemedText> : null}
    </ThemedView>
  );
}

export default function RedeemScan() {
  const { session, refreshSession } = useAuth();
  const [shiftOrders, setShiftOrders] = useState("");
  const [loggingShift, setLoggingShift] = useState(false);
  const [shiftLogMessage, setShiftLogMessage] = useState<string | null>(null);

  if (session?.role !== "STAFF") return null;
  const staffSession = session;

  async function onLogShiftOrders() {
    const orders = parseInt(shiftOrders, 10);
    if (!orders || orders < 1) return;
    setLoggingShift(true);
    setShiftLogMessage(null);
    try {
      const { points } = await logShiftOrders(staffSession.token, orders);
      setShiftLogMessage(`Added! Your total is now ${points} points.`);
      setShiftOrders("");
      await refreshSession();
    } catch (err) {
      setShiftLogMessage(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoggingShift(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Rewards
        </ThemedText>

        <ThemedView style={styles.comingSoonBanner} type="backgroundElement">
          <ThemedText style={styles.bannerEmoji}>🎁</ThemedText>
          <ThemedText type="subtitle">Coming soon</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.bannerBody}>
            Real perks for your points are on the way. Here&apos;s what you&apos;re working toward:
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.achievementList}>
          {STAFF_TIERS.map((tier) => (
            <AchievementRow key={tier.name} tier={tier} points={staffSession.staff.points} />
          ))}
        </ThemedView>

        <ThemedView style={styles.shiftEntry} type="backgroundElement">
          <ThemedText type="smallBold">Log your shift</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Add the number of orders you handled this shift to your points.
          </ThemedText>
          <TextField
            label="Orders this shift"
            value={shiftOrders}
            onChangeText={setShiftOrders}
            keyboardType="number-pad"
            placeholder="e.g. 12"
          />
          {shiftLogMessage ? <ThemedText type="small">{shiftLogMessage}</ThemedText> : null}
          <Button
            title="Add points"
            onPress={onLogShiftOrders}
            loading={loggingShift}
            disabled={!shiftOrders.trim() || parseInt(shiftOrders, 10) < 1}
          />
        </ThemedView>
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
  achievementList: {
    gap: 10,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    opacity: 0.6,
  },
  achievementRowDone: {
    opacity: 1,
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementBody: {
    flex: 1,
    gap: 2,
  },
  checkmark: {
    fontSize: 18,
  },
  shiftEntry: {
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
});
