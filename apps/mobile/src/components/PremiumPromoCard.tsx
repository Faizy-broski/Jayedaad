import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@jayedaad/ui-native';
import bgImage from '../../assets/images/explore-bg.png';

// Web counterpart: apps/web/components/shared/PremiumPromoCard.tsx — same
// copy/CTA, same explore-bg.png. The Figma layer panel's literal numbers
// (Image 11% on top of an opaque Linear 100% base) render as a solid green
// card with no visible photo at all on-device — 11% blended over a fully
// opaque base is imperceptible, confirmed. Flipped instead: the photo is
// the full-opacity base layer, and the #034B37 -> #011B14 gradient sits on
// top as a translucent wash (not opaque stops) — same two colors, same
// dominant-green result, but the photo stays genuinely visible underneath
// rather than only in theory.
export function PremiumPromoCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.card}>
      <Image source={bgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(3,75,55,0.45)', 'rgba(1,27,20,0.55)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Lighter color wash above means the photo underneath can be bright
          in spots — this keeps the text column readable regardless,
          independent of however dim/visible the green tint ends up. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.75, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="ribbon-outline" size={13} color={theme.colors.bg} />
          <Text style={styles.badgeText}>JAYEDAAD PREMIUM</Text>
        </View>

        <Text style={styles.title}>Get listings 48 hours before everyone else.</Text>
        <Text style={styles.subtitle}>Priority tours, dedicated advisor and zero platform fees.</Text>

        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Try free for 14 days</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma frame: W 331.58 / H 208.73 (~1.59:1) — height set to keep this
  // app's full-width-responsive card at roughly that same ratio instead of
  // the frame's fixed px dimensions.
  card: {
    height: 220,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#011B14',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
  },
  badgeText: { color: theme.colors.bg, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  title: { color: theme.colors.bg, fontSize: 21, fontWeight: '800', lineHeight: 26, maxWidth: '85%' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18, maxWidth: '90%' },
  button: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.bg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  buttonText: { color: '#03140F', fontSize: 13, fontWeight: '700' },
});
