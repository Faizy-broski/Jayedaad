import { Pressable, Text, PressableProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from './theme';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary';
  // "lg": tall, fully-rounded pill (photo-background auth screens). "sm":
  // shorter pill for screens stacking several action buttons together
  // (e.g. Post Listing's Add Features/Save as Draft/Submit row) where the
  // default md height reads as too heavy. Omit for the existing compact
  // rounded-rectangle size everywhere else.
  size?: 'sm' | 'md' | 'lg';
}

// RN counterpart to @jayedaad/ui-web's Button — same props/variant shape as
// the web version's brand-gradient/gold-gradient Button, using
// expo-linear-gradient (already an apps/mobile dependency) since RN's
// backgroundColor can't render a gradient string. Pressable stays the outer
// interactive/style-override wrapper so every existing call site's `style`
// prop passthrough keeps working; LinearGradient is just the visual fill.
export function Button({ label, variant = 'primary', size = 'md', style, disabled, ...props }: ButtonProps) {
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
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={[styles.base, size === 'lg' && styles.baseLg, size === 'sm' && styles.baseSm]}
      >
        <Text style={variant === 'secondary' ? styles.textSecondary : styles.text}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // Fully rounded (RN caps effective radius at height/2, so 999 always
    // yields a pill/stadium shape regardless of size) — was theme.radius.sm
    // (6px), which read as a flat rectangle everywhere the default size was
    // used instead of size="lg". minHeight:48 is the standard minimum
    // touch-target size — paddingVertical:10 alone landed under that.
    borderRadius: 999,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseLg: {
    borderRadius: 999,
    minHeight: 48,
    paddingVertical: theme.spacing.lg,
  },
  baseSm: {
    minHeight: 38,
    paddingVertical: 6,
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
