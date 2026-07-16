import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { logShiftOrders } from "@/api/me";
import { ApiError } from "@/api/client";
import { STAFF_TIERS, getStaffTierProgress } from "@/lib/staffTiers";

export default function RedeemScan() {
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
  const nextIndex = next ? STAFF_TIERS.findIndex((t) => t.name === next.name) : -1;
  const afterNext = nextIndex >= 0 && nextIndex + 1 < STAFF_TIERS.length ? STAFF_TIERS[nextIndex + 1] : null;

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
            Real perks for your points are on the way. You earn 1 point for every order.
          </ThemedText>
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

        {next ? (
          <ThemedView style={styles.progressCard} type="backgroundElement">
            <ThemedText style={styles.progressEmoji}>{next.emoji}</ThemedText>
            <ThemedText type="subtitle">{next.name} Award</ThemedText>
            <ThemedView style={styles.progressTrack} type="backgroundElement">
              <ThemedView style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {points.toLocaleString()} / {next.threshold.toLocaleString()} orders · {(next.threshold - points).toLocaleString()} to go
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.progressCard} type="backgroundElement">
            <ThemedText style={styles.progressEmoji}>🏆</ThemedText>
            <ThemedText type="subtitle">Master Award achieved!</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              You&apos;ve reached the highest award.
            </ThemedText>
          </ThemedView>
        )}

        {afterNext ? (
          <ThemedView style={styles.lockedCard} type="backgroundElement">
            <ThemedText style={styles.lockedEmoji}>{afterNext.emoji}</ThemedText>
            <ThemedText type="subtitle">{afterNext.name} Award</ThemedText>
            <ThemedView style={styles.lockedBadge}>
              <ThemedText type="small" style={styles.lockedBadgeText}>
                🔒 Coming soon
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
    backgroundColor: "#E85D2E",
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
