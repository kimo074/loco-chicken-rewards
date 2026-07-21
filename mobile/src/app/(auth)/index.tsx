import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { LocoCoin } from "@/components/LocoCoin";
import { BrandBackdrop } from "@/components/BrandBackdrop";

export default function Welcome() {
  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedView style={styles.hero}>
        <ThemedView style={styles.badgeGlow}>
          <LocoCoin size={112} />
        </ThemedView>
        <ThemedText style={styles.title}>Loco Chicken</ThemedText>
        <ThemedView style={styles.titleRule} />
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
          Earn coins on every meal. Redeem them for free food.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.actions}>
        <Link href="/login" asChild>
          <Button title="Log in" style={styles.primaryButton} />
        </Link>
        <Link href="/signup" asChild>
          <Button title="Create an account" variant="secondary" style={styles.glassButton} />
        </Link>
        <Link href="/staff-login" asChild>
          <Button title="I work here" variant="secondary" style={styles.glassButton} />
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 100,
    paddingBottom: 48,
  },
  hero: {
    gap: 10,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  badgeGlow: {
    marginBottom: 10,
    borderRadius: 56,
    backgroundColor: "transparent",
    shadowColor: "#D6241F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: "#D6241F",
    textAlign: "center",
    textShadowColor: "rgba(246, 185, 13, 0.55)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  titleRule: {
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F6B90D",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
    color: "#4A1B22",
    textShadowColor: "rgba(255, 255, 255, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actions: {
    gap: 12,
    backgroundColor: "transparent",
  },
  primaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  glassButton: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
});
