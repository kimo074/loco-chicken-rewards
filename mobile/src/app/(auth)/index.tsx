import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";

export default function Welcome() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title" style={styles.title}>
          Loco Chicken
        </ThemedText>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
          Earn coins on every meal. Redeem them for free food.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.actions}>
        <Link href="/login" asChild>
          <Button title="Log in" />
        </Link>
        <Link href="/signup" asChild>
          <Button title="Create an account" variant="secondary" />
        </Link>
        <Link href="/staff-login" asChild>
          <Button title="I work here" variant="secondary" />
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
    paddingTop: 120,
    paddingBottom: 48,
  },
  hero: {
    gap: 12,
  },
  title: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  actions: {
    gap: 12,
  },
});
