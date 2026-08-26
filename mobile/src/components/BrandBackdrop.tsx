import Svg, { Defs, LinearGradient, RadialGradient, Stop, Pattern, Rect, Path } from "react-native-svg";
import { StyleSheet } from "react-native";

export function BrandBackdrop() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="brand-wash" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFDE4D" />
          <Stop offset="55%" stopColor="#FFD400" />
          <Stop offset="100%" stopColor="#FFC300" />
        </LinearGradient>
        <RadialGradient id="brand-sheen" cx="28%" cy="8%" r="60%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <Pattern id="flame-back" width={100} height={110} patternUnits="userSpaceOnUse">
          <Path
            d="M50,110 Q20,72 45,40 Q35,64 56,54 Q45,20 66,10 Q60,46 82,52 Q94,82 62,110 Z"
            fill="#C41220"
          />
        </Pattern>
        <Pattern id="flame-front" width={72} height={80} patternUnits="userSpaceOnUse" x={24} y={6}>
          <Path
            d="M36,80 Q14,54 33,32 Q26,50 41,44 Q34,20 50,12 Q46,38 61,42 Q68,60 47,80 Z"
            fill="#F2801E"
          />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-wash)" />
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-sheen)" />
      <Rect x={0} y="88%" width="100%" height="12%" fill="url(#flame-back)" />
      <Rect x={0} y="90%" width="100%" height="10%" fill="url(#flame-front)" />
    </Svg>
  );
}
