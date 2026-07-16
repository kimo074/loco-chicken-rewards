import Svg, { Defs, Pattern, Rect, Line } from "react-native-svg";
import { StyleSheet } from "react-native";

export function BrandBackdrop() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="brand-stripes"
          width={30}
          height={30}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <Line x1={0} y1={0} x2={0} y2={30} stroke="#F6B90D" strokeWidth={7} opacity={0.16} />
          <Line x1={0} y1={0} x2={0} y2={30} stroke="#FFE480" strokeWidth={1.5} opacity={0.65} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#brand-stripes)" />
    </Svg>
  );
}
