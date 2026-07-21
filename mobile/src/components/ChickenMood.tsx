import Svg, { Circle, Path, Line } from "react-native-svg";

export type Mood = "sleeping" | "awake" | "angry" | "happy" | "excited";

export const MOODS: Mood[] = ["sleeping", "awake", "angry", "happy", "excited"];

type ChickenMoodProps = {
  mood: Mood;
  size?: number;
};

const HEAD = "#FFF6E8";
const OUTLINE = "#C98F00";
const COMB = "#D6241F";
const BEAK = "#F6B90D";
const INK = "#2A1B12";

export function ChickenMood({ mood, size = 26 }: ChickenMoodProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* comb */}
      <Circle cx="38" cy="20" r="9" fill={COMB} opacity={mood === "sleeping" ? 0.6 : 1} />
      <Circle cx="50" cy="14" r="10" fill={COMB} opacity={mood === "sleeping" ? 0.6 : 1} />
      <Circle cx="62" cy="20" r="9" fill={COMB} opacity={mood === "sleeping" ? 0.6 : 1} />

      {/* head */}
      <Circle cx="50" cy="52" r="34" fill={HEAD} stroke={OUTLINE} strokeWidth="2" />

      {/* wattle */}
      <Path d="M58 76 Q62 86 56 88 Q52 86 54 76 Z" fill={COMB} />

      {/* beak */}
      {mood === "happy" || mood === "excited" ? (
        <Path d="M50 58 Q64 60 64 68 Q64 76 50 70 Z" fill={BEAK} />
      ) : (
        <Path d="M50 58 L70 62 L50 68 Z" fill={BEAK} />
      )}

      {/* eyes + brows per mood */}
      {mood === "sleeping" && (
        <>
          <Path d="M28 48 Q35 54 42 48" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <Path d="M50 48 Q57 54 64 48" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <Path d="M72 30 L78 24 M76 34 L84 30 M78 40 L86 38" stroke={OUTLINE} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {mood === "awake" && (
        <>
          <Circle cx="35" cy="48" r="5" fill={INK} />
          <Circle cx="57" cy="48" r="5" fill={INK} />
        </>
      )}

      {mood === "angry" && (
        <>
          <Circle cx="35" cy="50" r="4.5" fill={INK} />
          <Circle cx="59" cy="50" r="4.5" fill={INK} />
          <Line x1="26" y1="38" x2="40" y2="44" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <Line x1="68" y1="38" x2="54" y2="44" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}

      {mood === "happy" && (
        <>
          <Path d="M29 50 Q35 42 41 50" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <Path d="M51 50 Q57 42 63 50" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <Circle cx="26" cy="58" r="5" fill="#F6A6A6" opacity={0.6} />
          <Circle cx="70" cy="58" r="5" fill="#F6A6A6" opacity={0.6} />
        </>
      )}

      {mood === "excited" && (
        <>
          <Circle cx="35" cy="48" r="6.5" fill={INK} />
          <Circle cx="59" cy="48" r="6.5" fill={INK} />
          <Circle cx="33" cy="46" r="2" fill="#FFFFFF" />
          <Circle cx="57" cy="46" r="2" fill="#FFFFFF" />
          <Line x1="16" y1="42" x2="24" y2="38" stroke={COMB} strokeWidth="2.5" strokeLinecap="round" />
          <Line x1="16" y1="52" x2="24" y2="52" stroke={COMB} strokeWidth="2.5" strokeLinecap="round" />
          <Line x1="84" y1="42" x2="76" y2="38" stroke={COMB} strokeWidth="2.5" strokeLinecap="round" />
          <Line x1="84" y1="52" x2="76" y2="52" stroke={COMB} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

export function randomMood(exclude?: Mood): Mood {
  const options = exclude ? MOODS.filter((m) => m !== exclude) : MOODS;
  return options[Math.floor(Math.random() * options.length)];
}
