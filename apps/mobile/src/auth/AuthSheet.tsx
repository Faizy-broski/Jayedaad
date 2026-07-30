import { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@jayedaad/ui-native';
import { AuthNavigator } from '../navigation/AuthNavigator';

// Half-curved login/signup sheet: the app (MainStack, already mounted behind
// this overlay) stays visible and dimmed in the top portion, tapping it
// dismisses; the bottom ~72% is a rounded-top sheet holding the unmodified
// AuthNavigator stack.
//
// Deliberately a plain absolutely-positioned overlay, NOT React Native's
// `Modal` — RN's Modal presents in its own separate native window on iOS,
// and React Navigation's native-stack (react-native-screens) rendered inside
// it ends up visually present but not receiving touches (confirmed: this is
// exactly what "half sheet shows, Log In does nothing, footer text missing"
// was). Staying in the same native view hierarchy as the rest of the app
// avoids that entirely.
export function AuthSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, translateY, backdropOpacity]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <View style={styles.handle} />
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={theme.colors.muted} />
          </Pressable>
          <View style={styles.navigatorWrap}>
            {/* Independent container: the outer NavigationContainer already
                registers MainStack's navigator, and React Navigation only
                allows one navigator directly under a given container.
                AuthNavigator's screens only ever navigate among themselves,
                so a fully separate navigation tree here is safe. */}
            <NavigationContainer independent>
              <AuthNavigator />
            </NavigationContainer>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50, elevation: 50 },
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    height: '72%',
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingTop: theme.spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.lg,
    zIndex: 1,
  },
  navigatorWrap: { flex: 1 },
});
