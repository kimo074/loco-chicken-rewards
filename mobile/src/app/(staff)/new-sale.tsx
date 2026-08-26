import { useState } from "react";
import { StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { GlossyButton } from "@/components/GlossyButton";
import { useAuth } from "@/context/AuthContext";
import { createSale, SaleCode } from "@/api/sales";
import { ApiError } from "@/api/client";
import { useCountdown } from "@/hooks/use-countdown";
import { recognizeReceiptTotal } from "@/lib/receiptOcr";

function eurosToCents(input: string): number | null {
  const normalized = input.replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(parseFloat(normalized) * 100);
  return cents > 0 ? cents : null;
}

export default function NewSale() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saleCode, setSaleCode] = useState<SaleCode | null>(null);

  const { label: countdownLabel, expired } = useCountdown(saleCode?.expiresAt ?? null);

  if (session?.role !== "STAFF") return null;
  const staffSession = session;

  async function onCreateSale() {
    const amountCents = eurosToCents(amount);
    if (!amountCents) {
      setError(t("newSale.invalidAmount"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const created = await createSale(staffSession.token, amountCents);
      setSaleCode(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
    } finally {
      setLoading(false);
    }
  }

  async function onScanReceipt() {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(t("newSale.cameraPermission"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (result.canceled || !result.assets[0]?.base64) return;

    setScanning(true);
    try {
      const mediaType = result.assets[0].mimeType === "image/png" ? "image/png" : "image/jpeg";
      const amountCents = await recognizeReceiptTotal(result.assets[0].base64, mediaType);
      if (amountCents) {
        setAmount((amountCents / 100).toFixed(2));
      } else {
        setError(t("newSale.couldNotReadAmount"));
      }
    } catch {
      setError(t("newSale.couldNotScan"));
    } finally {
      setScanning(false);
    }
  }

  function onReset() {
    setSaleCode(null);
    setAmount("");
    setError(null);
  }

  if (saleCode) {
    return (
      <ThemedView style={styles.container}>
        <BrandBackdrop />
        <ThemedView style={styles.qrCard}>
          {expired ? (
            <ThemedText type="subtitle" style={styles.expiredText}>
              {t("rewards.codeExpired")}
            </ThemedText>
          ) : (
            <>
              <QRCode value={saleCode.token} size={220} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.expiresIn}>
                {t("newSale.expiresIn", { time: countdownLabel })}
              </ThemedText>
            </>
          )}
        </ThemedView>

        <ThemedView style={styles.summary}>
          <ThemedText type="subtitle">€{(saleCode.amountCents / 100).toFixed(2)}</ThemedText>
          <ThemedText style={styles.mutedInk}>
            {t("newSale.coinsForCustomer", { count: saleCode.coinsAwarded })}
          </ThemedText>
        </ThemedView>

        <Button title={t("newSale.startAnother")} onPress={onReset} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, styles.mutedInk]}>
        {t("newSale.title")}
      </ThemedText>
      <ThemedText style={styles.mutedInk}>{t("newSale.body")}</ThemedText>

      <TextField
        label={t("newSale.amountLabel")}
        labelStyle={styles.mutedInk}
        style={styles.glassInput}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <GlossyButton title={t("newSale.takePicture")} onPress={onScanReceipt} loading={scanning} />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <Button title={t("newSale.generateCode")} onPress={onCreateSale} loading={loading} disabled={!amount} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    gap: 20,
  },
  title: {
    fontSize: 32,
  },
  mutedInk: {
    color: "#3A1218",
  },
  glassInput: {
    backgroundColor: "rgba(26, 18, 16, 0.9)",
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  error: {
    color: "#C4392B",
  },
  qrCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    minHeight: 280,
    backgroundColor: "rgba(26, 18, 16, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  expiresIn: {
    marginTop: 4,
  },
  expiredText: {
    color: "#C4392B",
  },
  summary: {
    alignItems: "center",
    gap: 4,
  },
});
