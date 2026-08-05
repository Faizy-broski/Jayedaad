import { useState } from 'react';
import { LayoutChangeEvent, Text, View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { theme } from '@jayedaad/ui-native';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: ChartPoint[];
  height?: number;
}

// Real react-native-svg line+gradient-area chart — no fake/sample data,
// callers pass real per-day figures (e.g. AgentDashboardScreen's
// dailyAnalytics.views). Renders a flat line at mid-height when every value
// is 0 (a real "no activity yet" state, not hidden or faked).
export function LineChart({ data, height = 140 }: LineChartProps) {
  const [width, setWidth] = useState(0);

  function handleLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  if (data.length === 0 || width === 0) {
    return <View style={[styles.wrap, { height }]} onLayout={handleLayout} />;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const paddingX = 8;
  const paddingTop = 12;
  const plotHeight = height - paddingTop;
  const stepX = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingTop + plotHeight * (1 - d.value / maxValue),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View>
      <View style={{ height }} onLayout={handleLayout}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="lineChartFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary} stopOpacity={0.25} />
              <Stop offset="1" stopColor={theme.colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#lineChartFill)" stroke="none" />
          <Path d={linePath} fill="none" stroke={theme.colors.primary} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      </View>
      <View style={styles.labelRow}>
        {data.map((d) => (
          <Text key={d.label} style={styles.label}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs },
  label: { fontSize: 11, color: theme.colors.muted },
});
