import { ActivityIndicator, Pressable, StyleSheet, PressableProps } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type ButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

const ACCENT = "#D6241F";

export function Button({ title, variant = "primary", loading, disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === "primary" ? ACCENT : variant === "danger" ? "#C4392B" : theme.backgroundElement;
  const textColor = variant === "secondary" ? theme.text : "#ffffff";

  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        { backgroundColor, opacity: disabled || loading ? 0.6 : state.pressed ? 0.85 : 1 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <ThemedText style={{ color: textColor, fontWeight: "700" }}>{title}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
