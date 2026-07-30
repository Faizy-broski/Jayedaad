import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@jayedaad/ui-native';
import logoImage from '../../assets/images/jayedaad.webp';

// Same faint skyline-silhouette motif as HomeScreen.tsx's HomeHeader — reused
// for brand consistency rather than inventing a new decorative element.
const SKYLINE_HEIGHTS = [18, 30, 14, 40, 22, 34, 16, 44, 24, 30, 14, 36, 20, 42, 18];

// Entrance sequence: the real logo mark scales+fades in, then a gentle
// looping pulse plays while RootNavigator waits on auth init. RN's built-in
// Animated API only — no new native animation dependency added.
export function AnimatedSplashScreen() {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    });
  }, [logoScale, logoOpacity, pulse]);

  return (
    <View style={styles.root}>
      <View style={styles.skylineRow} pointerEvents="none">
        {SKYLINE_HEIGHTS.map((h, i) => (
          <View key={i} style={[styles.skylineBar, { height: h }]} />
        ))}
      </View>

      <Animated.View
        style={[styles.badge, { opacity: logoOpacity, transform: [{ scale: Animated.multiply(logoScale, pulse) }] }]}
      >
        <Image source={logoImage} style={styles.logo} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
  },
  skylineRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    opacity: 0.14,
  },
  skylineBar: { width: 16, backgroundColor: '#ffffff', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  badge: {
    width: 176,
    height: 176,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: { width: '100%', height: '100%' },
});
