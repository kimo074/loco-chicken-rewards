import Svg, { Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect, Line } from "react-native-svg";
import { StyleSheet } from "react-native";

export function BrandBackdrop() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="brand-wash" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C93862" />
          <Stop offset="50%" stopColor="#EF6D8C" />
          <Stop offset="100%" stopColor="#F8C33B" />
        </LinearGradient>
        <RadialGradient id="brand-sheen" cx="28%" cy="10%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.3} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <Pattern
          id="brand-stripes"
          width={30}
          height={30}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <Line x1={0} y1={0} x2={0} y2={30} stroke="#17110D" strokeWidth={8} opacity={0.32} />
          <Line x1={0} y1={0} x2={0} y2={30} stroke="#FFE480" strokeWidth={1.5} opacity={0.35} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-wash)" />
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-stripes)" />
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-sheen)" />
    </Svg>
  );
}
