import { Text, View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '@jayedaad/ui-native';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

// Real react-native-svg ring chart — each segment's arc length is a real
// proportion of the real total (e.g. AgentStats.forSaleCount vs
// forRentCount), not a fixed/decorative split. Renders an even full ring
// (muted color) when every segment is 0, same "real empty state, not
// hidden" convention as LineChart/BarChart.
export function DonutChart({ segments, size = 140, strokeWidth = 18, centerLabel, centerValue }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs =
    total > 0
      ? segments
          .filter((s) => s.value > 0)
          .map((s) => {
            const length = (s.value / total) * circumference;
            const arc = { ...s, length, offset };
            offset += length;
            return arc;
          })
      : [];

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {total === 0 ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.surfaceAlt}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ) : (
            arcs.map((arc) => (
              <Circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                fill="none"
              />
            ))
          )}
        </G>
      </Svg>
      {(centerValue || centerLabel) && (
        <View style={[StyleSheet.absoluteFill, styles.centerWrap]}>
          {centerValue && <Text style={styles.centerValue}>{centerValue}</Text>}
          {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </View>
      )}
      <View style={styles.legend}>
        {segments.map((s) => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
            <Text style={styles.legendValue}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  centerWrap: { alignItems: 'center', justifyContent: 'center' },
  centerValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  centerLabel: { fontSize: 11, color: theme.colors.muted },
  legend: { marginTop: theme.spacing.md, gap: 6, alignSelf: 'stretch' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 12, color: theme.colors.muted },
  legendValue: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
});
