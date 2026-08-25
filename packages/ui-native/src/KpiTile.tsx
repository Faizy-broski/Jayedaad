import { Text, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent } from './Card';
import { theme } from './theme';

export interface KpiTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  sub?: string;
  style?: ViewStyle;
}

// RN counterpart to @jayedaad/ui-web's KpiCard — no equivalent existed in
// this package before Phase 4 of the CRM maturity build-out needed one for
// PipelineScreen.tsx's summary tiles (Open Pipeline Value/Forecasted
// Revenue/Win-Loss). Same icon-badge + label + value + sub shape, built on
// the existing Card/CardContent primitive rather than a new surface.
export function KpiTile({ icon, label, value, sub, style }: KpiTileProps) {
  return (
    <Card style={style}>
      <CardContent style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing.md, gap: 2 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: { fontSize: 11, color: theme.colors.muted },
  value: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  sub: { fontSize: 10, color: theme.colors.muted },
});
