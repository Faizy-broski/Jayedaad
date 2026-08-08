import { Text, View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from './theme';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: theme.colors.surfaceAlt, text: theme.colors.muted },
  success: { bg: '#DCFCE7', text: '#166534' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  destructive: { bg: theme.colors.dangerBg, text: theme.colors.danger },
};

// RN counterpart to @jayedaad/ui-web's Badge.tsx — same variant shape,
// mirrors its "small status/role pill" role (mobile had no equivalent
// shared component at all before this pass, every screen that needed one
// hand-rolled its own pill styles).
export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const colors = VARIANT_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
