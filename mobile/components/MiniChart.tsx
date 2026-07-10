import { View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

interface Props {
  data: number[];
  color: string;
  height?: number;
}

export function MiniChart({ data, color, height = 48 }: Props) {
  if (data.length < 2) return null;
  const w = 160;
  const h = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);

  const points = data.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 8) - 4}`);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");

  const area = `M0,${h} ${line} L${w},${h} Z`;

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.3} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#chartFill)" />
        <Path d={line} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      </Svg>
    </View>
  );
}
