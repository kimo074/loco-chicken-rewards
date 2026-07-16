import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Path, Ellipse } from "react-native-svg";

type LocoCoinProps = {
  size?: number;
};

export function LocoCoin({ size = 24 }: LocoCoinProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="loco-coin-rim" x1="15%" y1="10%" x2="85%" y2="95%">
          <Stop offset="0%" stopColor="#FFD84D" />
          <Stop offset="100%" stopColor="#9A6E00" />
        </LinearGradient>
        <RadialGradient id="loco-coin-face" cx="36%" cy="30%" r="75%">
          <Stop offset="0%" stopColor="#FFE58A" />
          <Stop offset="55%" stopColor="#F6B90D" />
          <Stop offset="100%" stopColor="#C98F00" />
        </RadialGradient>
      </Defs>

      <Circle cx="50" cy="50" r="48" fill="url(#loco-coin-rim)" />
      <Circle cx="50" cy="50" r="41" fill="url(#loco-coin-face)" />
      <Circle cx="50" cy="50" r="41" fill="none" stroke="#9A6E00" strokeWidth="1.5" opacity={0.5} />
      <Circle cx="50" cy="50" r="35" fill="none" stroke="#FFE58A" strokeWidth="1" opacity={0.5} />

      {/* Comb */}
      <Circle cx="35.5" cy="42" r="4.4" fill="#B3160F" />
      <Circle cx="43" cy="36.5" r="5.4" fill="#B3160F" />
      <Circle cx="50.5" cy="40" r="4.6" fill="#B3160F" />
      {/* Head */}
      <Circle cx="46" cy="52" r="11.5" fill="#B3160F" />
      {/* Beak */}
      <Path d="M56 48.5 L70.5 52 L56 55.5 Z" fill="#B3160F" />
      {/* Wattle */}
      <Circle cx="58.5" cy="61.5" r="4.6" fill="#B3160F" />
      {/* Eye */}
      <Circle cx="48.5" cy="49.5" r="1.8" fill="#FFF3D6" />

      <Ellipse cx="38" cy="30" rx="16" ry="9" fill="#FFFFFF" opacity={0.2} />
    </Svg>
  );
}
