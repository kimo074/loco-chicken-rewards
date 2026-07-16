import Svg, { Defs, Pattern, Rect, Line } from "react-native-svg";
import { StyleSheet } from "react-native";

export function BrandBackdrop() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="brand-stripes"
          width={26}
          height={26}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <Line x1={0} y1={0} x2={0} y2={26} stroke="rgba(243, 233, 216, 0.05)" strokeWidth={2} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-stripes)" />
    </Svg>
  );
}
