import { useState } from "react";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { BrandTitleStyle } from "@/constants/theme";

export default function Login() {
  const { loginAsCustomer } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await loginAsCustomer({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
        Log in
      </ThemedText>

      <ThemedView style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        {error ? (
          <ThemedText themeColor="text" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <Button title="Log in" onPress={onSubmit} loading={loading} disabled={!email || !password} />
      </ThemedView>

      <Link href="/signup">
        <ThemedText type="link" themeColor="textSecondary">
          Don&apos;t have an account? Sign up
        </ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
    gap: 32,
  },
  title: {
    fontSize: 32,
  },
  form: {
    gap: 16,
    backgroundColor: "transparent",
  },
  error: {
    color: "#C4392B",
  },
});
