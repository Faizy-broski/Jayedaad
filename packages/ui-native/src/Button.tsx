import { Pressable, Text, View, PressableProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from './theme';

export interface ButtonProps extends PressableProps {
  label: string;
  // "outline" — plain bordered/transparent button (e.g. a wizard's "Back"),
  // deliberately distinct from "secondary" which is a gold gradient
  // (Save as Draft/Add Features) and would clash visually if reused there.
  // "dashed" — the dashed-border document-upload pill (Upload/Replace rows
  // in ListingDocumentsScreen/BecomeAnAgentScreen/IdentityVerificationFields/
  // PostListingScreen), previously 4 near-duplicate hand-rolled copies —
  // kept separate from "outline" rather than reusing it, since "outline"'s
  // own comment above already flags it as visually distinct on purpose.
  // "muted" — flat #F3F4F6 fill, no border/gradient: Login/Signup's
  // Google/Apple buttons (previously "secondary"'s gold gradient, which
  // reads as a branded primary CTA and clashes with third-party-auth
  // convention — those are expected to look like a neutral, secondary
  // action, not gold).
  variant?: 'primary' | 'secondary' | 'outline' | 'dashed' | 'muted';
  // Every button is now a fixed 249x35 (see `base` below) regardless of
  // size — kept in the prop type purely so existing call sites passing
  // size="sm"/"lg" don't need touching, but it no longer affects
  // width/height. Left in case a future distinct size need re-emerges.
  size?: 'sm' | 'md' | 'lg';
  // Optional leading glyph (e.g. a provider logo for "Continue with
  // Google"/"Apple" buttons) — rendered in a row before the label. Absent
  // by default so every existing call site's layout is unaffected.
  icon?: React.ReactNode;
}

// RN counterpart to @jayedaad/ui-web's Button — same props/variant shape as
// the web version's brand-gradient/gold-gradient Button, using
// expo-linear-gradient (already an apps/mobile dependency) since RN's
// backgroundColor can't render a gradient string.
//
// Sizing lives on the Pressable (not the inner surface) so a caller's
// `style` override — e.g. LoginScreen/SignupScreen's social-button
// {flex:1} row pair, AnimatedSplashScreen's {width:'100%'} — keeps winning
// over the default 249x35 exactly as before; the surface (LinearGradient
// or plain View) just fills whatever box the Pressable ends up being
// instead of sizing itself independently.
// `size` is destructured out purely to keep it off ...props (Pressable has
// no `size` prop) — no longer used for sizing, see its own comment above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Button({ label, variant = 'primary', size = 'md', icon, style, disabled, ...props }: ButtonProps) {
  const gradient = variant === 'secondary' ? theme.gradients.gold : theme.gradients.primary;
  const isFlat = variant === 'outline' || variant === 'dashed' || variant === 'muted';

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.base,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {isFlat ? (
        // No gradient at all — flat bordered/transparent/filled-neutral
        // surface. "outline" additionally flattens border/text color when
        // disabled (e.g. "Back" on a wizard's first step) rather than just
        // dimming like primary/secondary/dashed/muted do.
        <View
          style={[
            styles.surface,
            variant === 'outline' ? styles.outline : variant === 'dashed' ? styles.dashed : styles.muted,
            variant === 'outline' && disabled && styles.outlineDisabled,
          ]}
        >
          <View style={styles.content}>
            {icon}
            <Text
              style={[
                variant === 'outline' ? styles.textOutline : variant === 'dashed' ? styles.textDashed : styles.textMuted,
                variant === 'outline' && disabled && styles.textOutlineDisabled,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        </View>
      ) : (
        <LinearGradient colors={gradient.colors} start={gradient.start} end={gradient.end} style={styles.surface}>
          <View style={styles.content}>
            {icon}
            <Text style={variant === 'secondary' ? styles.textSecondary : styles.text} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Figma spec: every button is a fixed 249-wide pill. alignSelf:'center' so
  // a button sitting in a full-width parent (nearly every existing CTA —
  // Login/Signup/HelpDesk/ContactScreen/etc. previously rendered full-bleed
  // via implicit flex stretch) centers itself instead of sticking flush-left
  // next to full-width fields above it. Height is 48 (not the original
  // 35) — 35 undershot both iOS's 44pt and Android's 48dp minimum touch
  // target, and read as visibly thinner than the rest of the app's other
  // hand-rolled buttons, which mostly already sit at 44-48.
  base: {
    width: 249,
    height: 48,
    alignSelf: 'center',
    borderRadius: 999,
  },
  // Fills whatever box `base` (or a caller's override) resolves to, rather
  // than sizing itself — this is what lets flex:1/width:'100%' overrides on
  // the Pressable still visually take effect.
  surface: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
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
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.figma.border,
  },
  outlineDisabled: {
    borderColor: '#F3F4F6',
  },
  textOutline: {
    color: '#6B7280',
    fontWeight: '600',
  },
  textOutlineDisabled: {
    color: '#D1D5DB',
  },
  dashed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.inputBorder,
  },
  textDashed: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  muted: {
    backgroundColor: '#F3F4F6',
  },
  textMuted: {
    color: theme.colors.text,
    fontWeight: '600',
  },
});
