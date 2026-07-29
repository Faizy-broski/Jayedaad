import { Pressable, Text, PressableProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from './theme';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary';
}

// RN counterpart to @jayedaad/ui-web's Button — same props/variant shape as
// the web version's brand-gradient/gold-gradient Button, using
// expo-linear-gradient (already an apps/mobile dependency) since RN's
// backgroundColor can't render a gradient string. Pressable stays the outer
// interactive/style-override wrapper so every existing call site's `style`
// prop passthrough keeps working; LinearGradient is just the visual fill.
export function Button({ label, variant = 'primary', style, disabled, ...props }: ButtonProps) {
  const gradient = variant === 'secondary' ? theme.gradients.gold : theme.gradients.primary;

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <LinearGradient colors={gradient.colors} start={gradient.start} end={gradient.end} style={styles.base}>
        <Text style={variant === 'secondary' ? styles.textSecondary : styles.text}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
  textSecondary: {
    // Gold is a light/mid tone — white text would have poor contrast, so
    // secondary uses a dark label instead (matches web's text-foreground).
    color: theme.colors.text,
    fontWeight: '600',
  },
});
