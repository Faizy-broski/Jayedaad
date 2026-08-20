import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@jayedaad/ui-native';
import bgImage from '../../assets/images/explore-bg.png';

// Web counterpart: apps/web/components/shared/PremiumPromoCard.tsx — same
// copy/CTA, same explore-bg.png. Root cause of the earlier "photo isn't
// showing" issue: explore-bg.png is a TRANSPARENT-background cutout PNG (a
// villa render with the surrounding area punched out to alpha), not a
// rectangular photo — confirmed by opening the file. Fixed: the
// #034B37 -> #011B14 gradient is the actual opaque base fill, and the
// villa cutout sits on top in a corner at its own aspect ratio
// (contentFit="contain", not "cover").
//
// Sizing: `card` uses aspectRatio (331.58 / 208.73, the exact Figma frame
// ratio) instead of a fixed/min height, so this stays proportioned exactly
// like the design at any screen width. Clipping (overflow:hidden +
// borderRadius) lives on a separate absolute-fill `bgLayer` behind the
// text, not on `card` itself — an earlier version put overflow:hidden
// directly on `card` with a fixed height, which silently clipped the
// "Try free" button clean off the bottom whenever the title/subtitle
// wrapped to more lines than that fixed height budgeted for. Now, in the
// normal case content fits within the aspect-ratio height and the card
// looks exactly like the Figma frame; in a rare narrow-device edge case
// where text needs more room, `card` grows a little past the exact ratio
// instead of ever clipping text.
export function PremiumPromoCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.bgLayer}>
        <LinearGradient colors={['#034B37', '#011B14']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Image source={bgImage} style={styles.cutoutImage} contentFit="contain" />
      </View>

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
  // Figma frame: W 331.58 / H 208.73 — expressed as a ratio (not a fixed
  // height) so it holds exactly at any device width instead of only
  // matching on whatever width the frame happened to be designed at.
  card: {
    aspectRatio: 331.58 / 208.73,
    borderRadius: 25,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#011B14',
  },
  // Cutout sits bottom-right, sized generously so the villa itself reads
  // clearly rather than shrinking to fit — content column stays left/top
  // so the two don't overlap.
  cutoutImage: {
    position: 'absolute',
    right: -20,
    bottom: -16,
    width: 220,
    height: 190,
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
  // Sized to fill the card properly now that HomeScreen's premiumCardWrap
  // margin brings the card down close to Figma's actual 331.58pt width —
  // at the old edge-to-edge full-device width these same numbers read as
  // undersized/sparse; on this narrower card they fill it the way the
  // design shows (title wraps "Get listings 48 hours / before everyone
  // else." on 2 lines, same break the reference has).
  title: { color: theme.colors.bg, fontSize: 23, fontWeight: '800', lineHeight: 27, maxWidth: '92%' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13.5, lineHeight: 18, maxWidth: '88%' },
  button: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    // minHeight (not just paddingVertical) so this matches the app's other
    // CTA buttons at 48 instead of the ~34pt the padding alone implied.
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  buttonText: { color: '#03140F', fontSize: 14, fontWeight: '700' },
});
