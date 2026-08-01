import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@jayedaad/ui-native';
import houseBg from '../../assets/images/splash-bg.webp';
// Updated import to use the WebP format
import logoBg from '../../assets/images/logo-bg.png';

const { width, height } = Dimensions.get('window');

// Same 3 dots that were already in the static markup — each now maps to one
// of these slides instead of just sitting there as decoration.
const SLIDES = [
  {
    tag: 'VERIFIED FIRST',
    title: 'Every listing\nchecked, twice.',
    subtitle: 'Our team verifies ownership papers and photos before a property ever reaches your feed.',
  },
  {
    tag: 'NATIONWIDE REACH',
    title: 'From Karachi\nto Islamabad.',
    subtitle: 'Search verified plots, homes, and commercial space across every major city in Pakistan.',
  },
  {
    tag: 'DIRECT TO AGENTS',
    title: "No middlemen,\njust results.",
    subtitle: 'Message verified agents and owners directly — no commission games, no runaround.',
  },
] as const;

const SLIDE_INTERVAL_MS = 3000;
const CROSSFADE_MS = 350;

export function AnimatedSplashScreen() {
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

  const slide = SLIDES[slideIndex];

  return (
    <View style={styles.root}>
      {/* 1. Full-bleed Background Image */}
      <Image source={houseBg} style={StyleSheet.absoluteFill} contentFit="cover" />

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

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.button} 
            activeOpacity={0.8}
            // Add your navigation logic here when ready
          >
            <Text style={styles.buttonText}>Continue →</Text>
          </TouchableOpacity>
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
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4, 
    zIndex: 1, 
  },
  watermark: {
    width: width * 1.5, 
    height: height * 0.7,
    transform: [
      { translateY: -40 } 
    ], 
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
  button: {
    backgroundColor: theme.colors.primary || '#13634B',
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});