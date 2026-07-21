import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { ThemedText } from "@/components/themed-text";

type GlossyButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function GlossyButton({ title, onPress, loading, disabled, style }: GlossyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        style,
        { opacity: disabled || loading ? 0.6 : state.pressed ? 0.85 : 1 },
      ]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glossy-black" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3A322C" />
            <Stop offset="12%" stopColor="#1C1712" />
            <Stop offset="100%" stopColor="#080605" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={12} fill="url(#glossy-black)" />
      </Svg>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.text}>{title}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
