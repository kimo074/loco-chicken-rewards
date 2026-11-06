import { useCallback, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { WebBarcodeScanner } from "@/components/WebBarcodeScanner";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { useAuth } from "@/context/AuthContext";
import { fulfillRedemption, FulfillResult } from "@/api/redemptions";
import { ApiError } from "@/api/client";

type Identifier = { token: string } | { shortCode: string };

type FulfillState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: FulfillResult }
  | { status: "error"; message: string };

// Staff-side redemption: the customer shows the QR (or the 6-character code) from
// their Rewards screen, staff scans or types it, and the reward is marked as handed over.
export default function StaffRedeem() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [shortCode, setShortCode] = useState("");
  const [state, setState] = useState<FulfillState>({ status: "idle" });

  const staffToken = session?.role === "STAFF" ? session.token : null;

  const submit = useCallback(
    async (identifier: Identifier) => {
      if (!staffToken) return;
      setState({ status: "loading" });
      try {
        const result = await fulfillRedemption(staffToken, identifier);
        setState({ status: "success", result });
      } catch (err) {
        // Server messages are English only, so known statuses map to translated text.
        const knownErrors: Record<number, string> = {
          404: "staffRedeem.errNotFound",
          409: "staffRedeem.errAlreadyUsed",
          410: "staffRedeem.errExpired",
          429: "staffRedeem.errTooMany",
        };
        const knownKey = err instanceof ApiError ? knownErrors[err.status] : undefined;
        setState({
          status: "error",
          message: knownKey
            ? t(knownKey)
            : err instanceof ApiError
              ? err.message
              : t("common.somethingWrong"),
        });
      }
    },
    [staffToken, t]
  );

  const onCodeScanned = useCallback(
    (data: string) => {
      if (scanned) return;
      setScanned(true);
      submit({ token: data.trim() });
    },
    [scanned, submit]
  );

  function onNativeScanned(result: BarcodeScanningResult) {
    onCodeScanned(result.data);
  }

  function onSubmitCode() {
    submit({ shortCode: shortCode.trim().toUpperCase() });
  }

  function onScanNext() {
    setScanned(false);
    setShortCode("");
    setState({ status: "idle" });
  }

  if (!staffToken) return null;

  const nativeNeedsPermission = Platform.OS !== "web" && !permission?.granted;
  // Stop scanning while a result is showing, including after a manually typed code.
  const scannerActive = !scanned && state.status === "idle";

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.scannerArea}>
        {!isFocused ? null : Platform.OS === "web" ? (
          <WebBarcodeScanner style={styles.camera} active={scannerActive} onScanned={onCodeScanned} />
        ) : nativeNeedsPermission ? (
          <ThemedView style={[styles.camera, styles.centered]} type="backgroundElement">
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {t("scan.cameraPermissionBody")}
            </ThemedText>
            <Button title={t("scan.grantAccess")} onPress={requestPermission} />
          </ThemedView>
        ) : (
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scannerActive ? onNativeScanned : undefined}
          />
        )}
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {t("staffRedeem.pointCamera")}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.manualEntry}>
        <TextField
          label={t("staffRedeem.orEnterCode")}
          value={shortCode}
          onChangeText={setShortCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          placeholder="ABC123"
        />
        <Button
          title={t("staffRedeem.fulfill")}
          onPress={onSubmitCode}
          disabled={shortCode.trim().length < 6 || state.status === "loading"}
        />
      </ThemedView>

      {/* Result sits on top of the scanner instead of replacing it, so the camera stays
          running and staff don't have to re-grant camera access between customers. */}
      {state.status !== "idle" ? (
        <ThemedView style={[StyleSheet.absoluteFill, styles.centered]}>
          <BrandBackdrop />
          {state.status === "loading" ? (
            <ThemedText type="subtitle" style={styles.resultTitle}>
              {t("staffRedeem.checking")}
            </ThemedText>
          ) : state.status === "success" ? (
            <>
              <ThemedText type="title" style={styles.resultEmoji}>
                ✅
              </ThemedText>
              <ThemedText type="subtitle" style={[styles.resultTitle, styles.centerText]}>
                {state.result.reward.name}
              </ThemedText>
              <ThemedText style={[styles.mutedInk, styles.centerText]}>
                {t("staffRedeem.forCustomer", { name: state.result.customer.name })}
              </ThemedText>
              <ThemedText type="small" style={[styles.mutedInk, styles.centerText]}>
                {t("staffRedeem.handOver")}
              </ThemedText>
              <Button title={t("staffRedeem.scanNext")} onPress={onScanNext} />
            </>
          ) : (
            <>
              <ThemedText type="subtitle" style={[styles.errorTitle, styles.centerText]}>
                {t("staffRedeem.couldNotRedeem")}
              </ThemedText>
              <ThemedText style={[styles.mutedInk, styles.centerText]}>{state.message}</ThemedText>
              <Button title={t("staffRedeem.scanNext")} onPress={onScanNext} />
            </>
          )}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scannerArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  hint: {
    textAlign: "center",
    padding: 10,
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
  centerText: {
    textAlign: "center",
    lineHeight: 22,
  },
  mutedInk: {
    color: "#4A1B22",
  },
  resultEmoji: {
    fontSize: 56,
  },
  resultTitle: {
    color: "#3A1218",
  },
  errorTitle: {
    color: "#C4392B",
  },
});
