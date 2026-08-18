import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { theme } from './theme';

export interface StepDef {
  key: string;
  label: string;
}

export interface StepperProps {
  steps: StepDef[];
  activeIndex: number;
  // Furthest step index the user has validly unlocked — a step pill only
  // becomes tappable once its index is <= this (mirrors apps/web's submit
  // page maxStepReached/goToStep pattern). The guard lives here, not in
  // each screen, so every wizard gets it for free.
  maxReachedIndex: number;
  onStepPress: (index: number) => void;
}

// Presentational only — owns no step state itself, the screen does (same
// division of responsibility as web's inline JSX). Two stacked pieces: a
// thin progress-fill track, and a horizontally scrollable row of plain step
// labels (no numbers/checkmarks — the Figma reference this was built from
// shows labels only, reachability is the only "done" signal).
export function Stepper({ steps, activeIndex, maxReachedIndex, onStepPress }: StepperProps) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: (activeIndex + 1) / steps.length,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, steps.length, fill]);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.labelRow}>
        {steps.map((s, index) => {
          const active = index === activeIndex;
          const locked = index > maxReachedIndex;
          return (
            <Pressable key={s.key} disabled={locked} onPress={() => onStepPress(index)} style={styles.labelWrap}>
              <Text style={[styles.label, active ? styles.labelActive : locked ? styles.labelLocked : styles.labelReached]}>
                {s.label}
              </Text>
              {active && <View style={styles.underline} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.figma.border,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.figma.primary,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 20,
  },
  labelWrap: { alignItems: 'center', gap: 4 },
  label: { fontSize: 13 },
  labelActive: { fontWeight: '700', color: theme.colors.figma.primary },
  labelReached: { fontWeight: '500', color: '#374151' },
  labelLocked: { fontWeight: '500', color: '#9CA3AF' },
  underline: {
    width: '100%',
    height: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.figma.primary,
  },
});
