import { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@jayedaad/ui-native';
import { AuthNavigator } from '../navigation/AuthNavigator';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

// Full-screen login/signup presentation — the auth screens (LoginScreen etc.)
// are laid out for a full page (brand mark, spaced-out fields, footer link),
// so a partial half-sheet was clipping content instead of giving it room.
// Slides up from the bottom over the app (MainStack, already mounted behind
// this overlay) rather than replacing it, so closing is instant with nothing
// to re-mount.
//
// Deliberately a plain absolutely-positioned overlay, NOT React Native's
// `Modal` — RN's Modal presents in its own separate native window on iOS,
// and React Navigation's native-stack (react-native-screens) rendered inside
// it ends up visually present but not receiving touches (confirmed: this is
// exactly what "half sheet shows, Log In does nothing, footer text missing"
// was). Staying in the same native view hierarchy as the rest of the app
// avoids that entirely.
export function AuthSheet({
  visible,
  onClose,
  initialRouteName,
}: {
  visible: boolean;
  onClose: () => void;
  // Which screen the sheet should open on — the gate can be blocked for
  // reasons other than "not logged in" (e.g. already signed in but email
  // not verified yet), and always defaulting to Login there would ask an
  // already-authenticated user to log in again instead of just finishing
  // verification. See AuthGateProvider's gateReason.
  initialRouteName?: keyof AuthStackParamList;
}) {
  const insets = useSafeAreaInsets();
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
          <SafeAreaView style={styles.flex} edges={['top']}>
            <View style={styles.navigatorWrap}>
              {/* Independent container: the outer NavigationContainer already
                  registers MainStack's navigator, and React Navigation only
                  allows one navigator directly under a given container.
                  AuthNavigator's screens only ever navigate among themselves,
                  so a fully separate navigation tree here is safe. */}
              <NavigationContainer independent>
                <AuthNavigator initialRouteName={initialRouteName} />
              </NavigationContainer>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
        {/* Positioned off insets.top directly (not left to SafeAreaView's
            padding + position:absolute interaction) so it sits a consistent
            distance below the status bar/notch on every device, instead of
            crowding right up against it. */}
        <Pressable
          style={[styles.closeButton, { top: insets.top + theme.spacing.sm }]}
          onPress={handleClose}
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color={theme.colors.muted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50, elevation: 50 },
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    height: '100%',
    backgroundColor: theme.colors.bg,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 1,
  },
  navigatorWrap: { flex: 1 },
});
