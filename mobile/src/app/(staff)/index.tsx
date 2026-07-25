import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { getStaffTierProgress } from "@/lib/staffTiers";

export default function StaffHome() {
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  if (session?.role !== "STAFF") return null;

  const points = session.staff.points ?? 0;
  const { current, next, pointsToNext } = getStaffTierProgress(points);

  return (
    <ThemedView style={styles.container}>
      <LanguageSwitcher style={styles.languageSwitcher} />
      <ThemedText type="small" themeColor="textSecondary">
        {t("staffHome.signedInAs")}
      </ThemedText>
      <ThemedText type="title" style={styles.name}>
        {session.staff.name}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{session.staff.locationName}</ThemedText>

      <ThemedView style={styles.pointsCard} type="backgroundElement">
        <ThemedText type="small" themeColor="textSecondary">
          {t("staffHome.yourPoints")}
        </ThemedText>
        <ThemedText type="title" style={styles.pointsValue}>
          {points}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t("staffHome.pointsPerOrder")}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.tierCard} type="backgroundElement">
        {current ? (
          <>
            <ThemedText style={styles.tierEmoji}>{current.emoji}</ThemedText>
            <ThemedText type="subtitle">{t("staffHome.award", { name: t(current.nameKey) })}</ThemedText>
          </>
        ) : (
          <ThemedText type="subtitle" themeColor="textSecondary">
            {t("staffHome.noAwardYet")}
          </ThemedText>
        )}
        {next ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.tierProgress}>
            {t("staffHome.ordersToNext", { count: pointsToNext, emoji: next.emoji, name: t(next.nameKey) })}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.tierProgress}>
            {t("staffHome.highestAward")}
          </ThemedText>
        )}
      </ThemedView>

      <Button title={t("common.logOut")} variant="secondary" onPress={logout} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
    gap: 12,
  },
  languageSwitcher: {
    position: "absolute",
    top: 56,
    right: 24,
  },
  name: {
    fontSize: 32,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  pointsValue: {
    fontSize: 40,
  },
  tierCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  tierEmoji: {
    fontSize: 40,
  },
  tierProgress: {
    marginTop: 4,
  },
});
