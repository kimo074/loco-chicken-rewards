import { useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { WebBarcodeScanner } from "@/components/WebBarcodeScanner";
import { useAuth } from "@/context/AuthContext";
import { fulfillRedemption, FulfillResult } from "@/api/redemptions";
import { ApiError } from "@/api/client";

type FulfillState = { status: "idle" } | { status: "success"; result: FulfillResult } | { status: "error"; message: string };

export default function RedeemScan() {
  const { session } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [shortCode, setShortCode] = useState("");
  const [fulfillState, setFulfillState] = useState<FulfillState>({ status: "idle" });

  if (session?.role !== "STAFF") return null;
  const staffSession = session;

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  manualEntry: {
    padding: 20,
    gap: 12,
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
