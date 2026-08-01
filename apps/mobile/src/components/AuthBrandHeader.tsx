import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@jayedaad/ui-native';
import logoImage from '../../assets/images/jayedaad.webp';

// Logo icon + "JAYEDAAD"/tagline side-by-side — shared between the
// full-bleed-background auth screens (LoginScreen, SignupScreen) so the
// brand block stays identical instead of being copy-pasted per screen.
export function AuthBrandHeader() {
  return (
    <View style={styles.brand}>
      <View style={styles.logoBadge}>
        <Image source={logoImage} style={styles.logo} contentFit="contain" />
      </View>
      <View style={styles.brandText}>
        <Text style={styles.wordmark}>JAYEDAAD</Text>
        <Text style={styles.tagline}>Building Trust in Real Estate</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  logoBadge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  logo: { width: '100%', height: '100%' },
  brandText: { alignItems: 'flex-start' },
  wordmark: { fontSize: 22, fontWeight: '700', letterSpacing: 1, color: theme.colors.primary },
  tagline: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
});
