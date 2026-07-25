import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { setLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n";

const LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  de: "DE",
};

export function LanguageSwitcher({ style }: { style?: object }) {
  const { i18n } = useTranslation();
  const current = i18n.language as SupportedLanguage;

  return (
    <View style={[styles.pill, style]}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = lang === current;
        return (
          <Pressable
            key={lang}
            onPress={() => setLanguage(lang)}
            style={[styles.option, active && styles.optionActive]}
          >
            <ThemedText style={[styles.label, active && styles.labelActive]}>{LABELS[lang]}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    alignSelf: "flex-start",
  },
  option: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  optionActive: {
    backgroundColor: "#D6241F",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.65)",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
