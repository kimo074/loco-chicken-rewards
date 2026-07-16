import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/Button";
import { LocoCoin } from "@/components/LocoCoin";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { useAuth } from "@/context/AuthContext";
import { fetchMyTransactions } from "@/api/me";
import { CoinTransaction } from "@/api/types";
import { BrandTitleStyle } from "@/constants/theme";

const TYPE_LABEL: Record<CoinTransaction["type"], string> = {
  EARN: "Earned",
  REDEEM: "Redeemed",
  ADJUSTMENT: "Refunded",
};

const TYPE_EMOJI: Partial<Record<CoinTransaction["type"], string>> = {
  REDEEM: "🎁",
  ADJUSTMENT: "🔄",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function History() {
  const { session } = useAuth();

  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => {
      if (session?.role !== "CUSTOMER") throw new Error("Not a customer session");
      return fetchMyTransactions(session.token).then((res) => res.transactions);
    },
    enabled: session?.role === "CUSTOMER",
  });

  if (session?.role !== "CUSTOMER") return null;

  return (
    <ThemedView style={styles.container}>
      <BrandBackdrop />
      <ThemedText type="title" style={[styles.title, BrandTitleStyle]}>
        Activity
      </ThemedText>
      <ThemedView style={styles.titleRule} />

      {isLoading ? (
        <ThemedText themeColor="textSecondary">Loading…</ThemedText>
      ) : error ? (
        <ThemedView style={styles.errorBox}>
          <ThemedText style={styles.error}>Could not load your activity.</ThemedText>
          <Button title="Retry" variant="secondary" onPress={() => refetch()} />
        </ThemedView>
      ) : !data || data.length === 0 ? (
        <ThemedText themeColor="textSecondary">No activity yet. Buy a meal to earn your first coins.</ThemedText>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <ThemedView style={styles.row} type="backgroundElement">
              <ThemedView style={styles.iconBadge}>
                {item.type === "EARN" ? (
                  <LocoCoin size={20} />
                ) : (
                  <ThemedText style={styles.iconEmoji}>{TYPE_EMOJI[item.type]}</ThemedText>
                )}
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.rowText}>
                <ThemedText type="smallBold">{TYPE_LABEL[item.type]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDate(item.createdAt)}
                </ThemedText>
              </ThemedView>
              <ThemedText
                type="smallBold"
                style={item.amount >= 0 ? styles.positive : styles.negative}
              >
                {item.amount >= 0 ? "+" : ""}
                {item.amount}
              </ThemedText>
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    gap: 16,
  },
  title: {
    fontSize: 32,
  },
  titleRule: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#F6B90D",
  },
  list: {
    gap: 10,
  },
  row: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(214, 36, 31, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 18,
  },
  rowText: {
    gap: 2,
    flex: 1,
  },
  errorBox: {
    gap: 12,
    alignItems: "flex-start",
  },
  error: {
    color: "#C4392B",
  },
  positive: {
    color: "#3FA34D",
  },
  negative: {
    color: "#C4392B",
  },
});
