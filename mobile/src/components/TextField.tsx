import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
