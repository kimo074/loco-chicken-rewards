import { useState } from "react";
import { StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { GlossyButton } from "@/components/GlossyButton";
import { useAuth } from "@/context/AuthContext";
import { createSale, scanReceipt, SaleCode } from "@/api/sales";
import { ApiError } from "@/api/client";
import { useCountdown } from "@/hooks/use-countdown";

function eurosToCents(input: string): number | null {
  const normalized = input.replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(parseFloat(normalized) * 100);
  return cents > 0 ? cents : null;
}

export default function NewSale() {
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
      setError("Enter a valid amount, e.g. 12.50");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const created = await createSale(staffSession.token, amountCents);
      setSaleCode(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onScanReceipt() {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera access is needed to scan a receipt.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
    if (result.canceled || !result.assets[0]?.base64) return;

    setScanning(true);
    try {
      const mediaType = result.assets[0].mimeType === "image/png" ? "image/png" : "image/jpeg";
      const { amountCents } = await scanReceipt(staffSession.token, result.assets[0].base64, mediaType);
      if (amountCents) {
        setAmount((amountCents / 100).toFixed(2));
      } else {
        setError("Couldn't read the amount from that receipt. Please enter it manually.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't scan the receipt. Please enter the amount manually.");
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
              This code has expired
            </ThemedText>
          ) : (
            <>
              <QRCode value={saleCode.token} size={220} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.expiresIn}>
                Expires in {countdownLabel}
              </ThemedText>
            </>
          )}
        </ThemedView>

        <ThemedView style={styles.summary}>
          <ThemedText type="subtitle">€{(saleCode.amountCents / 100).toFixed(2)}</ThemedText>
          <ThemedText style={styles.mutedInk}>{saleCode.coinsAwarded} coins for the customer</ThemedText>
        </ThemedView>

        <Button title="Start another sale" onPress={onReset} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={styles.title}>
        New sale
      </ThemedText>
      <ThemedText style={styles.mutedInk}>
        Enter the amount the customer paid. They'll scan the code to earn their coins.
      </ThemedText>

      <TextField
        label="Amount (€)"
        labelStyle={styles.mutedInk}
        style={styles.glassInput}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <GlossyButton title="Take a picture of the receipt" onPress={onScanReceipt} loading={scanning} />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <Button title="Generate code" onPress={onCreateSale} loading={loading} disabled={!amount} />
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
    backgroundColor: "rgba(36, 28, 21, 0.62)",
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
    backgroundColor: "rgba(36, 28, 21, 0.62)",
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
