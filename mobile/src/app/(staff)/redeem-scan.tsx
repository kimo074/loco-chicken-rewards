import { useState } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { WebBarcodeScanner } from "@/components/WebBarcodeScanner";
import { useAuth } from "@/context/AuthContext";
import { fulfillRedemption, FulfillResult } from "@/api/redemptions";
import { logShiftOrders } from "@/api/me";
import { ApiError } from "@/api/client";
import { STAFF_TIERS, StaffTier } from "@/lib/staffTiers";

type FulfillState = { status: "idle" } | { status: "success"; result: FulfillResult } | { status: "error"; message: string };

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
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [shortCode, setShortCode] = useState("");
  const [fulfillState, setFulfillState] = useState<FulfillState>({ status: "idle" });
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

  async function submitFulfill(identifier: { token: string } | { shortCode: string }) {
    try {
      const result = await fulfillRedemption(staffSession.token, identifier);
      setFulfillState({ status: "success", result });
    } catch (err) {
      setFulfillState({
        status: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  async function onBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    await submitFulfill({ token: result.data });
  }

  async function onWebScanned(data: string) {
    if (scanned) return;
    setScanned(true);
    await submitFulfill({ token: data });
  }

  async function onSubmitShortCode() {
    await submitFulfill({ shortCode: shortCode.trim().toUpperCase() });
  }

  function onReset() {
    setScanned(false);
    setShortCode("");
    setFulfillState({ status: "idle" });
  }

  if (fulfillState.status !== "idle") {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        {fulfillState.status === "success" ? (
          <>
            <ThemedText type="title" style={styles.resultEmoji}>
              ✅
            </ThemedText>
            <ThemedText type="subtitle">{fulfillState.result.reward.name}</ThemedText>
            <ThemedText themeColor="textSecondary">for {fulfillState.result.customer.name}</ThemedText>
          </>
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.errorTitle}>
              Couldn&apos;t fulfill
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
              {fulfillState.message}
            </ThemedText>
          </>
        )}
        <Button title="Scan next" onPress={onReset} />
      </ThemedView>
    );
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

        <ThemedText type="subtitle" style={styles.sectionHeading}>
          Customer reward pickup
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSubheading}>
          Scan or enter a customer&apos;s code to fulfill their reward.
        </ThemedText>

        {Platform.OS === "web" ? (
          <WebBarcodeScanner style={styles.camera} active={!scanned} onScanned={onWebScanned} />
        ) : permission?.granted ? (
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
          />
        ) : (
          <ThemedView style={[styles.camera, styles.centered]} type="backgroundElement">
            <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
              Camera access is needed to scan customer redemption codes.
            </ThemedText>
            <Button title="Grant camera access" onPress={requestPermission} />
          </ThemedView>
        )}

        <ThemedView style={styles.manualEntry}>
          <TextField
            label="Or enter the 6-character code"
            value={shortCode}
            onChangeText={setShortCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Button title="Fulfill" onPress={onSubmitShortCode} disabled={shortCode.trim().length < 6} />
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
  camera: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
  manualEntry: {
    gap: 12,
  },
  shiftEntry: {
    padding: 20,
    borderRadius: 16,
    gap: 10,
  },
  sectionHeading: {
    marginTop: 8,
  },
  sectionSubheading: {
    marginTop: -8,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permissionBody: {
    textAlign: "center",
    lineHeight: 22,
  },
  resultEmoji: {
    fontSize: 56,
  },
  errorTitle: {
    color: "#C4392B",
  },
});
