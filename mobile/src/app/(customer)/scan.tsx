import { useState } from "react";
import { StyleSheet } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { claimSale } from "@/api/sales";
import { ApiError } from "@/api/client";

type ClaimState = { status: "idle" } | { status: "success"; coinsAwarded: number } | { status: "error"; message: string };

export default function ScanToEarn() {
  const { session, refreshSession } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [claimState, setClaimState] = useState<ClaimState>({ status: "idle" });

  if (session?.role !== "CUSTOMER") return null;
  const customerSession = session;

  async function onBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    try {
      const { coinsAwarded } = await claimSale(customerSession.token, result.data);
      setClaimState({ status: "success", coinsAwarded });
      await refreshSession();
    } catch (err) {
      setClaimState({
        status: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  function onScanAgain() {
    setScanned(false);
    setClaimState({ status: "idle" });
  }

  if (!permission) {
    return <ThemedView style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText type="subtitle" style={styles.permissionTitle}>
          Camera access needed
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
          We use your camera to scan the code shown at the register so we can add your coins.
        </ThemedText>
        <Button title="Grant camera access" onPress={requestPermission} />
      </ThemedView>
    );
  }

  if (claimState.status !== "idle") {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        {claimState.status === "success" ? (
          <>
            <ThemedText type="title" style={styles.resultEmoji}>
              🎉
            </ThemedText>
            <ThemedText type="subtitle">+{claimState.coinsAwarded} coins</ThemedText>
            <ThemedText themeColor="textSecondary">Added to your balance</ThemedText>
          </>
        ) : (
          <>
            <ThemedText type="subtitle" style={styles.errorTitle}>
              Couldn&apos;t add coins
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.permissionBody}>
              {claimState.message}
            </ThemedText>
          </>
        )}
        <Button title="Scan again" onPress={onScanAgain} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      />
      <ThemedView style={styles.hint}>
        <ThemedText themeColor="textSecondary">Point your camera at the code on the register</ThemedText>
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
  hint: {
    padding: 20,
    alignItems: "center",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    textAlign: "center",
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
