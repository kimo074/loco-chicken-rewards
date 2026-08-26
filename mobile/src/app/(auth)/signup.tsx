import { useState } from "react";
import { Link } from "expo-router";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/api/client";
import { BrandTitleStyle } from "@/constants/theme";

export default function Signup() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signup({ name: name.trim(), email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.somethingWrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
        {t("signup.title")}
      </ThemedText>

      <ThemedView style={styles.form}>
        <TextField
          label={t("signup.nameLabel")}
          labelStyle={styles.fieldLabel}
          value={name}
          onChangeText={setName}
          autoComplete="name"
        />
        <TextField
          label={t("signup.emailLabel")}
          labelStyle={styles.fieldLabel}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label={t("signup.passwordLabel")}
          labelStyle={styles.fieldLabel}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        {error ? (
          <ThemedText themeColor="text" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
        <Button
          title={t("signup.submit")}
          onPress={onSubmit}
          loading={loading}
          disabled={!name || !email || password.length < 8}
        />
        <ThemedText type="small" themeColor="textOnBrand" style={styles.hintText}>
          {t("signup.passwordHint")}
        </ThemedText>
      </ThemedView>

      <Link href="/login">
        <ThemedText type="link" themeColor="textOnBrand" style={styles.linkText}>
          {t("signup.haveAccount")}
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
  fieldLabel: {
    color: "#3A1218",
    fontWeight: "700",
  },
  hintText: {
    fontWeight: "600",
  },
  linkText: {
    fontWeight: "700",
  },
});
