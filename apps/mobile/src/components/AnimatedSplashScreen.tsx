import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text, SafeAreaView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@jayedaad/ui-native';
import slide1Bg from '../../assets/images/splash-bg.webp';
// Renamed from "Skyline Penthouse.webp"/"Ocean Residence.webp" — spaces in
// the filename meant Metro's dev-server asset URL for these two specific
// images wasn't resolving on-device (splash-bg.webp, no space, always
// rendered fine), which is why slides 2/3 fell back to the root View's
// plain black background with only the watermark logo visible on top.
import slide2Bg from '../../assets/images/skyline-penthouse.webp';
import slide3Bg from '../../assets/images/ocean-residence.webp';
// Updated import to use the WebP format
import logoBg from '../../assets/images/logo-bg.png';

const { width, height } = Dimensions.get('window');

// Same 3 dots that were already in the static markup — each now maps to one
// of these slides instead of just sitting there as decoration. Each slide
// gets its own background image (previously all 3 shared splash-bg.webp,
// so the "slider" only ever looked like changing text over a static photo).
const SLIDES = [
  {
    tag: 'VERIFIED FIRST',
    title: 'Every listing\nchecked, twice.',
    subtitle: 'Our team verifies ownership papers and photos before a property ever reaches your feed.',
    image: slide1Bg,
  },
  {
    tag: 'NATIONWIDE REACH',
    title: 'From Karachi\nto Islamabad.',
    subtitle: 'Search verified plots, homes, and commercial space across every major city in Pakistan.',
    image: slide2Bg,
  },
  {
    tag: 'DIRECT TO AGENTS',
    title: "No middlemen,\njust results.",
    subtitle: 'Message verified agents and owners directly — no commission games, no runaround.',
    image: slide3Bg,
  },
] as const;

const SLIDE_INTERVAL_MS = 3000;
const CROSSFADE_MS = 350;
// Auto-continue into the app once every slide has had its full
// SLIDE_INTERVAL_MS on screen at least once — previously nothing dismissed
// this screen on its own terms at all (RootNavigator swapped it out purely
// on auth-init timing, often well under one slide's duration), and the
// Continue button had no onPress, so a user who wanted to skip ahead
// manually had no way to.
const AUTO_CONTINUE_MS = SLIDES.length * SLIDE_INTERVAL_MS;

export interface AnimatedSplashScreenProps {
  onContinue: () => void;
}

export function AnimatedSplashScreen({ onContinue }: AnimatedSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(textOpacity, { toValue: 0, duration: CROSSFADE_MS, useNativeDriver: true }).start(() => {
        setSlideIndex((i) => (i + 1) % SLIDES.length);
        Animated.timing(textOpacity, { toValue: 1, duration: CROSSFADE_MS, useNativeDriver: true }).start();
      });
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [textOpacity]);

  // Fires once, after the last slide has had its turn — lets a user who
  // doesn't tap Continue still land in the app instead of the carousel
  // looping forever. Tapping Continue fires the same callback early.
  useEffect(() => {
    const timer = setTimeout(onContinue, AUTO_CONTINUE_MS);
    return () => clearTimeout(timer);
  }, [onContinue]);

  const slide = SLIDES[slideIndex];

  return (
    <View style={styles.root}>
      {/* 1. Full-bleed Background Image — crossfades with the text on the
          same textOpacity value so the photo swap lands in the trough of
          the transition instead of hard-cutting. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: textOpacity }]}>
        <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>

      {/* 2. Giant Watermark Logo Overlay */}
      <View style={styles.watermarkContainer} pointerEvents="none">
        <Image 
          source={logoBg} 
          style={styles.watermark} 
          contentFit="contain" 
        />
      </View>

      {/* 3. Bottom-heavy Dark Gradient for Text Readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* 4. Foreground Content */}
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Animated.View style={{ opacity: textOpacity }}>
            {/* Tag */}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{slide.tag}</Text>
            </View>

            {/* Headings */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </Animated.View>

          {/* Pagination Indicators — one per slide, synced to slideIndex */}
          <View style={styles.pagination}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === slideIndex && styles.activeDot]} />
            ))}
          </View>

          {/* Continue Button — skips straight to the app instead of
              waiting for the remaining slides/AUTO_CONTINUE_MS timer. */}
          <Button label="Continue →" size="lg" onPress={onContinue} style={styles.button} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Was full-screen (absoluteFillObject, centered) — the watermark's lower
  // strokes landed directly under the title/subtitle text block, so the
  // logo's building-outline lines visibly cut through the copy every time
  // the slide changed. Constrained to the top ~48% of the screen (above
  // where contentContainer's text starts) so it stays a pure background
  // flourish behind the tag/hero area and never overlaps a word.
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.48,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
    zIndex: 1,
  },
  watermark: {
    width: width * 1.3,
    height: height * 0.42,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 2, 
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 100, 
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 44,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 40,
    paddingRight: 20, 
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  // width only — Button (@jayedaad/ui-native) supplies its own pill shape,
  // gradient fill, and label styling for size="lg".
  button: {
    width: '100%',
  },
});