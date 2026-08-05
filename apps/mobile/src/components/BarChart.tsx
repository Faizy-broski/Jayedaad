import { useState } from 'react';
import { LayoutChangeEvent, Text, View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { theme } from '@jayedaad/ui-native';
import type { ChartPoint } from './LineChart';

export interface BarChartProps {
  data: ChartPoint[];
  height?: number;
}

// Real react-native-svg rounded-rect bar chart — same ChartPoint shape as
// LineChart, real per-day figures only. A bar with value 0 still renders a
// tiny stub so the axis stays legible rather than disappearing.
export function BarChart({ data, height = 140 }: BarChartProps) {
  const [width, setWidth] = useState(0);

  function handleLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  if (data.length === 0 || width === 0) {
    return <View style={[styles.wrap, { height }]} onLayout={handleLayout} />;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const gap = 8;
  const barWidth = (width - gap * (data.length - 1)) / data.length;
  const minBarHeight = 4;

  return (
    <View>
      <View style={{ height }} onLayout={handleLayout}>
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const barHeight = Math.max(minBarHeight, (d.value / maxValue) * (height - 4));
            const x = i * (barWidth + gap);
            const y = height - barHeight;
            return (
              <Rect
                key={d.label}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 3}
                fill={theme.colors.primary}
              />
            );
          })}
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
